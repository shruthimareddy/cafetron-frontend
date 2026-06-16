export interface VendorResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  isActive: boolean;
  createdAt: string;
}

export interface VendorRequest {
  name: string;
  email: string;
  phone?: string;
  contactPerson?: string;
}
