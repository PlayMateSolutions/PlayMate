import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ClubContextService } from './club-context.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private clubContext: ClubContextService
  ) {}

  private async getHeaders(): Promise<HttpHeaders> {
    let headers = new HttpHeaders({
      'Content-Type': 'text/plain;charset=utf-8',
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
  async get<T>(
    action: string,
    clubId: string = '',
    extraParams: { [key: string]: string } = {}
  ): Promise<T> {
    const token = await this.authService.getAuthToken();

    var params = new HttpParams()
      .set('sportsClubId', clubId ?? this.clubContext.getSportsClubId())
      .set('action', action)
      .set('authorization', token ? 'Bearer ' + token : '');
    for (const key of Object.keys(extraParams)) {
      params = params.set(key, extraParams[key]);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'text/plain;charset=utf-8',
    });

    const options = {
      headers,
      params,
      responseType: 'json' as const,
      observe: 'body' as const,
    };

    return firstValueFrom(this.http.get<T>(this.apiUrl, options));
  }

  /**
   * Make a POST request to the API
   */
  async post<T>(action: string, data: any = {}): Promise<T> {
    const token = await this.authService.getAuthToken();
    const params = new HttpParams()
      .set('sportsClubId', this.clubContext.getSportsClubId() || '')
      .set('action', action)
      .set('authorization', 'Bearer ' + token);

    const headers = new HttpHeaders({
      'Content-Type': 'text/plain;charset=utf-8',
    });

    const options = {
      headers,
      params,
      responseType: 'json' as const,
      observe: 'body' as const,
    };

    return firstValueFrom(this.http.post<T>(this.apiUrl, data, options));
  }
}
