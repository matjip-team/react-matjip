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
  avgRating: number; // 평균 평점
  reviewCount: number; // 리뷰 개수
  address: string;
}

export interface ReviewPage {
  reviews: Review[];
  nextCursor?: number;
  prevCursor?: number;
}
