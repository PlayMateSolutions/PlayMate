export interface Payment {
  paymentId: string;
  memberId: string;
  memberName?: string;
  amount: number;
  sport: string;
  date: Date;
  periodStart?: Date;
  periodEnd?: Date;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'other';
  transactionId?: string;
  receipt?: string;
  notes?: string;
}

export interface PaymentFilters {
  startDate?: Date;
  endDate?: Date;
  sport?: string;
  memberId?: string;
  status?: 'completed' | 'pending' | 'failed';
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'other';
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  sportBreakdown: {
    [key: string]: {
      count: number;
      totalAmount: number;
      averageAmount: number;
    }
  };
  methodBreakdown: {
    [key: string]: {
      count: number;
      totalAmount: number;
    }
  };
  monthlyBreakdown: {
    [key: string]: {
      count: number;
      totalAmount: number;
    }
  };
}

export interface PaymentResponse {
  status: 'success' | 'error';
  data?: Payment | Payment[] | PaymentSummary;
  message?: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}
