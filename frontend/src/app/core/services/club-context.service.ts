import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClubContextService {
  private sportsClubId: string | null = null;
  private readonly STORAGE_KEY = 'sportsClubId';

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
}
