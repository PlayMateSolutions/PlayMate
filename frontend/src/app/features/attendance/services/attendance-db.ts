import { Attendance } from '../../../shared/interfaces/attendance.interface';

export class AttendanceDB {
  private static dbName = 'PlayMateDB';
  private static storeName = 'attendance';
  private static settingsStoreName = 'attendanceSettings';
  private static version = 2;

  static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(AttendanceDB.dbName, AttendanceDB.version);
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Create attendance store if it doesn't exist
        if (!db.objectStoreNames.contains(AttendanceDB.storeName)) {
          const store = db.createObjectStore(AttendanceDB.storeName, { keyPath: 'id' });
          // Create indexes for efficient querying
          store.createIndex('memberId', 'memberId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('membershipStatus', 'membershipStatus', { unique: false });
          store.createIndex('dateRange', ['date', 'memberId'], { unique: false });
        }
        
        // Create settings store for sync tracking
        if (!db.objectStoreNames.contains(AttendanceDB.settingsStoreName)) {
          db.createObjectStore(AttendanceDB.settingsStoreName, { keyPath: 'key' });
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
      request.onsuccess = () => {
        const records = request.result as Attendance[];
        // Ensure dates are properly converted
        const convertedRecords = records.map(record => ({
          ...record,
          date: new Date(record.date),
          checkInTime: new Date(record.checkInTime),
          checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined
        }));
        resolve(convertedRecords);
      };
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
        const toStore = { 
          ...record, 
          id: (record as any).id ?? (record as any).ID,
          date: new Date(record.date),
          checkInTime: new Date(record.checkInTime),
          checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined
        };
        store.put(toStore);
      }
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  static async addRecords(records: Attendance[]): Promise<void> {
    const db = await AttendanceDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AttendanceDB.storeName, 'readwrite');
      const store = tx.objectStore(AttendanceDB.storeName);
      
      for (const record of records) {
        const toStore = { 
          ...record, 
          id: (record as any).id ?? (record as any).ID,
          date: new Date(record.date),
          checkInTime: new Date(record.checkInTime),
          checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined
        };
        store.put(toStore);
      }
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  static async getByDateRange(startDate: Date, endDate: Date): Promise<Attendance[]> {
    const db = await AttendanceDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AttendanceDB.storeName, 'readonly');
      const store = tx.objectStore(AttendanceDB.storeName);
      const index = store.index('date');
      
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);
      
      request.onsuccess = () => {
        const records = request.result as Attendance[];
        const convertedRecords = records.map(record => ({
          ...record,
          date: new Date(record.date),
          checkInTime: new Date(record.checkInTime),
          checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined
        }));
        resolve(convertedRecords);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async getByMemberId(memberId: string): Promise<Attendance[]> {
    const db = await AttendanceDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AttendanceDB.storeName, 'readonly');
      const store = tx.objectStore(AttendanceDB.storeName);
      const index = store.index('memberId');
      const request = index.getAll(memberId);
      
      request.onsuccess = () => {
        const records = request.result as Attendance[];
        const convertedRecords = records.map(record => ({
          ...record,
          date: new Date(record.date),
          checkInTime: new Date(record.checkInTime),
          checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined
        }));
        resolve(convertedRecords);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async getLastAttendanceId(): Promise<string | null> {
    const db = await AttendanceDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AttendanceDB.settingsStoreName, 'readonly');
      const store = tx.objectStore(AttendanceDB.settingsStoreName);
      const request = store.get('lastAttendanceId');
      
      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async setLastAttendanceId(id: string): Promise<void> {
    const db = await AttendanceDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AttendanceDB.settingsStoreName, 'readwrite');
      const store = tx.objectStore(AttendanceDB.settingsStoreName);
      const request = store.put({ key: 'lastAttendanceId', value: id });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getLastSyncTime(): Promise<Date | null> {
    const db = await AttendanceDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AttendanceDB.settingsStoreName, 'readonly');
      const store = tx.objectStore(AttendanceDB.settingsStoreName);
      const request = store.get('lastSyncTime');
      
      request.onsuccess = () => {
        const result = request.result?.value;
        resolve(result ? new Date(result) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async setLastSyncTime(time: Date): Promise<void> {
    const db = await AttendanceDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AttendanceDB.settingsStoreName, 'readwrite');
      const store = tx.objectStore(AttendanceDB.settingsStoreName);
      const request = store.put({ key: 'lastSyncTime', value: time.toISOString() });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
