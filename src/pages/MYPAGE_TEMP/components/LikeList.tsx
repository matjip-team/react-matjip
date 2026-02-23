import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  Alert,
  TextField,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
  Paper,
  Skeleton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";

import { useNavigate } from "react-router-dom";
import { type LikesPage } from "../types/likes";
import React, { useEffect, useState } from "react";
import { useQueryErrorHandler } from "../hooks/useQueryErrorHandler";
import { useDeleteLike, useLikes } from "../hooks/LikesHook";
import { useFormError } from "../../common/utils/useFormError";
import { inputHeightSx, INPUT_HEIGHT } from "../../common/utils/helperUtil";
import { useInView } from "react-intersection-observer";
import { renderCategories } from "../components/categoryUtils";
import CustomizedDialogs from "../../common/component/dialog";

/* ⭐ 별점 */
const ACCENT = "#4F9FFA";

const RatingStars = ({ rating }: { rating: number }) => (
  <Box sx={{ display: "flex", alignItems: "center" }}>
    {Array.from({ length: 5 }).map((_, i) =>
      i < rating ? (
        <StarIcon key={i} fontSize="small" color="warning" />
      ) : (
        <StarBorderIcon key={i} fontSize="small" color="disabled" />
      ),
    )}
  </Box>
);

export default function LikeList() {
  const navigate = useNavigate();
  /* 🔎 필터 상태 */
  const [keyword, setKeyword] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<"rating" | "reviews" | "views">("rating");

  /* ♾ Infinite Scroll */
  const { ref, inView } = useInView({ threshold: 0.5 });

  const { globalError, handleApiError } = useFormError<LikesPage>();

  // 성공 다이얼로그
  const [modal, setModal] = React.useState({
    open: false,
    title: "",
    message: "",
  });

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useLikes();

  const {
    mutate: deleteLike,
    isPending: isDeleting,
    status: deleteLikeStatus,
    error: deleteLikeError,
  } = useDeleteLike();

  useQueryErrorHandler({ status, error, handleApiError });
  useQueryErrorHandler({
    status: deleteLikeStatus,
    error: deleteLikeError,
    handleApiError,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === "pending") {
    return (
      <Box sx={{ p: 0 }}>
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
            찜한 식당
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#64748b" }}>
            찜해둔 맛집을 확인해보세요
          </Typography>
        </Box>
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
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Skeleton variant="rounded" width={160} height={40} />
            <Skeleton variant="rounded" width={110} height={40} />
            <Skeleton variant="rounded" width={120} height={40} />
          </Box>
        </Paper>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} variant="rounded" height={220} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  /* 📦 데이터 병합 */
  const likes = data?.pages.flatMap((page) => page?.likes ?? []) ?? [];

  /* 🔍 필터 + 정렬 */
  const filteredLikes = likes
    .filter((item) =>
      item.restaurantName.toLowerCase().includes(keyword.toLowerCase()),
    )
    .filter((item) => item.avgRating >= minRating)
    .sort((a, b) => {
      if (sort === "rating") return b.avgRating - a.avgRating;
      if (sort === "reviews") return b.reviewCount - a.reviewCount;
      if (sort === "views") return b.views - a.views;
      return 0;
    });

  const handleDeleteLike = (likeId: number) => {
    deleteLike(likeId, {
      onSuccess: () => {
        setModal({
          open: true,
          title: "성공!",
          message: "좋아요가 삭제되었습니다.",
        });
      },
      onError: (error) => {
        handleApiError(error);
      },
    });
  };

  return (
    <Box sx={{ p: 0 }}>
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
          찜한 식당
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#64748b" }}>
          찜해둔 맛집을 확인해보세요
        </Typography>
      </Box>
      {globalError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {globalError}
        </Alert>
      )}

      {/* 필터 영역 */}
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
            justifyContent: "flex-end",
            gap: 1.5,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            placeholder="가게명 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            sx={{
              flex: "1 1 200px",
              minWidth: { xs: "100%", sm: 180 },
              "& .MuiOutlinedInput-root": {
                bgcolor: "#fff",
                borderRadius: 1,
                height: INPUT_HEIGHT,
                minHeight: INPUT_HEIGHT,
              },
            }}
          />
          <Select
            size="small"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            sx={{
              minWidth: 110,
              bgcolor: "#fff",
              borderRadius: 1,
              ...inputHeightSx,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(0,0,0,0.08)",
              },
            }}
          >
            <MenuItem value={0}>전체</MenuItem>
            <MenuItem value={4}>⭐ 4점+</MenuItem>
            <MenuItem value={3}>⭐ 3점+</MenuItem>
          </Select>
          <Select
            size="small"
            value={sort}
            onChange={(e) =>
              setSort(e.target.value as "rating" | "reviews" | "views")
            }
            sx={{
              minWidth: 120,
              bgcolor: "#fff",
              borderRadius: 1,
              ...inputHeightSx,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(0,0,0,0.08)",
              },
            }}
          >
            <MenuItem value="rating">별점순</MenuItem>
            <MenuItem value="reviews">리뷰순</MenuItem>
            <MenuItem value="views">조회순</MenuItem>
          </Select>
        </Box>
      </Paper>

      {/* 결과 없음 */}
      {filteredLikes.length === 0 ? (
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
          조건에 맞는 찜한 식당이 없습니다.
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredLikes.map((item) => (
            <Grid key={item.id} size={{ xs: 12, sm: 4, md: 4 }}>
              <Card
                variant="outlined"
                sx={{
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                  borderRadius: 2,
                  cursor: item.restaurantId ? "pointer" : "default",
                  overflow: "hidden",
                  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                  "&:hover": item.restaurantId
                    ? {
                        borderColor: ACCENT,
                        boxShadow: `0 8px 24px ${ACCENT}20`,
                        transform: "translateY(-2px)",
                      }
                    : {},
                }}
                onClick={() => {
                  if (item.restaurantId)
                    navigate(`/restaurant/${item.restaurantId}`, {
                      state: { fromMyPageTab: 0 },
                    });
                }}
              >
                <Box
                  sx={{
                    height: 140,
                    overflow: "hidden",
                    bgcolor: "#f1f5f9",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={item.imageUrl ?? "/images/hero-bg.jpg"}
                    alt={item.restaurantName}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </Box>
                <CardContent sx={{ py: 2, px: 2 }}>
                <RatingStars rating={item.avgRating} />
                <Typography fontWeight={700} noWrap>
                  {item.restaurantName}
                </Typography>
                {/* 카테고리 배지 */}
                <Box
                  sx={{ display: "flex", gap: 0.3, flexWrap: "wrap", mt: 0.5 }}
                >
                  {renderCategories(item.categories)}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center", // ✅ 세로 중앙 정렬
                    gap: 0.1,
                    minWidth: 0,
                    mt: 2,
                    mb: 0,
                  }}
                >
                  <LocationOnOutlinedIcon
                    sx={{
                      fontSize: "0.9rem",
                      color: "text.secondary",
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.2,
                      whiteSpace: "nowrap", // 한 줄 고정
                      overflow: "hidden",
                      textOverflow: "ellipsis", // … 처리
                    }}
                  >
                    {item.address}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions
                sx={{ justifyContent: "space-between" }}
                onClick={(e) => e.stopPropagation()}
              >
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <VisibilityIcon fontSize="small" />
                  <Typography variant="caption">{item.views}</Typography>
                </Box>
                <Box
                  sx={{ display: "flex", gap: 0.5 }}
                  onClick={() => {
                    if (!isDeleting) handleDeleteLike(item.id);
                  }}
                >
                  <IconButton size="small">
                    <Tooltip title="좋아요 취소">
                      <FavoriteIcon fontSize="small" sx={{ color: "red" }} />
                    </Tooltip>
                    <Typography variant="caption">
                      {item.reviewCount}
                    </Typography>
                  </IconButton>
                </Box>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <BookmarkIcon fontSize="small" />
                  <Typography variant="caption">{item.favorites}</Typography>
                </Box>
              </CardActions>
            </Card>

              <div ref={ref} style={{ height: 10 }} />
            </Grid>
          ))}
        </Grid>
      )}
      <CustomizedDialogs
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.title}
        message={modal.message}
      />
    </Box>
  );
}
