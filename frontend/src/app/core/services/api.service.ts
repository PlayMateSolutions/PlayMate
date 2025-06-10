import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private async getHeaders(): Promise<HttpHeaders> {
    let headers = new HttpHeaders({
      'Content-Type': 'text/plain;charset=utf-8'
    });
    
    const token = await this.authService.getAuthToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  /**
   * Make a GET request to the API
   */
  async get<T>(action: string, payload: any = {}): Promise<Observable<T>> {
    const headers = await this.getHeaders();
    const params = new HttpParams()
      .set('action', action)
      .set('payload', JSON.stringify(payload));

    return this.http.get<T>(this.apiUrl, {
      headers,
      params
    });
  }

  /**
   * Make a POST request to the API
   */
  async post<T>(action: string, data: any = {}): Promise<Observable<T>> {
    const headers = await this.getHeaders();
    const payload = {
      action,
      data
    };

    return this.http.post<T>(this.apiUrl, JSON.stringify(payload), { headers });
  }
}
