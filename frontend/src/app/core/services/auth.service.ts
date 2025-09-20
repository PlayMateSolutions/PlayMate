import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { Router, ActivatedRoute } from '@angular/router';
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
  accessToken?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  private _userSession = new BehaviorSubject<UserSession | null>(null);
  private readonly STORAGE_KEY = 'user_session';
  private storageReady = false;

  constructor(
    private storage: Storage,
    private router: Router,
    private route: ActivatedRoute
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

  public async loadSession() {
    const session = await this.storage.get(this.STORAGE_KEY);
    if (session) {
      console.log(
        'Session found, expires:',
        new Date(session.expiresAt).toISOString()
      );
    } else {
      console.log('No session found');
    }
    if (session && session.expiresAt > Date.now()) {
      this._isAuthenticated.next(true);
      this._userSession.next(session);
    } else {
      // await this.renewSession();
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
    });
    return true;
  }
  async login(): Promise<boolean> {
    try {
      // Remove query params before login to avoid COOP issues
      this.removeQueryParams();

      const response = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: [
            'email',
            'profile',
            // 'https://www.googleapis.com/auth/drive.file',
            // 'https://www.googleapis.com/auth/spreadsheets',
            // 'https://www.googleapis.com/auth/script.external_request',
          ],
        },
        
      });

      // Restore query params after login
      this.restoreQueryParams();

      const result = response.result as GoogleLoginResponseOnline;
      console.log('Google login response:', result);

      console.log('ID Token:', result?.idToken);
      console.log('Access Token:', result?.accessToken?.token);

      if (result?.accessToken?.token) {
        const session: UserSession = {
          token: result.idToken || '',
          accessToken: result.accessToken.token || '',
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
      // Restore query params even if login fails
      this.restoreQueryParams();
      return false;
    }
  }

  private removeQueryParams() {
    // Store current query params in localStorage
    // Because Google SignIn requires exact redirect URL
    const currentQueryParams = this.route.snapshot.queryParams;
    localStorage.setItem('queryParams', JSON.stringify(currentQueryParams));
    this.router.navigate([], {
      replaceUrl: true,
    });
  }

  private restoreQueryParams() {
    const queryParams = localStorage.getItem('queryParams');
    if (queryParams) {
      const parsedQueryParams = JSON.parse(queryParams);
      this.router.navigate([], {
        queryParams: parsedQueryParams,
        replaceUrl: true,
      });
      // Clean up stored params
      localStorage.removeItem('queryParams');
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

  async renewSession() {
    console.log('Renewing session...');

    console.log('Is logged in ' + JSON.stringify(await SocialLogin.isLoggedIn({ provider: 'google' })));

    return this.login();
  }

  async getAuthToken(): Promise<string | null> {
    console.log('Getting auth token...');
    const session = await this.storage.get(this.STORAGE_KEY);
    if (!session) {
      console.log('No session found');
      return null;
    }
    console.log(
      'Session found, expires:',
      new Date(session.expiresAt).toISOString()
    );

    /*  
    // Commenting out token refresh logic for testing
    // There seems to be an issue with token expiry handling in the frontend
    if (session.expiresAt <= Date.now()) {
      console.log(
        'Token expired at:',
        new Date(session.expiresAt).toISOString()
      );
      console.log('Current time:', new Date().toISOString());

      try {
        console.log('Attempting to refresh token...');
        // Try to refresh the token
        await SocialLogin.refresh({
          provider: 'google',
          options: {
            scopes: ['email', 'profile', "https://www.googleapis.com/auth/spreadsheets", 'https://www.googleapis.com/auth/script.external_request'],
            forceRefreshToken: true,
          },
        });
        console.log('Token refresh successful');

        // Get the refreshed token
        console.log('Fetching new access token...');
        const authCode = await SocialLogin.getAuthorizationCode({
          provider: 'google',
        });

        if (authCode.accessToken) {
          console.log('New access token received');
          const newSession: UserSession = {
            ...session,
            token: authCode.accessToken,
            expiresAt: Date.now() + 3600000, // 1 hour from now
          };
          console.log(
            'Updating session with new token, expires:',
            new Date(newSession.expiresAt).toISOString()
          );
          await this.setSession(newSession);
          return newSession.token;
        } else {
          console.warn('Refresh succeeded but no access token received');
          return null;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        console.error(
          'Stack trace:',
          error instanceof Error ? error.stack : 'No stack trace available'
        );
        return null;
      }
    }
    */

    console.log('Returning valid token');
    return session.token;
  }
}
