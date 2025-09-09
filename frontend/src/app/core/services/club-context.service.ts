import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClubContextService {
  private sportsClubId: string | null = null;
  private readonly STORAGE_KEY = 'sportsClubId';
  private readonly MEMBER_REFRESH_KEY = 'lastMemberRefresh';
  private readonly PAYMENT_REFRESH_KEY = 'lastPaymentRefresh';
  private readonly ATTENDANCE_REFRESH_KEY = 'lastAttendanceRefresh';

  constructor() {
    // Load from localStorage on service init
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.sportsClubId = stored;
    }
  }

  setSportsClubId(id: string) {
    this.sportsClubId = id;
    localStorage.setItem(this.STORAGE_KEY, id);
  }

  getSportsClubId(): string | null {
    return this.sportsClubId;
  }

  clear() {
    this.sportsClubId = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  setLastMemberRefresh(date: Date) {
    localStorage.setItem(this.MEMBER_REFRESH_KEY, date.toISOString());
  }
  getLastMemberRefresh(): Date | null {
    const stored = localStorage.getItem(this.MEMBER_REFRESH_KEY);
    return stored ? new Date(stored) : null;
  }
  setLastPaymentRefresh(date: Date) {
    localStorage.setItem(this.PAYMENT_REFRESH_KEY, date.toISOString());
  }
  getLastPaymentRefresh(): Date | null {
    const stored = localStorage.getItem(this.PAYMENT_REFRESH_KEY);
    return stored ? new Date(stored) : null;
  }
  setLastAttendanceRefresh(date: Date) {
    localStorage.setItem(this.ATTENDANCE_REFRESH_KEY, date.toISOString());
  }
  getLastAttendanceRefresh(): Date | null {
    const stored = localStorage.getItem(this.ATTENDANCE_REFRESH_KEY);
    return stored ? new Date(stored) : null;
  }
}
