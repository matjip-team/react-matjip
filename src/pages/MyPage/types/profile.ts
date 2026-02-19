export interface ProfileRequest {
  nickname: string;
  password?: string;
  bio?: string;
  profileImage?: File;
}

export interface ProfileResponse {
  email: string;
  name: string;
  nickname: string;  
  profileImageUrl?: string;
  bio?: string;
}
