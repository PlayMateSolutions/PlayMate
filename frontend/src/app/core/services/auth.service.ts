import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { environment } from '../../../environments/environment';

export interface UserSession {
  token: string;
  email: string;
  name: string;
  picture?: string;
  expiresAt: number;
}

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  private _userSession = new BehaviorSubject<UserSession | null>(null);
  private readonly STORAGE_KEY = 'user_session';
  private storageReady = false;

  constructor(
    private apiService: ApiService,
    private storage: Storage
  ) {
    this.init();
  }

  private async init() {
    if (!this.storageReady) {
      await this.storage.create();
      this.storageReady = true;
      await this.loadSession();
    }
  }

  private async loadSession() {
    const session = await this.storage.get(this.STORAGE_KEY);
    if (session && session.expiresAt > Date.now()) {
      this._isAuthenticated.next(true);
      this._userSession.next(session);
    } else {
      await this.storage.remove(this.STORAGE_KEY);
      this._isAuthenticated.next(false);
      this._userSession.next(null);
    }
  }

  get isAuthenticated$(): Observable<boolean> {
    return this._isAuthenticated.asObservable();
  }

  get userSession$(): Observable<UserSession | null> {
    return this._userSession.asObservable();
  }

  async initGoogleAuth() {
    return new Promise((resolve) => {
      google.accounts.id.initialize({
        client_id: '${environment.googleClientId}',
        callback: (response: any) => {
          this.handleGoogleSignIn(response);
        },
      });
      resolve(true);
    });
  }

  async handleGoogleSignIn(response: any) {
    if (response?.credential) {
      // Decode the JWT token to get user info
      const payload = this.decodeJwtToken(response.credential);
      const session: UserSession = {
        token: response.credential,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        expiresAt: payload.exp * 1000 // Convert to milliseconds
      };

      await this.setSession(session);
      return true;
    }
    return false;
  }

  private decodeJwtToken(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  }

  async setSession(session: UserSession) {
    await this.storage.set(this.STORAGE_KEY, session);
    this._isAuthenticated.next(true);
    this._userSession.next(session);
  }

  async logout() {
    await this.storage.remove(this.STORAGE_KEY);
    this._isAuthenticated.next(false);
    this._userSession.next(null);
  }

  async getAuthToken(): Promise<string | null> {
    const session = await this.storage.get(this.STORAGE_KEY);
    return session?.token || null;
  }
}
