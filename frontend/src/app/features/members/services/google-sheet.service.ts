import { Injectable } from '@angular/core';
import { ClubContextService } from 'src/app/core/services/club-context.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { GoogleSheetsDbService } from './google-sheets-db.service';
import { Member } from 'src/app/shared/interfaces/member.interface';
import { Attendance } from 'src/app/shared/interfaces/attendance.interface';
import { Payment } from '../../payments/payment.interface';
import { Expense } from '../../payments/expense.interface';
import { ClubSettings } from '../../settings/club-settings.interface';

@Injectable({
  providedIn: 'root',
})
export class GymMateGoogleSheetService {
  private readonly memberAttributesMapping = {
    id: 'id',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phone: 'phone',
    place: 'place',
    joinDate: 'joinDate',
    status: 'status',
    expiryDate: 'expiryDate',
    notes: 'notes',
    dateOfBirth: 'dateOfBirth',
    gender: 'gender',
  };

  private readonly attendanceAttributesMapping = {
    id: 'id',
    memberId: 'memberId',
    date: 'date',
    checkInTime: 'checkInTime',
    checkOutTime: 'checkOutTime',
    membershipStatus: 'membershipStatus',
    daysToExpiry: 'daysToExpiry',
    duration: 'duration',
    notes: 'notes',
  };

  private readonly paymentsAttributesMapping = {
    id: 'id',
    memberId: 'memberId',
    date: 'date',
    amount: 'amount',
    paymentType: 'paymentType',
    periodStart: 'periodStart',
    periodEnd: 'periodEnd',
    status: 'status',
    notes: 'notes',
    transactionId: 'transactionId',
  };

  private readonly expensesAttributesMapping = {
    id: 'id',
    date: 'date',
    category: 'category',
    notes: 'notes',
    amount: 'amount',
    paymentType: 'paymentType',
    payee: 'payee',
    transactionId: 'transactionId',
    recordedBy: 'recordedBy',
  };

  private readonly clubSettingsAttributesMapping = {
    settings: 'Setting',
    value: 'Value',
  };

  constructor(
    private clubContextService: ClubContextService,
    private authService: AuthService,
    private googleSheetsDbService: GoogleSheetsDbService
  ) {
    // Initialization moved to async method
    this.initializeSpreadsheet();
  }

  async initializeSpreadsheet() {
    const token = await this.authService
      .getSession()
      .then((session) => session?.accessToken);
    if (token) {
      this.googleSheetsDbService.oauthToken = token;
    } else {
      console.error('Failed to obtain OAuth token for Google Sheets API.');
    }
    const spreadsheetId = this.clubContextService.getSpreadSheet()?.id;
    if (spreadsheetId) {
      this.googleSheetsDbService.spreadsheetId = spreadsheetId;
    } else {
      console.error('No spreadsheet ID found in club context.');
    }
  }

  public async RefreshMembersData(): Promise<Member[]> {
    return new Promise((resolve, reject) => {
      this.googleSheetsDbService
        .get('Members', this.memberAttributesMapping)
        .subscribe({
          next: (data) => {
            resolve(data as Member[]);
          },
          error: (error) => {
            reject(error);
          },
        });
    });
  }

  public async RefreshAttendanceData(): Promise<Attendance[]> {
    return new Promise((resolve, reject) => {
      this.googleSheetsDbService
        .get('Attendance', this.attendanceAttributesMapping)
        .subscribe({
          next: (data) => {
            resolve(data as Attendance[]);
          },
          error: (error) => {
            reject(error);
          },
        });
    });
  }

  public async RefreshPaymentsData(): Promise<Payment[]> {
    return new Promise((resolve, reject) => {
      this.googleSheetsDbService
        .get('Payments', this.paymentsAttributesMapping)
        .subscribe({
          next: (data) => {
            resolve(data as Payment[]);
          },
          error: (error) => {
            reject(error);
          },
        });
    });
  }

  public async RefreshExpensesData(): Promise<Expense[]> {
    return new Promise((resolve, reject) => {
      this.googleSheetsDbService
        .get('Expenses', this.expensesAttributesMapping)
        .subscribe({
          next: (data) => {
            resolve(data as Expense[]);
          },
          error: (error) => {
            reject(error);
          },
        });
    });
  }

  public async FetchClubSettings(spreadsheetId: string): Promise<ClubSettings> {
    this.googleSheetsDbService.spreadsheetId = spreadsheetId;
    return new Promise((resolve, reject) => {
      this.googleSheetsDbService
        .get('Settings', this.clubSettingsAttributesMapping)
        .subscribe({
          next: (data: any[]) => {
            console.log('Raw club settings data fetched:', data);
            const settings: ClubSettings = {
              clubId: '',
              clubName: '',
              adminEmail: '',
              currency: '',
              latePaymentDays: 0,
              apiToken: '',
              apiUrl: '',
              version: '',
              lastUpdated: '',
              attendanceLastUpdated: '',
              membersLastUpdated: '',
              paymentsLastUpdated: '',
              expensesLastUpdated: '',
            };

            // Process each row
            data.forEach((row) => {
              if (row.settings === 'ClubId') settings.clubId = row.value || '';
              if (row.settings === 'Club Name')
                settings.clubName = row.value || '';
              if (row.settings === 'Admin Email')
                settings.adminEmail = row.value || '';
              if (row.settings === 'Currency')
                settings.currency = row.value || '';
              if (row.settings === 'Late Payment Days')
                settings.latePaymentDays = parseInt(row.value || '0');
              if (row.settings === 'API Token')
                settings.apiToken = row.value || '';
              if (row.settings === 'API URL') settings.apiUrl = row.value || '';
              if (row.settings === 'Version')
                settings.version = row.value || '';
              if (row.settings === 'Last Updated')
                settings.lastUpdated = row.value || '';
              if (row.settings === 'Attendance Last Updated')
                settings.attendanceLastUpdated = row.value || '';
              if (row.settings === 'Members Last Updated')
                settings.membersLastUpdated = row.value || '';
              if (row.settings === 'Payments Last Updated')
                settings.paymentsLastUpdated = row.value || '';
              if (row.settings === 'Expenses Last Updated')
                settings.expensesLastUpdated = row.value || '';
            });

            resolve(settings);
          },
          error: (error) => {
            reject(error);
          },
        });
    });
  }

  async RefreshAllData(): Promise<void> {
    await this.RefreshMembersData();
    await this.RefreshAttendanceData();
    await this.RefreshPaymentsData();
    await this.RefreshExpensesData();
  }
}
