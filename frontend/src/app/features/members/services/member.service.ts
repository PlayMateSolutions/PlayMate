import { Injectable } from '@angular/core';
import { Observable, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Member, MemberFilters } from '../../../shared/interfaces/member.interface';
import { map } from 'rxjs/operators';

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
  constructor(private api: ApiService) { }

  getMembers(filters?: MemberFilters): Observable<Member[]> {
    return this.api.get<ApiResponse<Member[]>>('getMembers', { filters }).pipe(
      map(response => {
        if (response.status === 'error') throw new Error(response.error?.message);
        return response.data || [];
      }),
      catchError(error => {
        console.error('Error fetching members:', error);
        throw error;
      })
    );
  }

  getMember(memberId: string): Observable<Member> {
    return this.api.get<ApiResponse<Member>>('getMember', { memberId }).pipe(
      map(response => {
        if (response.status === 'error') throw new Error(response.error?.message);
        if (!response.data) throw new Error('Member not found');
        return response.data;
      }),
      catchError(error => {
        console.error('Error fetching member:', error);
        throw error;
      })
    );
  }

  addMember(member: Partial<Member>): Observable<{ memberId: string }> {
    return this.api.post<ApiResponse<{ memberId: string }>>('addMember', member).pipe(
      map(response => {
        if (response.status === 'error') throw new Error(response.error?.message);
        if (!response.data) throw new Error('Failed to add member');
        return response.data;
      }),
      catchError(error => {
        console.error('Error adding member:', error);
        throw error;
      })
    );
  }

  updateMember(memberId: string, updates: Partial<Member>): Observable<{ success: boolean }> {
    return this.api.post<ApiResponse<{ success: boolean }>>('updateMember', { memberId, ...updates }).pipe(
      map(response => {
        if (response.status === 'error') throw new Error(response.error?.message);
        return response.data || { success: false };
      }),
      catchError(error => {
        console.error('Error updating member:', error);
        throw error;
      })
    );
  }

  deleteMember(memberId: string): Observable<{ success: boolean }> {
    return this.api.post<ApiResponse<{ success: boolean }>>('deleteMember', { memberId }).pipe(
      map(response => {
        if (response.status === 'error') throw new Error(response.error?.message);
        return response.data || { success: false };
      }),
      catchError(error => {
        console.error('Error deleting member:', error);
        throw error;
      })
    );
  }

  searchMembers(searchTerm: string): Observable<Member[]> {
    return this.api.get<ApiResponse<Member[]>>('searchMembers', { searchTerm }).pipe(
      map(response => {
        if (response.status === 'error') throw new Error(response.error?.message);
        return response.data || [];
      }),
      catchError(error => {
        console.error('Error searching members:', error);
        throw error;
      })
    );
  }
}
