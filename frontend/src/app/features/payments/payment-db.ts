import { Payment } from './payment.interface';
import { PlayMateDB } from '../../core/services/playmate-db';

export class PaymentDB {
  private static dbName = 'PlayMateDB';
  private static storeName = 'payments';
  private static version = 3;

  static openDB(): Promise<IDBDatabase> {
    console.log('[PaymentDB] Starting database open...', { name: PaymentDB.dbName, version: PlayMateDB.version });
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(PaymentDB.dbName, PlayMateDB.version);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        PlayMateDB.onUpgrade(db);
      };
      request.onsuccess = () => {
        const db = request.result;
        console.log('[PaymentDB] Database opened successfully', {
          name: db.name,
          version: db.version,
          objectStores: Array.from(db.objectStoreNames)
        });
        resolve(db);
      };
      request.onerror = () => {
        console.error('[PaymentDB] Error opening database:', request.error);
        reject(request.error);
      };
    });
  }

  static async setAll(payments: Payment[]): Promise<void> {
    const db = await PaymentDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PaymentDB.storeName, 'readwrite');
      const store = tx.objectStore(PaymentDB.storeName);
      
      // Clear existing records
      const clearRequest = store.clear();
      clearRequest.onerror = () => reject(clearRequest.error);
      
      clearRequest.onsuccess = () => {
        // Add new records
        let completed = 0;
        const total = payments.length;
        
        payments.forEach(payment => {
          const request = store.add(payment);
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

  static async addRecords(payments: Payment[]): Promise<void> {
    const db = await PaymentDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PaymentDB.storeName, 'readwrite');
      const store = tx.objectStore(PaymentDB.storeName);
      
      let completed = 0;
      const total = payments.length;
      
      payments.forEach(payment => {
        const request = store.put(payment);
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

  static async getAll(): Promise<Payment[]> {
    const db = await PaymentDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PaymentDB.storeName, 'readonly');
      const store = tx.objectStore(PaymentDB.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result as Payment[];
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async getLastPaymentId(): Promise<string | null> {
    try {
      return localStorage.getItem('playmate_lastPaymentId');
    } catch (error) {
      console.error('Error getting last payment ID from localStorage:', error);
      return null;
    }
  }

  static async setLastPaymentId(id: string): Promise<void> {
    try {
      localStorage.setItem('playmate_lastPaymentId', id);
    } catch (error) {
      console.error('Error setting last payment ID to localStorage:', error);
      throw error;
    }
  }

  static async getLastSyncTime(): Promise<Date | null> {
    try {
      const timeStr = localStorage.getItem('playmate_lastSyncTime');
      return timeStr ? new Date(timeStr) : null;
    } catch (error) {
      console.error('Error getting last sync time from localStorage:', error);
      return null;
    }
  }

  static async setLastSyncTime(time: Date): Promise<void> {
    try {
      localStorage.setItem('playmate_lastSyncTime', time.toISOString());
    } catch (error) {
      console.error('Error setting last sync time to localStorage:', error);
      throw error;
    }
  }

  /**
   * Clear all payment-related settings from localStorage
   */
  static clearSettings(): void {
    try {
      localStorage.removeItem('playmate_lastPaymentId');
      localStorage.removeItem('playmate_lastSyncTime');
    } catch (error) {
      console.error('Error clearing payment settings from localStorage:', error);
    }
  }
}
