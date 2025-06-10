import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Make a GET request to the API
   */
  get<T>(action: string, payload: any = {}): Observable<T> {
    const params = new HttpParams()
      .set('action', action)
      .set('payload', JSON.stringify(payload));
    
    return this.http.get<T>(this.apiUrl, { 
      params,
      headers: this.getHeaders()
    });
  }

  /**
   * Make a POST request to the API
   */
  post<T>(action: string, payload: any = {}): Observable<T> {
    const params = new HttpParams()
      .set('action', action)
      .set('payload', JSON.stringify(payload));
    
    return this.http.post<T>(this.apiUrl, null, { 
      params,
      headers: this.getHeaders()
    });
  }

  /**
   * Get common headers including authorization
   */
  private getHeaders(): HttpHeaders {
    // TODO: Get actual token from AuthService
    const token = localStorage.getItem('auth_token') || 'dev-token-playmate-api';
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
