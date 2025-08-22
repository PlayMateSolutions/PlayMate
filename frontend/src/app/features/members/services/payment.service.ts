import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ClubContextService } from '../../../core/services/club-context.service';
import { switchMap } from 'rxjs/operators';

interface PaymentResponse {
  status: 'success' | 'error';
  data?: any;
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
    return from(this.getRequestPayload('recordPayment', payment)).pipe(
      switchMap(payload => {
        const params = {
          sportsClubId: this.clubContext.getSportsClubId() || '',
          action: 'recordPayment'
        };
        const queryString = new URLSearchParams(params).toString();
        return this.http.post<PaymentResponse>(`${this.apiUrl}?${queryString}`, payload);
      })
    );
  }

  private async getRequestPayload(action: string, data: any = {}): Promise<any> {
    const token = await this.authService.getAuthToken();
    if (!token) {
      throw new Error('Unable to get valid authentication token');
    }
    return {
      action,
      payload: data,
      authorization: 'Bearer ' + token
    };
  }
}
