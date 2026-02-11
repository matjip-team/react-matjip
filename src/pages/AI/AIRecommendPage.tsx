import { useState } from "react";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth.ts"; //사용자정보

type Place = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
};

type RecommendResponse = {
  recommended_places?: Place[];
  ai_comment?: string;
};

export default function AIRecommendPage() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 로그인 상태 확인 (예: localStorage, API 등)

  const getRecommendation = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setPlaces([]);
    setComment("");

    try {
      const res = await axios.post<RecommendResponse>(
        "http://localhost:8000/recommend/",
        {
          question,
          user_id: user?.id, // 비로그인 시 null 전달
        }
      );

      setPlaces(res.data.recommended_places || []);
      setComment(res.data.ai_comment || "추천 결과 없음");
    } catch (err) {
      alert("추천 실패 😢");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logUserChoice = async (place: Place) => {
    if (!user) return; // 비로그인 시 로그 기록 안함

    try {
      await axios.post("http://localhost:8080/user-history", {
        userId: user.id,
        placeName: place.name,
        category: place.category,
      });
    } catch (err) {
      console.error("사용자 선택 기록 실패", err);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>🤖 AI 맛집 추천</h1>

      {user === null && (
        <p style={{ color: "gray" }}>
          로그인하면 더 정확한 추천을 받을 수 있어요 😉
        </p>
      )}

      <input
        type="text"
        value={question}
        placeholder="예: 강남 파스타 맛집"
        onChange={(e) => setQuestion(e.target.value)}
        style={{ padding: "8px", width: "300px", marginRight: "8px" }}
      />

      <button
        onClick={getRecommendation}
        disabled={!question.trim() || loading}
        style={{ padding: "8px 16px", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "추천 중..." : "추천받기"}
      </button>

      {comment && <h3 style={{ marginTop: "20px" }}>{comment}</h3>}

      <div style={{ marginTop: "20px" }}>
        {places.map((p, i) => (
          <div
            key={i}
            onClick={() => logUserChoice(p)}
            style={{
              cursor: user ? "pointer" : "default",
              border: "1px solid #ddd",
              padding: "12px",
              marginBottom: "10px",
              borderRadius: "8px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <h3>{p.name}</h3>
            <p>{p.address}</p>
            <p>{p.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
