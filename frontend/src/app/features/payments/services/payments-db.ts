import { Payment } from '../../../shared/interfaces/payment.interface';

export class PaymentsDB {
  private static dbName = 'PlayMateDB';
  private static storeName = 'payments';

  static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(PaymentsDB.dbName, 1);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(PaymentsDB.storeName)) {
          db.createObjectStore(PaymentsDB.storeName, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getAll(): Promise<Payment[]> {
    const db = await PaymentsDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PaymentsDB.storeName, 'readonly');
      const store = tx.objectStore(PaymentsDB.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Payment[]);
      request.onerror = () => reject(request.error);
    });
  }

  static async setAll(records: Payment[]): Promise<void> {
    const db = await PaymentsDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PaymentsDB.storeName, 'readwrite');
      const store = tx.objectStore(PaymentsDB.storeName);
      store.clear();
      for (const record of records) {
        const toStore = { ...record, id: (record as any).id ?? (record as any).ID };
        store.put(toStore);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
