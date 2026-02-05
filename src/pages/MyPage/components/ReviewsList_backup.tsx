// src/pages/mypage/components/ReviewsList.tsx

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
} from "@mui/material";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ReportOutlinedIcon from "@mui/icons-material/ReportOutlined";
import PushPinIcon from "@mui/icons-material/PushPin";

import { type Review } from "../types/review";
import RatingStars from "./RatingStars";

interface Props {
  data: Review[];
}

const formatRelativeTime = (iso: string) => {
  const now = new Date();
  const target = new Date(iso);
  const diff = now.getTime() - target.getTime();

  const min = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);

  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  if (hour < 24) return `${hour}시간 전`;
  if (day < 7) return `${day}일 전`;

  return target.toLocaleDateString("ko-KR");
};

export default function ReviewsList({ data }: Props) {
  //const [reviews, setReviews] = React.useState(data);
  const [reportId, setReportId] = React.useState<number | null>(null);

  const sorted = [...data].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  const toggleLike = (id: number) => {
    // 좋아요 토글은 부모에서 상태 관리하는 방식으로 바꾸거나,
    // 서버에 바로 요청하고 화면 갱신
    console.log("좋아요 클릭:", id);
  };

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} sx={{ px: { xs: 1, sm: 2 } }}>
          {sorted.map((item) => (
            <Grid
              key={item.id}
              size={{ xs: 12, sm: 6, md: 4 }} //모바일: 1열 , 태블릿: 2열, 데스크탑: 3열
            >
              <Card
                key={item.id}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  boxShadow: item.pinned
                    ? "0 6px 20px rgba(25,118,210,0.25)"
                    : "0 4px 12px rgba(0,0,0,0.08)",
                  border: item.pinned ? "1px solid #1976d2" : "none",
                }}
              >
                <CardContent>
                  {/* 상단 */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {item.pinned && (
                        <Chip
                          size="small"
                          icon={<PushPinIcon />}
                          label="고정"
                          color="primary"
                        />
                      )}
                      <Typography fontWeight={700}>
                        {item.restaurantName}
                      </Typography>
                      <RatingStars rating={item.rating} />
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      {formatRelativeTime(item.createdAt)}
                      {item.updatedAt && " · 수정됨"}
                    </Typography>
                  </Box>

                  {/* 본문 */}
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {item.content}
                  </Typography>

                  <Divider sx={{ mb: 1 }} />

                  {/* 하단 액션 */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      color: "text.secondary",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => toggleLike(item.id)}
                    >
                      {item.liked ? (
                        <FavoriteIcon color="error" fontSize="small" />
                      ) : (
                        <FavoriteBorderIcon fontSize="small" />
                      )}
                    </IconButton>
                    <Typography variant="caption">{item.likeCount}</Typography>

                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <ChatBubbleOutlineIcon fontSize="small" />
                      <Typography variant="caption">
                        {item.commentCount}
                      </Typography>
                    </Box>

                    <Box sx={{ ml: "auto" }}>
                      <IconButton
                        size="small"
                        onClick={() => setReportId(item.id)}
                      >
                        <ReportOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      {/* 신고 다이얼로그 */}
      <Dialog open={reportId !== null} onClose={() => setReportId(null)}>
        <DialogTitle>리뷰 신고</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            부적절한 리뷰를 신고하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportId(null)}>취소</Button>
          <Button color="error">신고</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
