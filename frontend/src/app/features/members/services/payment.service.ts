import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ClubContextService } from '../../../core/services/club-context.service';
import { switchMap } from 'rxjs/operators';

interface PaymentResponse {
  status: 'success' | 'error';
  data?: {
    paymentId: string;
    expiryDate: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private clubContext: ClubContextService
  ) {}

  recordPayment(payment: any): Observable<PaymentResponse> {
    return from(this.authService.getAuthToken()).pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('No valid auth token');
        }

        const params = new HttpParams()
          .set('sportsClubId', this.clubContext.getSportsClubId() || '')
          .set('action', 'recordPayment')
          .set('authorization', 'Bearer ' + token);

        const headers = new HttpHeaders({
          'Content-Type': 'text/plain;charset=utf-8'
        });

        const options = {
          headers,
          params,
          responseType: 'json' as const,
          observe: 'body' as const
        };

        return this.http.post<PaymentResponse>(this.apiUrl, payment, options);
      })
    );
  }
}
