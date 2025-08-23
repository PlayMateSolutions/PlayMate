export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  place: string;
  joinDate: Date;
  createdDate: string;
  expiryDate: string;
  sports: string[];
  status: 'active' | 'inactive';
  membershipType?: string;
  lastPaymentDate?: Date;
  notes?: string;
}


export interface MemberResponse {
  status: 'success' | 'error';
  data?: Member | Member[];
  message?: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}
