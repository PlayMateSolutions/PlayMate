import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Payment, PaymentSummary } from './payment.interface';
import { PaymentDB } from './payment-db';
import { AuthService } from '../../core/services/auth.service';
import { ClubContextService } from '../../core/services/club-context.service';
import { MemberService } from '../members/services/member.service';
import { Member } from '../../shared/interfaces/member.interface';

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: number;
    message: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'https://script.google.com/macros/s/AKfycbyMDOC9nYxJv8mgpqE6i6VFF3UUy9NGPSTAGxXzihntX4KLXMnFz6moNR9ZcDJm3vZ2/dev';
  private paymentsSubject = new BehaviorSubject<Payment[]>([]);
  private summarySubject = new BehaviorSubject<PaymentSummary | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private lastSyncSubject = new BehaviorSubject<Date | null>(null);
  
  public payments$ = this.paymentsSubject.asObservable();
  public summary$ = this.summarySubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public lastSync$ = this.lastSyncSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private clubContext: ClubContextService,
    private memberService: MemberService
  ) {
    // Initialize with empty data immediately to prevent blocking
    this.paymentsSubject.next([]);
    this.summarySubject.next(null);
    this.loadingSubject.next(false);
    this.lastSyncSubject.next(null);
    
    // Load data in background after a delay
    setTimeout(() => this.loadCachedData(), 1000);
  }

  private async loadCachedData(): Promise<void> {
    try {
      console.log('Loading cached payment data...');
      const cachedPayments = await PaymentDB.getAll();
      const lastSync = await PaymentDB.getLastSyncTime();
      
      console.log('Cached payment records:', cachedPayments.length);
      
      if (cachedPayments.length > 0) {
        // Link with current member data when loading from cache
        const linkedPayments = await this.linkWithMemberData(cachedPayments);
        this.paymentsSubject.next(linkedPayments);
        this.calculateSummary(linkedPayments);
      }
      
      this.lastSyncSubject.next(lastSync);
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  }

  private async initializeData(): Promise<void> {
    try {
      this.loadingSubject.next(true);
      
      // Load cached data first
      await this.loadCachedData();
      
      // Only sync if we have no cached data or it's been more than 5 minutes
      const lastSync = await PaymentDB.getLastSyncTime();
      const shouldSync = this.paymentsSubject.value.length === 0 || 
        !lastSync || 
        (new Date().getTime() - lastSync.getTime()) > 5 * 60 * 1000;
      
      if (shouldSync) {
        // Run sync in background to avoid blocking
        this.syncPayments().catch(error => {
          console.error('Background sync failed:', error);
        });
      }
      
    } catch (error) {
      console.error('Error initializing payment data:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async syncPayments(forceFullSync: boolean = false): Promise<void> {
    try {
      this.loadingSubject.next(true);
      
      const token = await this.authService.getAuthToken();
      const clubId = this.clubContext.getSportsClubId() || '';
      
      console.log('Payment sync - Token:', token ? 'Present' : 'Missing');
      console.log('Payment sync - Club ID:', clubId);
      
      // Prepare payload data
      let payloadData: any = {};
      
      // Use incremental sync unless forced full sync
      if (!forceFullSync) {
        const lastPaymentId = await PaymentDB.getLastPaymentId();
        if (lastPaymentId) {
          payloadData.lastPaymentId = lastPaymentId;
        }
      }

      let params = new HttpParams()
        .set('action', 'getPayments')
        .set('sportsClubId', clubId)
        .set('authorization', token ? 'Bearer ' + token : '');

      // Add payload if we have data
      if (Object.keys(payloadData).length > 0) {
        params = params.set('payload', JSON.stringify(payloadData));
      }

      const headers = new HttpHeaders({
        'Content-Type': 'text/plain;charset=utf-8'
      });

      const options = {
        headers,
        params,
        responseType: 'json' as const,
        observe: 'body' as const
      };

      const response = await this.http.get<ApiResponse<Payment[]>>(
        this.apiUrl,
        options
      ).toPromise();

      if (response?.status === 'error') {
        throw new Error(response.error?.message || 'API returned error status');
      }

      if (!response?.data) {
        throw new Error('No data received from API');
      }

      const newPayments = response.data;

      if (newPayments && newPayments.length > 0) {
        // Link with member data
        const linkedPayments = await this.linkWithMemberData(newPayments);
        
        if (forceFullSync || !await PaymentDB.getLastPaymentId()) {
          // Full sync - replace all data
          await PaymentDB.setAll(linkedPayments);
        } else {
          // Incremental sync - add new records
          await PaymentDB.addRecords(linkedPayments);
        }

        // Update last payment ID and sync time
        const maxId = Math.max(...linkedPayments.map(p => parseInt(p.id || '0'))).toString();
        await PaymentDB.setLastPaymentId(maxId);
        await PaymentDB.setLastSyncTime(new Date());
        this.lastSyncSubject.next(new Date());

        // Reload all data and recalculate analytics
        const allPayments = await PaymentDB.getAll();
        this.paymentsSubject.next(allPayments);
        this.calculateSummary(allPayments);
      }

    } catch (error) {
      console.error('Error syncing payments:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private async linkWithMemberData(payments: Payment[]): Promise<Payment[]> {
    try {
      console.log('Linking payment records with member data:', payments.length);
      
      // Get all members to link data with a timeout
      const members = await new Promise<Member[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('Member service timeout, proceeding without member data');
          resolve([]);
        }, 5000);
        
        this.memberService.getMembers().subscribe({
          next: (result) => {
            clearTimeout(timeout);
            console.log('Members fetched for linking:', result.members.length);
            resolve(result.members);
          },
          error: (error) => {
            clearTimeout(timeout);
            console.error('Error fetching members:', error);
            resolve([]);
          }
        });
      });

      // Log some samples to debug
      console.log('Sample member IDs:', members.slice(0, 3).map(m => `[${typeof m.id}] ${m.id}`));
      console.log('Sample payment member IDs:', payments.slice(0, 3).map(p => `[${typeof p.memberId}] ${p.memberId}`));

      // Create map with normalized string IDs
      const memberMap = new Map(members.map(m => [String(m.id).trim(), m]));

      return payments.map(payment => {
        const memberId = String(payment.memberId).trim();
        const member = memberMap.get(memberId);
        
        if (!member) {
          console.log(`No member found for ID: [${typeof payment.memberId}] ${payment.memberId}`);
        }
        
        return {
          ...payment,
          memberName: member ? `${member.firstName} ${member.lastName}`.trim() : `Unknown Member [${memberId}]`
        };
      });
    } catch (error) {
      console.error('Error linking member data:', error);
      return payments;
    }
  }

  private calculateSummary(payments: Payment[]) {
    if (payments.length === 0) {
      this.summarySubject.next(null);
      return;
    }
    
    const summary: PaymentSummary = {
      totalPayments: payments.length,
      totalAmount: 0,
      uniqueMembers: new Set(payments.map(p => p.memberId)).size,
      monthBreakdown: {}
    };

    payments.forEach(payment => {
      summary.totalAmount += payment.amount;

      const date = new Date(payment.date);
      const monthKey = date.toISOString().substring(0, 7);
      
      if (!summary.monthBreakdown[monthKey]) {
        summary.monthBreakdown[monthKey] = {
          count: 0,
          amount: 0
        };
      }

      summary.monthBreakdown[monthKey].count++;
      summary.monthBreakdown[monthKey].amount += payment.amount;
    });

    this.summarySubject.next(summary);
  }

  async refreshData(): Promise<void> {
    await this.syncPayments();
    this.clubContext.setLastPaymentRefresh(new Date());
  }

  async loadData(): Promise<void> {
    await this.initializeData();
  }

  getPaymentsByMember(memberId: string): Observable<Payment[]> {
    return this.payments$.pipe(
      map(payments => payments.filter(record => record.memberId === memberId))
    );
  }

  getPaymentsByDateRange(startDate: Date, endDate: Date): Observable<Payment[]> {
    return this.payments$.pipe(
      map(payments => payments.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      }))
    );
  }

  // Get current summary - returns immediately with cached data
  getPaymentSummary(): PaymentSummary {
    return this.summarySubject.value || {
      totalPayments: 0,
      totalAmount: 0,
      uniqueMembers: 0,
      monthBreakdown: {}
    };
  }
}
