import { Expense } from './expense.interface';
import { PlayMateDB } from '../../core/services/playmate-db';

export class ExpenseDB {
  private static dbName = PlayMateDB.dbName;
  private static storeName = 'expenses';

  static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(ExpenseDB.dbName, PlayMateDB.version);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        PlayMateDB.onUpgrade(db);
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  static async setAll(expenses: Expense[]): Promise<void> {
    const db = await ExpenseDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ExpenseDB.storeName, 'readwrite');
      const store = tx.objectStore(ExpenseDB.storeName);
      const clearRequest = store.clear();
      clearRequest.onerror = () => reject(clearRequest.error);
      clearRequest.onsuccess = () => {
        let completed = 0;
        const total = expenses.length;
        expenses.forEach(expense => {
          const request = store.add(expense);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            completed++;
            if (completed === total) {
              resolve();
            }
          };
        });
      };
    });
  }

  static async addRecords(expenses: Expense[]): Promise<void> {
    const db = await ExpenseDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ExpenseDB.storeName, 'readwrite');
      const store = tx.objectStore(ExpenseDB.storeName);
      let completed = 0;
      const total = expenses.length;
      expenses.forEach(expense => {
        const request = store.put(expense);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
      });
      tx.onerror = () => reject(tx.error);
    });
  }

  static async getAll(): Promise<Expense[]> {
    const db = await ExpenseDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ExpenseDB.storeName, 'readonly');
      const store = tx.objectStore(ExpenseDB.storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result as Expense[]);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async getLastSyncTime(): Promise<Date | null> {
    try {
      const timeStr = localStorage.getItem('playmate_lastExpenseSyncTime');
      return timeStr ? new Date(timeStr) : null;
    } catch (error) {
      console.error('Error getting last expense sync time from localStorage:', error);
      return null;
    }
  }

  static async setLastSyncTime(date: Date): Promise<void> {
    try {
      localStorage.setItem('playmate_lastExpenseSyncTime', date.toISOString());
    } catch (error) {
      console.error('Error setting last expense sync time to localStorage:', error);
      throw error;
    }
  }
}
