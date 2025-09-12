export interface Expense {
  id: string;
  date: string; // ISO string
  category: string;
  notes?: string;
  amount: number;
  paymentType?: string;
  payee?: string;
  transactionId?: string;
  recordedBy?: string;
}
