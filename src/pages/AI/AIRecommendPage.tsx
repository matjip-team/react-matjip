import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useState } from "react";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";

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

  const logUserChoice = async (place: Place) => {
    if (!user) return;

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
    <Container maxWidth="md" sx={{ mt: 6, mb: 10 }}>
      {/* 타이틀 */}
      <Box display="flex" alignItems="center" mb={4}>
        <AutoAwesomeIcon sx={{ mr: 1, color: "#FF7A00" }} />
        <Typography variant="h4" fontWeight="bold" sx={{ color: "#FF7A00" }}>
          AI 맛집 추천
        </Typography>
      </Box>

      {/* 로그인 안내 */}
      {user === null && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            backgroundColor: "#FFF3E6",
            color: "#FF7A00",
          }}
        >
          로그인하면 더 정확한 추천을 받을 수 있어요 😉
        </Alert>
      )}

      {/* 검색 카드 */}
      <Card
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
        }}
      >
        <Box display="flex" gap={2}>
          <TextField
            fullWidth
            label="어디를 찾고 있나요?"
            placeholder="예: 강남 파스타 맛집"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <Button
            variant="contained"
            size="large"
            onClick={getRecommendation}
            disabled={!question.trim() || loading}
            sx={{
              backgroundColor: "#FF7A00",
              "&:hover": {
                backgroundColor: "#E66E00",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : (
              "추천받기"
            )}
          </Button>
        </Box>
      </Card>

      {/* AI 코멘트 */}
      {comment && (
        <Alert
          severity="success"
          sx={{
            mb: 4,
            backgroundColor: "#FFF3E6",
            color: "#FF7A00",
          }}
        >
          {comment}
        </Alert>
      )}

      {/* 결과 리스트 */}
      <Grid container spacing={3}>
        {places.map((p, i) => (
          <Grid size={12} key={i}>
            <Card
              onClick={() => logUserChoice(p)}
              sx={{
                cursor: user ? "pointer" : "default",
                transition: "all 0.2s ease",
                borderRadius: 3,
                "&:hover": {
                  transform: user ? "translateY(-4px)" : "none",
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: "#FF7A00" }}
                >
                  {p.name}
                </Typography>

                <Typography variant="body2" color="text.secondary" mt={1}>
                  {p.address}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    display: "inline-block",
                    mt: 2,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 10,
                    backgroundColor: "#FF7A00",
                    color: "#fff",
                  }}
                >
                  {p.category}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}