export interface AdminUserListItem {
  id: number;
  email: string;
  name: string;
  nickname: string;
  role: string;
  status?: string;
  profileImageUrl?: string;
  createdAt?: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  bio?: string;
  updatedAt?: string;
}
