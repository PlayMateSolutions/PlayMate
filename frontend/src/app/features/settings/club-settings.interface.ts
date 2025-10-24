export interface ClubSettings {
  clubId: string;
  clubName: string;
  adminEmail?: string;
  currency: string;
  latePaymentDays: number;
  apiToken?: string;
  apiUrl?: string;
  version: string;
  lastUpdated?: string;
  attendanceLastUpdated?: string;
  membersLastUpdated?: string;
  paymentsLastUpdated?: string;
  expensesLastUpdated?: string;
}
