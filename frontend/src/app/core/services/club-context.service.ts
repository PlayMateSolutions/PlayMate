import { Injectable } from '@angular/core';
import { Spreadsheet } from 'src/app/shared/interfaces/spreadsheet.interface';

@Injectable({ providedIn: 'root' })
export class ClubContextService {
  
  private sportsClubId: string | null = null;
  private readonly STORAGE_KEY = 'sportsClubId';
  private readonly MEMBER_REFRESH_KEY = 'lastMemberRefresh';
  private readonly PAYMENT_REFRESH_KEY = 'lastPaymentRefresh';
  private readonly ATTENDANCE_REFRESH_KEY = 'lastAttendanceRefresh';
  private readonly DARK_MODE_KEY = 'darkMode';
  private readonly LANGUAGE_KEY = 'language';

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

  setSpreadSheet(selectedDoc: Spreadsheet | null) {
    if (!selectedDoc) {
      localStorage.removeItem('selectedSpreadsheet');
      return;
    }
    localStorage.setItem('selectedSpreadsheet', JSON.stringify(selectedDoc));
  }

  getSpreadSheet(): Spreadsheet | null {
    const stored = localStorage.getItem('selectedSpreadsheet');
    return stored ? JSON.parse(stored) : null;
  }

  clear() {
    this.sportsClubId = this.getSportsClubId();
    localStorage.clear();
    this.setSportsClubId(this.sportsClubId!);// Retain sportsClubId as the user rarely changes it
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
  setDarkMode(enabled: boolean) {
    localStorage.setItem(this.DARK_MODE_KEY, enabled.toString());
  }
  getDarkMode(): boolean {
    return localStorage.getItem(this.DARK_MODE_KEY) === 'true';
  }
  setLanguage(lang: string) {
    localStorage.setItem(this.LANGUAGE_KEY, lang);
  }
  getLanguage(): string {
    return localStorage.getItem(this.LANGUAGE_KEY) || 'en';
  }
}
