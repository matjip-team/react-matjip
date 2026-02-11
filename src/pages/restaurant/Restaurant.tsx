import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../common/axios";
import "./restaurant.css";

interface Review {
  id: number;
  nickname: string;
  rating: number;
  content: string;
}

interface RestaurantDetail {
  id: number;
  name: string;
  address: string;
  description: string;
  imageUrl?: string;
  categories: string[];
  averageRating: number;
  reviewCount: number;
  reviews: Review[];
}

export default function Restaurant() {
  const { id } = useParams();

  const [store, setStore] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [myRating, setMyRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  /* ================= 상세 조회 ================= */
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        const res = await axios.get(`/api/restaurants/${id}`);
        setStore(res.data.data);
      } catch (e) {
        console.error("상세 조회 실패", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  /* ================= 리뷰 등록 ================= */
  const submitReview = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!id) {
      alert("잘못된 접근입니다.");
      return;
    }

    if (myRating === 0) {
      alert("평점을 선택해주세요.");
      return;
    }

    try {
      await axios.post(
        `/api/restaurants/${id}/reviews`,
        { rating: myRating, content: reviewText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("리뷰 등록 완료!");
      setMyRating(0);
      setReviewText("");

      // 🔥 등록 후 최신 데이터 재조회
      const res = await axios.get(`/api/restaurants/${id}`);
      setStore(res.data.data);

    } catch (e: unknown) {
      console.error(e);
      alert("리뷰 등록 실패");
    }
  };

  if (loading) return <p>로딩 중...</p>;
  if (!store) return <p>가게 정보를 불러올 수 없습니다.</p>;

  return (
    <div className="restaurant-detail">
      <div className="image-wrapper">
        <img src={store.imageUrl ?? "/images/world.jpg"} alt={store.name} />
      </div>

      <div className="info">
        <div className="title-row">
          <h1>{store.name}</h1>
        </div>

        <div className="categories">
          {store.categories.map((c) => (
            <span key={c} className="category">
              {c}
            </span>
          ))}
        </div>

        <p className="address">{store.address}</p>

        <section className="description">
          <h3>가게 소개</h3>
          <p>{store.description}</p>
        </section>

        {/* 평균 평점 */}
        <div className="rating-summary">
          {"⭐".repeat(Math.round(store.averageRating))}
          {"☆".repeat(5 - Math.round(store.averageRating))}
          <span>
            {" "}
            {store.averageRating}점 ({store.reviewCount}개 리뷰)
          </span>
        </div>

        {/* 리뷰 작성 */}
        <section className="review-write">
          <h3>리뷰 작성</h3>

          <div className="rating-input">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={n <= myRating ? "star active" : "star"}
                onClick={() => setMyRating(n)}
              >
                ★
              </span>
            ))}
          </div>

          <textarea
            placeholder="리뷰를 작성해주세요."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />

          <button className="submit-review" onClick={submitReview}>
            리뷰 등록
          </button>
        </section>

        {/* 리뷰 목록 */}
        <section className="review-list">
          <h3>리뷰</h3>

          {store.reviews.length === 0 && <p>아직 작성된 리뷰가 없습니다.</p>}

          {store.reviews.map((review) => (
            <div key={review.id} className="review-item">
              <strong>{review.nickname}</strong>
              <div>{"⭐".repeat(review.rating)}</div>
              <p>{review.content}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
