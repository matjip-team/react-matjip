import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useState } from "react";
import { INPUT_HEIGHT } from "../common/utils/helperUtil";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";
import { AI_RECOMMEND_BASE_URL } from "../common/config/config";
import RecommendedPlaceDetail, { type Place } from "./RecommendedPlaceDetail";

// import { API_BASE_URL } from "../common/config/config"; // logUserChoice용

type RecommendResponse = {
  recommended_places?: Place[];
  ai_comment?: string;
};

const ACCENT = "#ff6b00";

export default function AIRecommendPage() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const getRecommendation = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setPlaces([]);
    setComment("");

    try {
      const res = await axios.post<RecommendResponse>(
        `${AI_RECOMMEND_BASE_URL}/api/fastapi/recommend/`,
        {
          question,
          user_id: user?.id,
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

  // 맛집 카드 클릭 시 하단 상세 컴포넌트로 보여주기 위해 주석 처리
  // const logUserChoice = async (place: Place) => {
  //   if (!user) {
  //     setToast("로그인하면 맛집을 기록할 수 있어요");
  //     return;
  //   }
  //   try {
  //     await axios.post(`${API_BASE_URL}/user-history`, {
  //       userId: user.id,
  //       placeName: place.name,
  //       category: place.category,
  //     });
  //     setToast(`"${place.name}" 맛집을 기록했어요 👍`);
  //   } catch (err) {
  //     console.error("사용자 선택 기록 실패", err);
  //     setToast("기록에 실패했어요. 다시 시도해 주세요.");
  //   }
  // };

  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place);
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", py: 5, px: { xs: 2, sm: 3 } }}>
      {/* 페이지 타이틀 */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
            mb: 0.5,
          }}
        >
          AI 맛집 추천
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#64748b" }}>
          원하는 조건을 입력하면 AI가 맞춤 맛집을 추천해 드려요
        </Typography>
      </Box>

      {/* 로그인 안내 */}
      {user === null && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: 2,
            border: "1px solid rgba(0,0,0,0.06)",
            backgroundColor: "rgba(255,107,0,0.06)",
            color: "#1a1a1a",
          }}
        >
          로그인하면 더 정확한 추천을 받을 수 있어요 😉
        </Alert>
      )}

      {/* 검색 영역 */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 4,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "rgba(0,0,0,0.06)",
          bgcolor: "#fafafa",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            placeholder="예: 강남 파스타 맛집"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") getRecommendation();
            }}
            sx={{
              width: { xs: "100%", sm: 280 },
              flex: "1 1 200px",
              "& .MuiOutlinedInput-root": {
                bgcolor: "#fff",
                borderRadius: 1,
                height: INPUT_HEIGHT,
                minHeight: INPUT_HEIGHT,
              },
            }}
          />

          <IconButton
            sx={{
              bgcolor: ACCENT,
              color: "#fff",
              "&:hover": { bgcolor: "#e55f00", transform: "scale(1.02)" },
              transition: "all 0.2s",
            }}
            onClick={getRecommendation}
            disabled={!question.trim() || loading}
          >
            {loading ? (
              <CircularProgress size={22} sx={{ color: "#fff" }} />
            ) : (
              <AutoAwesomeIcon />
            )}
          </IconButton>
        </Box>
      </Paper>

      {/* AI 코멘트 */}
      {comment && (
        <Alert
          severity="success"
          sx={{
            mb: 4,
            borderRadius: 2,
            border: "1px solid rgba(0,0,0,0.06)",
            backgroundColor: "rgba(5,150,105,0.08)",
          }}
        >
          {comment}
        </Alert>
      )}

      {/* 결과 리스트 */}
      {places.length === 0 && !loading ? (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            textAlign: "center",
            color: "#94a3b8",
            fontSize: 15,
            borderRadius: 2,
            border: "1px dashed rgba(0,0,0,0.1)",
            bgcolor: "#f8fafc",
          }}
        >
          검색어를 입력하고 추천받기를 눌러보세요
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {places.map((p, i) => (
            <Card
              key={i}
              variant="outlined"
              onClick={() => handleSelectPlace(p)}
              sx={{
                border: "1px solid",
                borderColor: selectedPlace?.name === p.name ? ACCENT : "rgba(0,0,0,0.06)",
                borderRadius: 2,
                cursor: "pointer",
                overflow: "hidden",
                transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: selectedPlace?.name === p.name ? "0 8px 24px rgba(255,107,0,0.15)" : "none",
                "&:hover": {
                  borderColor: ACCENT,
                  boxShadow: "0 8px 24px rgba(255,107,0,0.12)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent sx={{ py: 2, px: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.9,
                  }}
                >
                  <Typography
                    sx={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                    }}
                  >
                    {p.name}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: 11,
                      fontWeight: 600,
                      bgcolor: ACCENT,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {p.category}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: 13, color: "#64748b" }}>
                  {p.address}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* 선택한 맛집 상세 (하단 표시) */}
      {selectedPlace && (
        <RecommendedPlaceDetail
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2500}
        message={toast}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          "& .MuiSnackbar-content": {
            borderRadius: 2,
            bgcolor: "#1a1a1a",
            color: "#fff",
          },
        }}
      />
    </Box>
  );
}