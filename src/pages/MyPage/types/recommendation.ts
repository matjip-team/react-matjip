export interface Recommendation {
  id: number;
  restaurantName: string;
  image: string; // 가게 이미지 URL
  rating: number; // 0~5
  menu: string; // 대표 메뉴
  views: number; // 사용자가 본 횟수
  likes: number; // 좋아요 횟수
  favorites: number; // 즐겨찾기 횟수
  reason?: string; // 추천 이유
}
