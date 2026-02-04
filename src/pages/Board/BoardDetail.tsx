import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../common/axios";
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
} from "@mui/material";

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);

  const MAIN_COLOR = "#ff6b00";

  useEffect(() => {
    axios.get(`/api/boards/${id}`).then((res) => {
      setPost(res.data.data);
    });
  }, [id]);

  if (!post) return <div>로딩중...</div>;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 5 }}>
      <Paper sx={{ p: 3 }}>
        {/* ===== 상단 정보 영역 ===== */}
          <Box sx={{ mb: 1 }}>
            {/* 제목 */}
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
              [{post.boardType === "NOTICE" ? "공지" : "일반"}] {post.title}
            </Typography>

            {/* 작성자/날짜 (좌) + 조회/추천 (우) */}
            <Box
              sx={{
                mt: 0.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
                color: "#666",
              }}
            >
              {/* 좌측 */}
              <Typography sx={{ fontSize: 13, color: "#666" }}>
                {post.authorNickname} ·{" "}
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleString("ko-KR")
                  : "-"}
              </Typography>

              {/* 우측 */}
              <Typography sx={{ fontSize: 13, color: "#666" }}>
                조회 {post.viewCount} | 추천 {post.recommendCount}
              </Typography>
            </Box>
          </Box>

        <Divider sx={{ my: 1 }} />

        {/* ===== 이미지 ===== */}
        {post.imageUrl && (
          <Box sx={{ my: 3, textAlign: "center" }}>
            <img
              src={post.imageUrl}
              alt="첨부 이미지"
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                borderRadius: "6px",
              }}
            />
          </Box>
        )}

        {/* ===== 본문 ===== */}
        <Typography
          sx={{
            whiteSpace: "pre-wrap",
            fontSize: 15,
            lineHeight: 1.7,
            minHeight: 200,
          }}
        >
          {post.content}
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* ===== 버튼 ===== */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            sx={{
              bgcolor: MAIN_COLOR,
              "&:hover": { bgcolor: MAIN_COLOR, opacity: 0.9 },
            }}
            onClick={() => navigate("/board")}
          >
            목록으로
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
