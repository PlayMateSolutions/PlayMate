import { Attendance } from '../../../shared/interfaces/attendance.interface';

export class AttendanceDB {
  private static dbName = 'PlayMateDB';
  private static storeName = 'attendance';

  static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(AttendanceDB.dbName, 1);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(AttendanceDB.storeName)) {
          db.createObjectStore(AttendanceDB.storeName, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getAll(): Promise<Attendance[]> {
    const db = await AttendanceDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AttendanceDB.storeName, 'readonly');
      const store = tx.objectStore(AttendanceDB.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Attendance[]);
      request.onerror = () => reject(request.error);
    });
  }

  static async setAll(records: Attendance[]): Promise<void> {
    const db = await AttendanceDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AttendanceDB.storeName, 'readwrite');
      const store = tx.objectStore(AttendanceDB.storeName);
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
