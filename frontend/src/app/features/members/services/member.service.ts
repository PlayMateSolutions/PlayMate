import { Injectable } from '@angular/core';
import { Observable, catchError, from, switchMap, of, concat, mergeMap } from 'rxjs';
import { MembersDB } from './members-db';
import { ApiService } from '../../../core/services/api.service';
import { Member } from '../../../shared/interfaces/member.interface';
import { map } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ClubContextService } from '../../../core/services/club-context.service';

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
    private authService: AuthService,
    private clubContext: ClubContextService
  ) { }

  private async getRequestPayload(action: string, data: any = {}): Promise<any> {
    const token = await this.authService.getAuthToken();
    return {
      action,
      payload: data,
      authorization: token ? 'Bearer ' + token : undefined
    };
  }

  getMembers(): Observable<{members: Member[], isFresh: boolean}> {
    // Only return cached members from IndexedDB
    return from(MembersDB.getAll()).pipe(
      map(members => ({ members, isFresh: false })),
      catchError(() => of({ members: [], isFresh: false }))
    );
  }

  refreshMembers(): Observable<{members: Member[], isFresh: boolean}> {
    // Fetch fresh data from backend and update cache
    return from(this.authService.getAuthToken()).pipe(
      switchMap(token => {
        const clubId = this.clubContext.getSportsClubId() || '';
        const params = new HttpParams()
          .set('sportsClubId', clubId)
          .set('action', 'getMembers')
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
          switchMap(members => from(MembersDB.setAll(members)).pipe(map(() => members))),
          map(members => ({ members, isFresh: true })),
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

  addMember(member: Omit<Member, 'id'>): Observable<Member> {
    return from(this.getRequestPayload('addMember', member)).pipe(
      switchMap(payload => {
        const params = new HttpParams()
          .set('action', 'addMember')
          .set('payload', JSON.stringify(payload));

        return this.http.post<ApiResponse<Member>>(this.apiUrl, null, {
          params,
          headers: new HttpHeaders({
            'Content-Type': 'text/plain;charset=utf-8'
          })
        }).pipe(
          map(response => {
            if (response.status === 'success' && response.data) {
              return response.data;
            }
            throw new Error('Failed to add member');
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
