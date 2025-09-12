import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Expense } from './expense.interface';
import { ExpenseDB } from './expense-db';
import { ApiService } from '../../core/services/api.service';
import { ClubContextService } from '../../core/services/club-context.service';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  expenses$ = this.expensesSubject.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private api: ApiService, private clubContext: ClubContextService) {}

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
}
