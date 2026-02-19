export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  nickname: string;
}

export interface SignupResponse {
  id: number;
  email: string;
  name: string;
  nickname: string;
  role: string;
  status: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  email: string;
  name: string;
  nickname: string;
  role?: string;
  roles?: string[];
}
