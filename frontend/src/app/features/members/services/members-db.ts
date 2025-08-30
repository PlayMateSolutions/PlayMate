import { Member } from '../../../shared/interfaces/member.interface';

export class MembersDB {
  private static dbName = 'PlayMateDB';
  private static storeName = 'members';
  private static version = 3;

  static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(MembersDB.dbName, MembersDB.version);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Create members store if it doesn't exist
        if (!db.objectStoreNames.contains(MembersDB.storeName)) {
          db.createObjectStore(MembersDB.storeName, { keyPath: 'id' });
        }
        
        // Create attendance stores if they don't exist (for compatibility with AttendanceDB)
        if (!db.objectStoreNames.contains('attendance')) {
          const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id' });
          attendanceStore.createIndex('memberId', 'memberId', { unique: false });
          attendanceStore.createIndex('date', 'date', { unique: false });
          attendanceStore.createIndex('membershipStatus', 'membershipStatus', { unique: false });
          attendanceStore.createIndex('dateRange', ['date', 'memberId'], { unique: false });
        }
        
        if (!db.objectStoreNames.contains('attendanceSettings')) {
          db.createObjectStore('attendanceSettings', { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getAll(): Promise<Member[]> {
    const db = await MembersDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MembersDB.storeName, 'readonly');
      const store = tx.objectStore(MembersDB.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Member[]);
      request.onerror = () => reject(request.error);
    });
  }

  static async setAll(members: Member[]): Promise<void> {
    const db = await MembersDB.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MembersDB.storeName, 'readwrite');
      const store = tx.objectStore(MembersDB.storeName);
      store.clear();
      for (const member of members) {
        // Ensure the object has an 'id' property for IndexedDB
        const toStore = { ...member, id: (member as any).ID ?? (member as any).id };
        store.put(toStore);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
