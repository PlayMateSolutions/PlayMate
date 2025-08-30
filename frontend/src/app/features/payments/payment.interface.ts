export interface Payment {
  id: string;
  memberId: string;
  memberName?: string;
  date: string;
  amount: number;
  paymentType: string;
  periodStart?: string;
  periodEnd?: string;
  status: string;
  notes?: string;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  uniqueMembers: number;
  monthBreakdown: {
    [key: string]: {
      count: number;
      amount: number;
    }
  };
}

export interface PaymentGroup {
  month: string;
  formattedDate: string;
  payments: Payment[];
  total: number;
}
