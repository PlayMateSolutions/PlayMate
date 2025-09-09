import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, of, combineLatest } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ClubContextService } from '../../../core/services/club-context.service';
import { MemberService } from '../../members/services/member.service';
import { AttendanceDB } from './attendance-db';
import { Attendance, AttendanceFilters, AttendanceAnalytics, DailyAttendanceStats } from '../../../shared/interfaces/attendance.interface';
import { Member } from '../../../shared/interfaces/member.interface';

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
export class AttendanceService {
  private apiUrl = environment.apiUrl;
  private attendanceSubject = new BehaviorSubject<Attendance[]>([]);
  private analyticsSubject = new BehaviorSubject<AttendanceAnalytics | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private lastSyncSubject = new BehaviorSubject<Date | null>(null);

  public attendance$ = this.attendanceSubject.asObservable();
  public analytics$ = this.analyticsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public lastSync$ = this.lastSyncSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private clubContext: ClubContextService,
    private memberService: MemberService
  ) {
    // Initialize with empty data immediately to prevent blocking
    this.attendanceSubject.next([]);
    this.analyticsSubject.next(null);
    this.loadingSubject.next(false);
    this.lastSyncSubject.next(null);
    
    // Load data in background after a delay
    setTimeout(() => this.loadCachedData(), 1000);
  }

  private async loadCachedData(): Promise<void> {
    try {
      console.log('Loading cached attendance data...');
      const cachedAttendance = await AttendanceDB.getAll();
      const lastSync = await AttendanceDB.getLastSyncTime();
      
      console.log('Cached attendance records:', cachedAttendance.length);
      
      if (cachedAttendance.length > 0) {
        this.attendanceSubject.next(cachedAttendance);
        this.calculateAnalytics(cachedAttendance);
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
      const lastSync = await AttendanceDB.getLastSyncTime();
      const shouldSync = this.attendanceSubject.value.length === 0 || 
        !lastSync || 
        (new Date().getTime() - lastSync.getTime()) > 5 * 60 * 1000;
      
      if (shouldSync) {
        // Run sync in background to avoid blocking
        this.syncAttendance().catch(error => {
          console.error('Background sync failed:', error);
        });
      }
      
    } catch (error) {
      console.error('Error initializing attendance data:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async syncAttendance(forceFullSync: boolean = false): Promise<void> {
    try {
      this.loadingSubject.next(true);
      
      const token = await this.authService.getAuthToken();
      const clubId = this.clubContext.getSportsClubId() || '';
      
      console.log('Attendance sync - Token:', token ? 'Present' : 'Missing');
      console.log('Attendance sync - Club ID:', clubId);
      
      // Prepare payload data like member service
      let payloadData: any = {};
      
      // Use incremental sync unless forced full sync
      if (!forceFullSync) {
        const lastAttendanceId = await AttendanceDB.getLastAttendanceId();
        if (lastAttendanceId) {
          payloadData.lastAttendanceId = lastAttendanceId;
        }
      }

      let params = new HttpParams()
        .set('action', 'getAttendance')
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

      const response = await this.http.get<ApiResponse<Attendance[]>>(
        this.apiUrl,
        options
      ).toPromise();

      if (response?.status === 'error') {
        throw new Error(response.error?.message || 'API returned error status');
      }

      if (response?.status === 'success' && response.data) {
        let attendanceRecords = Array.isArray(response.data) ? response.data : [response.data];
        
        // Link with member data
        attendanceRecords = await this.linkWithMemberData(attendanceRecords);
        
        if (forceFullSync || !await AttendanceDB.getLastAttendanceId()) {
          // Full sync - replace all data
          await AttendanceDB.setAll(attendanceRecords);
        } else {
          // Incremental sync - add new records
          await AttendanceDB.addRecords(attendanceRecords);
        }

        // Update last attendance ID and sync time
        if (attendanceRecords.length > 0) {
          const maxId = Math.max(...attendanceRecords.map(r => parseInt((r as any).id || '0'))).toString();
          await AttendanceDB.setLastAttendanceId(maxId);
        }
        
        await AttendanceDB.setLastSyncTime(new Date());
        this.lastSyncSubject.next(new Date());
        this.clubContext.setLastAttendanceRefresh(new Date());

        // Reload all data and recalculate analytics
        const allAttendance = await AttendanceDB.getAll();
        this.attendanceSubject.next(allAttendance);
        this.calculateAnalytics(allAttendance);
      }

    } catch (error) {
      console.error('Error syncing attendance:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private async linkWithMemberData(attendanceRecords: Attendance[]): Promise<Attendance[]> {
    try {
      console.log('Linking attendance records with member data:', attendanceRecords.length);
      
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

      const memberMap = new Map(members.map(m => [m.id, m]));
      console.log('Member map created with', memberMap.size, 'members');

      return attendanceRecords.map(record => {
        const member = memberMap.get(record.memberId);
        const linkedRecord = {
          ...record,
          memberName: member ? `${member.firstName} ${member.lastName}`.trim() : 'Unknown Member',
          membershipStatus: record.membershipStatus || 'unknown'
        };
        
        if (!member && members.length > 0) {
          console.warn('Member not found for attendance record:', record.memberId);
        }
        
        return linkedRecord;
      });
    } catch (error) {
      console.error('Error linking member data:', error);
      return attendanceRecords;
    }
  }

  getFilteredAttendance(filters: AttendanceFilters): Observable<Attendance[]> {
    return this.attendance$.pipe(
      map(attendance => this.applyFilters(attendance, filters))
    );
  }

  private applyFilters(attendance: Attendance[], filters: AttendanceFilters): Attendance[] {
    let filtered = [...attendance];

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= filters.startDate!;
      });
    }

    if (filters.endDate) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate <= filters.endDate!;
      });
    }

    // Member filter
    if (filters.memberId) {
      filtered = filtered.filter(record => record.memberId === filters.memberId);
    }

    // Membership status filter
    if (filters.membershipStatus && filters.membershipStatus !== 'all') {
      filtered = filtered.filter(record => record.membershipStatus === filters.membershipStatus);
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.memberName?.toLowerCase().includes(searchTerm) ||
        record.notes?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }

  private calculateAnalytics(attendance: Attendance[]): void {
    if (attendance.length === 0) {
      this.analyticsSubject.next(null);
      return;
    }

    // Group by date
    const dailyStatsMap = new Map<string, DailyAttendanceStats>();
    const memberActivityMap = new Map<string, Set<string>>(); // memberId -> set of dates
    const hourlyStats = new Map<number, number>();

    attendance.forEach(record => {
      const dateStr = new Date(record.date).toDateString();
      const hour = new Date(record.checkInTime).getHours();
      
      // Daily stats
      if (!dailyStatsMap.has(dateStr)) {
        dailyStatsMap.set(dateStr, {
          date: dateStr,
          totalCheckins: 0,
          activeMembers: 0,
          expiredMembers: 0,
          averageDuration: 0,
          uniqueMembers: 0
        });
      }

      const dayStats = dailyStatsMap.get(dateStr)!;
      dayStats.totalCheckins++;
      
      if (record.membershipStatus === 'active') {
        dayStats.activeMembers++;
      } else if (record.membershipStatus === 'expired') {
        dayStats.expiredMembers++;
      }

      if (record.duration) {
        dayStats.averageDuration = (dayStats.averageDuration + record.duration) / 2;
      }

      // Member activity tracking
      if (!memberActivityMap.has(record.memberId)) {
        memberActivityMap.set(record.memberId, new Set());
      }
      memberActivityMap.get(record.memberId)!.add(dateStr);

      // Hourly stats
      hourlyStats.set(hour, (hourlyStats.get(hour) || 0) + 1);
    });

    // Update unique members per day
    dailyStatsMap.forEach((stats, dateStr) => {
      let uniqueMembersForDay = 0;
      memberActivityMap.forEach((dates) => {
        if (dates.has(dateStr)) {
          uniqueMembersForDay++;
        }
      });
      stats.uniqueMembers = uniqueMembersForDay;
    });

    const dailyStats = Array.from(dailyStatsMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate summary statistics
    const totalCheckins = dailyStats.map(d => d.totalCheckins);
    const totalActiveMembers = memberActivityMap.size;
    const averageDaily = totalCheckins.reduce((a, b) => a + b, 0) / totalCheckins.length || 0;
    const minDaily = Math.min(...totalCheckins) || 0;
    const maxDaily = Math.max(...totalCheckins) || 0;
    
    const totalActiveAttendance = attendance.filter(a => a.membershipStatus === 'active').length;
    const totalExpiredAttendance = attendance.filter(a => a.membershipStatus === 'expired').length;
    const activeVsExpiredRatio = totalExpiredAttendance > 0 ? totalActiveAttendance / totalExpiredAttendance : totalActiveAttendance;

    // Find most active day
    const dayOfWeekCount = new Map<string, number>();
    dailyStats.forEach(stats => {
      const dayOfWeek = new Date(stats.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeekCount.set(dayOfWeek, (dayOfWeekCount.get(dayOfWeek) || 0) + stats.totalCheckins);
    });
    
    const mostActiveDay = Array.from(dayOfWeekCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Monday';

    // Calculate weekly growth
    const recentWeeks = dailyStats.slice(-14);
    const firstWeekTotal = recentWeeks.slice(0, 7).reduce((sum, day) => sum + day.totalCheckins, 0);
    const secondWeekTotal = recentWeeks.slice(7, 14).reduce((sum, day) => sum + day.totalCheckins, 0);
    const weeklyGrowth = firstWeekTotal > 0 ? ((secondWeekTotal - firstWeekTotal) / firstWeekTotal) * 100 : 0;

    // Peak hours
    const peakHours = Array.from(hourlyStats.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const analytics: AttendanceAnalytics = {
      dailyStats,
      summary: {
        totalActiveUsers: totalActiveMembers,
        averageDaily: Math.round(averageDaily * 100) / 100,
        minDaily,
        maxDaily,
        activeVsExpiredRatio: Math.round(activeVsExpiredRatio * 100) / 100,
        totalAttendanceRecords: attendance.length
      },
      trends: {
        weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
        mostActiveDay,
        peakHours
      }
    };

    this.analyticsSubject.next(analytics);
  }

  async refreshData(): Promise<void> {
    await this.syncAttendance(true);
  }

  async loadData(): Promise<void> {
    await this.initializeData();
  }

  getAttendanceByMember(memberId: string): Observable<Attendance[]> {
    return this.attendance$.pipe(
      map(attendance => attendance.filter(record => record.memberId === memberId))
    );
  }

  getAttendanceByDateRange(startDate: Date, endDate: Date): Observable<Attendance[]> {
    return this.attendance$.pipe(
      map(attendance => attendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      }))
    );
  }
}
