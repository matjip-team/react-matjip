import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../common/axios";

/**
 * 카테고리
 */
const categories = [
  { label: "전체📄", value: "전체" },
  { label: "한식🍚", value: "한식" },
  { label: "양식🍝", value: "양식" },
  { label: "고기/구이🍗", value: "고기/구이" },
  { label: "씨푸드🦞", value: "씨푸드" },
  { label: "일중/세계음식🌍", value: "일중/세계음식" },
  { label: "비건🥕", value: "비건" },
  { label: "카페/디저트🍰", value: "카페/디저트" },
];

/*
 * Spring에서 내려주는 DTO 타입
 */
interface Restaurant {
  id: number;
  name: string;
  address: string;
  imageUrl?: string; // 없으면 기본 이미지
}

export default function HomePage() {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [stores, setStores] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 맛집 조회
   */
  const fetchRestaurants = async (category: string) => {
    setLoading(true);

    try {
      const params =
        category === "전체" ? {} : { categories: category };

      const res = await axios.get(
        "/api/restaurants",
        { params }
      );

      setStores(res.data.data);
    } catch (e) {
      console.error("맛집 조회 실패", e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 최초 로딩 + 카테고리 변경 시
   */
  useEffect(() => {
    fetchRestaurants(selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="page-container">
      {/* =========================
          카테고리 필터
         ========================= */}
      <section className="category-filter">
        {categories.map((cat) => (
          <button
            key={cat.value}
            className={cat.value === selectedCategory ? "selected" : ""}
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </section>

      {/* =========================
          맛집 리스트
         ========================= */}
      <section className="store-grid">
        {loading && <p>로딩 중...</p>}

        {!loading && stores.length === 0 && (
          <p>해당 카테고리의 맛집이 없습니다.</p>
        )}

        {stores.map((store) => (
          <div
            key={store.id}
            className="store-card"
            onClick={() => navigate(`/store/${store.id}`)}
          >
            <img
              src={store.imageUrl ?? "/images/default.jpg"}
              alt={store.name}
            />
            <p>{store.name}</p>
            <small>{store.address}</small>
          </div>
        ))}
      </section>

      {/* =========================
          페이징 (다음 단계)
         ========================= */}
      <section className="pagination">
        {/* 다음 단계에서 구현 */}
      </section>
    </div>
  );
}
