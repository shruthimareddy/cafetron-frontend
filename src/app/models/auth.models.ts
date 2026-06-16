export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  department: string;
  role: 'EMPLOYEE' | 'COUNTER' | 'ADMIN';
}

export interface LoginRequest {
  employeeId: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  role: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  employeeId: string;
  department: string;
}