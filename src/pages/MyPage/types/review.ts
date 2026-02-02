export interface Review {
  id: number;
  restaurantName: string;
  content: string;
  rating: number; // 0 ~ 5
  likeCount: number;
  commentCount: number;
  liked: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt?: string;
}
