import { Injectable } from '@angular/core';
import { Observable, catchError, from, switchMap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Member, MemberFilters } from '../../../shared/interfaces/member.interface';
import { map } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: number;
    message: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private async getRequestPayload(action: string, data: any = {}): Promise<any> {
    const token = await this.authService.getAuthToken();
    return {
      action,
      payload: data,
      authorization: token ? 'Bearer ' + token : undefined
    };
  }

  getMembers(filters?: MemberFilters): Observable<Member[]> {
    return from(this.authService.getAuthToken()).pipe(
      switchMap(token => {
        token = 'ya29.a0AW4XtxhLkHFvnQ2Zs4ntZmXUlPFmnu40seYWi6I3Q05o9p1QUuJeQxwxK6lY7VGhVnjVE-7epKxDoPokZcmUblTyYMcGp7N2CfUauxopW-7cG2LN2JbOAHBS3cQcvhnTdh4kOdHe7D0G2tt-Q6KAug2GT3UDd7ifH5RTZGW8PwaCgYKAfASARUSFQHGX2Mip4O-T-WbJvFpxC-OEtPoXQ0177';
        const params = new HttpParams()
          .set('action', 'getMembers')
          .set('payload', JSON.stringify({ filters }))
          .set('authorization', token ? 'Bearer ' + token : '');

        const headers = new HttpHeaders({
          'Content-Type': 'text/plain;charset=utf-8'
        });

        const options = {
          headers,
          params,
          responseType: 'json' as const,
          observe: 'body' as const
        };

        return this.http.get<ApiResponse<Member[]>>(this.apiUrl, options).pipe(
          map(response => {
            if (response.status === 'error') throw new Error(response.error?.message);
            return response.data || [];
          }),
          catchError(error => {
            console.error('Error fetching members:', error);
            throw error;
          })
        );
      })
    );
  }

  searchMembers(searchTerm: string): Observable<Member[]> {
    return from(this.authService.getAuthToken()).pipe(
      switchMap(token => {
        const params = new HttpParams()
          .set('action', 'getMembers')
          .set('payload', JSON.stringify({ filters: { searchTerm } }))
          .set('authorization', token ? 'Bearer ' + token : '');

        const headers = new HttpHeaders({
          'Content-Type': 'text/plain;charset=utf-8'
        });

        const options = {
          headers,
          params,
          responseType: 'json' as const,
          observe: 'body' as const
        };

        return this.http.get<ApiResponse<Member[]>>(this.apiUrl, options).pipe(
          map(response => {
            if (response.status === 'error') throw new Error(response.error?.message);
            return response.data || [];
          }),
          catchError(error => {
            console.error('Error searching members:', error);
            throw error;
          })
        );
      })
    );
  }

  addMember(member: Member): Observable<Member> {
    return from(this.getRequestPayload('addMember', member)).pipe(
      switchMap(payload => {
        const headers = new HttpHeaders({
          'Content-Type': 'text/plain;charset=utf-8'
        });

        const options = {
          headers,
          responseType: 'json' as const,
          observe: 'body' as const
        };

        return this.http.post<ApiResponse<Member>>(this.apiUrl, payload, options).pipe(
          map(response => {
            if (response.status === 'error') throw new Error(response.error?.message);
            return response.data!;
          })
        );
      })
    );
  }

  updateMember(member: Member): Observable<Member> {
    return from(this.getRequestPayload('updateMember', member)).pipe(
      switchMap(payload => {
        const headers = new HttpHeaders({
          'Content-Type': 'text/plain;charset=utf-8'
        });

        const options = {
          headers,
          responseType: 'json' as const,
          observe: 'body' as const
        };

        return this.http.post<ApiResponse<Member>>(this.apiUrl, payload, options).pipe(
          map(response => {
            if (response.status === 'error') throw new Error(response.error?.message);
            return response.data!;
          })
        );
      })
    );
  }

  deleteMember(memberId: string): Observable<boolean> {
    return from(this.getRequestPayload('deleteMember', { memberId })).pipe(
      switchMap(payload => {
        const headers = new HttpHeaders({
          'Content-Type': 'text/plain;charset=utf-8'
        });

        const options = {
          headers,
          responseType: 'json' as const,
          observe: 'body' as const
        };

        return this.http.post<ApiResponse<boolean>>(this.apiUrl, payload, options).pipe(
          map(response => {
            if (response.status === 'error') throw new Error(response.error?.message);
            return response.data || false;
          })
        );
      })
    );
  }
}
