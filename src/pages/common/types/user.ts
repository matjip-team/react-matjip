export interface User {
  id: number;
  email: string;
  name: string;
  nickname: string;
  role: string;  // "ROLE_USER", "ROLE_ADMIN" 등
}
