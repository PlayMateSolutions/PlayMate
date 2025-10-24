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
import { GymMateGoogleSheetService } from './google-sheet.service';

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
    private clubContext: ClubContextService,
    private googleSheetService: GymMateGoogleSheetService
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
    return from(this.googleSheetService.RefreshMembersData()).pipe(
      switchMap(members => {
        // Store in local DB and update last refresh time
        this.clubContext.setLastMemberRefresh(new Date());
        return from(MembersDB.setAll(members)).pipe(
          map(() => ({ members, isFresh: true }))
        );
      }),
      catchError(error => {
        console.error('Error fetching members from Google Sheets:', error);
        throw error;
      })
    );
  }

  addMember(member: Omit<Member, 'id'>): Observable<Member> {
    return from(this.authService.getAuthToken()).pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('No valid auth token');
        }
        const params = new HttpParams()
          .set('sportsClubId', this.clubContext.getSportsClubId() || '')
          .set('action', 'addMember')
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

        return this.http.post<ApiResponse<Member>>(this.apiUrl, member, options).pipe(
          map(response => {
            if (response.status === 'success' && response.data) {
              return response.data;
            }
            if (response.status === 'error' && response.error?.message) {
              throw new Error(response.error.message);
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
