import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Expense } from './expense.interface';
import { ExpenseDB } from './expense-db';
import { ApiService } from '../../core/services/api.service';
import { ClubContextService } from '../../core/services/club-context.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  expenses$ = this.expensesSubject.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(
    private api: ApiService,
    private clubContext: ClubContextService,
    private authService: AuthService
  ) {}

  async loadCachedData() {
    try {
      const cachedExpenses = await ExpenseDB.getAll();
      this.expensesSubject.next(cachedExpenses);
    } catch (err) {
      this.expensesSubject.next([]);
    }
  }

  async syncExpenses(): Promise<void> {
    this.loadingSubject.next(true);
    try {
      const sportsClubId = this.clubContext.getSportsClubId() || '';
      const result = await this.api.get<any>('getExpenses', sportsClubId);
      if (result.status === 'success' && Array.isArray(result.data)) {
        await ExpenseDB.setAll(result.data);
        this.expensesSubject.next(result.data);
        await ExpenseDB.setLastSyncTime(new Date());
      } else {
        this.expensesSubject.next([]);
      }
    } catch (err) {
      this.expensesSubject.next([]);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async refreshData(): Promise<void> {
    await this.syncExpenses();
  }

  async loadData(): Promise<void> {
    await this.loadCachedData();
  }

  async addExpense(expense: Partial<Expense>): Promise<void> {
    // Generate a unique id for the expense
    const id = '0';
    const newExpense: Expense = {
      id,
      date: expense.date || new Date().toISOString(),
      category: expense.category || '',
      notes: expense.notes || '',
      amount: Number(expense.amount) || 0,
      paymentType: 'Cash',
      recordedBy: expense.recordedBy || '',
      payee: expense.payee || '',
      transactionId: expense.transactionId || '',
    };

    const result = await this.api.post<any>('recordExpense', newExpense);

    if (result.status === 'error') {
      throw new Error(result.error?.message || 'Failed to record expense');
    }

    // --- End API call ---
    await ExpenseDB.addRecords([newExpense]);
    // Update local cache
    const all = await ExpenseDB.getAll();
    this.expensesSubject.next(all);
  }
}
