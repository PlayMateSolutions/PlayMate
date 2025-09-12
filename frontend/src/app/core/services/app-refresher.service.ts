import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppRefresherService {
  refreshAll: (() => Promise<void>) | null = null;
}
