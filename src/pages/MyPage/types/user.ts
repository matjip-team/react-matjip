export interface UserInfo {
  email: string;
  name: string;
  nickname: string;
  password?: string;
  profileImageUrl?: string;
  bio?: string;
  profileImage?: File;
}
