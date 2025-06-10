import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  private _userEmail = new BehaviorSubject<string | null>(null);

  constructor(
    private apiService: ApiService,
    private storage: Storage
  ) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
    const token = await this.storage.get('auth_token');
    if (token) {
      this._isAuthenticated.next(true);
      const email = await this.storage.get('user_email');
      this._userEmail.next(email);
    }
  }

  get isAuthenticated$(): Observable<boolean> {
    return this._isAuthenticated.asObservable();
  }

  get userEmail$(): Observable<string | null> {
    return this._userEmail.asObservable();
  }

  async login(token: string, email: string): Promise<boolean> {
    await this.storage.set('auth_token', token);
    await this.storage.set('user_email', email);
    this._isAuthenticated.next(true);
    this._userEmail.next(email);
    return true;
  }

  async logout(): Promise<void> {
    await this.storage.remove('auth_token');
    await this.storage.remove('user_email');
    this._isAuthenticated.next(false);
    this._userEmail.next(null);
  }

  async getAuthToken(): Promise<string | null> {
    return await this.storage.get('auth_token');
  }

  async handleGoogleSignIn(response: any): Promise<boolean> {
    if (response && response.credential) {
      return this.login(response.credential, response.email);
    }
    return false;
  }
}
