export class PlayMateDB {
  static dbName = 'PlayMateDB';
  static version = 4; // Bump this when you add/change stores

  static onUpgrade(db: IDBDatabase) {
    // Members store
    if (!db.objectStoreNames.contains('members')) {
      db.createObjectStore('members', { keyPath: 'id' });
    }
    // Payments store
    if (!db.objectStoreNames.contains('payments')) {
      const store = db.createObjectStore('payments', { keyPath: 'id' });
      store.createIndex('memberId', 'memberId', { unique: false });
      store.createIndex('date', 'date', { unique: false });
      store.createIndex('paymentType', 'paymentType', { unique: false });
    }
    // Attendance store
    if (!db.objectStoreNames.contains('attendance')) {
      const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id' });
      attendanceStore.createIndex('memberId', 'memberId', { unique: false });
      attendanceStore.createIndex('date', 'date', { unique: false });
      attendanceStore.createIndex('membershipStatus', 'membershipStatus', { unique: false });
      attendanceStore.createIndex('dateRange', ['date', 'memberId'], { unique: false });
    }
  }

  /**
   * Deletes the entire PlayMateDB IndexedDB database
   */
  static deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.deleteDatabase(PlayMateDB.dbName);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event);
      request.onblocked = () => reject(new Error('Delete blocked'));
    });
  }
}
