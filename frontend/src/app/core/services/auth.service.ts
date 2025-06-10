import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { environment } from '../../../environments/environment';
import {
  GoogleLoginResponseOnline,
  SocialLogin,
} from '@capgo/capacitor-social-login';

export interface UserSession {
  token: string;
  email: string;
  name: string;
  picture?: string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  private _userSession = new BehaviorSubject<UserSession | null>(null);
  private readonly STORAGE_KEY = 'user_session';
  private storageReady = false;

  constructor(private storage: Storage) {
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

  async initGoogleAuth(): Promise<boolean> {
 await SocialLogin.initialize({
        google: {
          webClientId: environment.googleSignInClientId, // the web client id for Android and Web
        },
      });    return true;
  }
  async login(): Promise<boolean> {
    try {
      const response = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: ['email', 'profile'],
        },
      });

      const result = response.result as GoogleLoginResponseOnline;
      console.log('Google login response:', result);

      console.log('ID TOken:', result?.idToken);
      console.log('Access Token:', result?.accessToken?.token);

      if (result?.accessToken?.token) {
        const session: UserSession = {
          token: result.accessToken.token || '',
          email: result.profile.email || '',
          name: result.profile.name || '',
          picture: result.profile.imageUrl || '',
          expiresAt: Date.now() + 3600000, // 1 hour from now
        };

        await this.setSession(session);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async setSession(session: UserSession) {
    await this.storage.set(this.STORAGE_KEY, session);
    this._isAuthenticated.next(true);
    this._userSession.next(session);
  }
  async logout() {
    try {
      await SocialLogin.logout({ provider: 'google' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    await this.storage.remove(this.STORAGE_KEY);
    this._isAuthenticated.next(false);
    this._userSession.next(null);
  }

  async getAuthToken(): Promise<string | null> {
    const session = await this.storage.get(this.STORAGE_KEY);
    if (session && session.expiresAt > Date.now()) {
      return session.token;
    }
    return null;
  }
}
