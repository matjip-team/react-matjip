import { useState } from "react";
import axios from "axios";

/** 📌 장소 타입 정의 */
type Place = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
};

export default function AIRecommendPage() {
  const [question, setQuestion] = useState<string>("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const getRecommendation = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setPlaces([]);
    setComment("");

    try {
      // 🔹 Axios 요청 URL 끝에 / 제거
      const res = await axios.post("http://localhost:8000/recommend/", {
        question,
        lat: null,
        lng: null,
      });

      if (res.data.recommended_places && res.data.recommended_places.length > 0) {
        setPlaces(res.data.recommended_places);
        setComment(res.data.ai_comment || "");
      } else {
        setComment("추천할 맛집이 없습니다 😢");
      }
    } catch (err: unknown) {
    if (err instanceof Error) {
        console.error(err.message);
        alert(`추천 실패 😢\n${err.message}`);
      } else {
        console.error(err);
        alert("추천 실패 😢");
      }
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>🤖 AI 맛집 추천</h1>

      <input
        type="text"
        placeholder="예: 건대 근처 맛집, 의정부 치킨 추천해줘"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{ width: "400px", padding: "10px" }}
      />

      <button onClick={getRecommendation} style={{ marginLeft: "10px" }}>
        추천받기
      </button>

      {loading && <p>AI 분석 중... 🔍</p>}

      {comment && <h3>💬 {comment}</h3>}

      {/* 🔥 추천 장소 리스트 */}
      {places.length > 0 &&
        places.map((p, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ddd",
              margin: "10px 0",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <h3>{p.name}</h3>
            <p>{p.address}</p>
            <p>카테고리: {p.category}</p>
          </div>
        ))}
    </div>
  );
}
