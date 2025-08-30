export interface Member {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  joiningDate?: string;
  membershipType?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface MemberResponse {
  members: Member[];
  total: number;
  lastSync?: string;
}
