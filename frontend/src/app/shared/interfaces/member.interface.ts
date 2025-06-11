export interface Member {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  joinDate: Date;
  createdDate: string;
  expiryDate: string;
  sports: string[];
  status: 'active' | 'inactive';
  membershipType?: string;
  lastPaymentDate?: Date;
  notes?: string;
}

export interface MemberFilters {
  status?: 'active' | 'inactive';
  sport?: string;
  membershipType?: string;
  searchTerm?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface MemberResponse {
  status: 'success' | 'error';
  data?: Member | Member[];
  message?: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}
