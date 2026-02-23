import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Divider,
  Grid,
  Alert,
  MenuItem,
  Select,
  TextField,
  CardMedia,
  Paper,
  Skeleton,
} from "@mui/material";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ReportOutlinedIcon from "@mui/icons-material/ReportOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { useInView } from "react-intersection-observer";

import { formatRelativeTime, inputHeightSx, INPUT_HEIGHT } from "../../common/utils/helperUtil";
import { useReviews } from "../hooks/reviewsHook";
import { useFormError } from "../../common/utils/useFormError";
import type { ReviewPage } from "../types/review";
import { useQueryErrorHandler } from "../hooks/useQueryErrorHandler";
import { renderCategories } from "../components/categoryUtils";

const ACCENT = "#4F9FFA";

export default function ReviewList() {
  const navigate = useNavigate();
  /* 🔎 필터 상태 */
  const [keyword, setKeyword] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<"latest" | "rating">("latest");
  // Intersection Observer
  const { ref, inView } = useInView({
    threshold: 0.5, // 화면에 절반 이상 보이면 nextPage 호출
  });

  const { globalError, handleApiError } = useFormError<ReviewPage>();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    // isFetching,
    isFetchingNextPage,
    status,
  } = useReviews();

  useQueryErrorHandler({
    status,
    error,
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
            내가 쓴 리뷰
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#64748b" }}>
            작성한 리뷰를 관리할 수 있습니다
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
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 2,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  const toggleLike = (id: number) => {
    // 좋아요 토글은 부모에서 상태 관리하는 방식으로 바꾸거나,
    // 서버에 바로 요청하고 화면 갱신
    console.log("좋아요 클릭:", id);
  };

  // 모든 페이지의 리뷰를 하나의 배열로 합치기
  const reviews = data?.pages.flatMap((page) => page?.reviews ?? []) ?? [];

  // if (!reviews || reviews.length === 0) {
  //   return (
  //     <Box sx={{ p: 2 }}>
  //       <Typography variant="body2" color="text.secondary">
  //         작성한 리뷰가 없습니다.
  //       </Typography>
  //     </Box>
  //   );
  // }

  /* 🔍 필터 적용 */
  const filteredReviews = reviews
    .filter((r) =>
      r.restaurantName.toLowerCase().includes(keyword.toLowerCase()),
    )
    .filter((r) => r.rating >= minRating)
    .sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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
          내가 쓴 리뷰
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#64748b" }}>
          작성한 리뷰를 관리할 수 있습니다
        </Typography>
      </Box>
      {globalError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {globalError}
        </Alert>
      )}

      {/* 필터 */}
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
            onChange={(e) => setSort(e.target.value as "latest" | "rating")}
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
            <MenuItem value="latest">최신순</MenuItem>
            <MenuItem value="rating">별점순</MenuItem>
          </Select>
        </Box>
      </Paper>

      {filteredReviews.length === 0 ? (
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
          작성한 리뷰가 없습니다.
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredReviews.map((review) => (
            <Grid key={review.id} size={{ xs: 12, sm: 6, md: 6 }}>
              <Card
                variant="outlined"
                sx={{
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                  borderRadius: 2,
                  height: "100%",
                  cursor: review.restaurantId ? "pointer" : "default",
                  overflow: "hidden",
                  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                  "&:hover": review.restaurantId
                    ? {
                        borderColor: ACCENT,
                        boxShadow: `0 8px 24px ${ACCENT}20`,
                        transform: "translateY(-2px)",
                      }
                    : {},
                }}
                onClick={() => {
                  if (review.restaurantId)
                    navigate(`/restaurant/${review.restaurantId}`, {
                      state: { fromMyPageTab: 1 },
                    });
                }}
              >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  minHeight: 140,
                  "&:last-child": { pb: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 96, sm: 110, md: 120 },
                    height: { xs: 96, sm: 110, md: 120 },
                    minHeight: 96,
                    borderRadius: 1.5,
                    overflow: "hidden",
                    flexShrink: 0,
                    bgcolor: "#f1f5f9",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={review.imageUrl ?? "/images/hero-bg.jpg"}
                    alt={review.restaurantName}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </Box>

                {/* 📄 오른쪽 콘텐츠 */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minWidth: 0, // ✅ 텍스트 생존권
                  }}
                >
                  {/* 상단 */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>
                        {review.restaurantName}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: "1.05rem",
                          color: "warning.main",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {review.rating.toFixed(1)}
                        <Box
                          component="span"
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "warning.main",
                            ml: 0.3,
                          }}
                        >
                          ({review.rating.toFixed(1)}/5.0)
                        </Box>
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "0.875rem", // ✅ 원하는 크기
                        lineHeight: "1.4em",
                        height: "2.8em", // ✅ 1.4em × 2줄 = 고정 높이
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        color: "text.secondary",
                      }}
                    >
                      {review.content}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.3,
                      flexWrap: "wrap",
                      mt: 0.5,
                    }}
                  >
                    {renderCategories(review.categories)}
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
                      {review.address}
                    </Typography>
                  </Box>

                  {/* ⬇ 하단 고정 영역 */}
                  <Box sx={{ mt: "auto" }}>
                    <Divider sx={{ my: 0.5, borderColor: "rgba(0,0,0,0.06)" }} />

                    {/* 시간 + 아이콘 */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {formatRelativeTime(
                          review.updatedAt ?? review.createdAt,
                        )}
                      </Typography>

                      <Box sx={{ ml: "auto", display: "flex" }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(review.id);
                          }}
                        >
                          {review.liked ? (
                            <FavoriteIcon fontSize="small" color="error" />
                          ) : (
                            <FavoriteBorderIcon fontSize="small" />
                          )}
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChatBubbleOutlineIcon fontSize="small" />
                          <Typography variant="caption" color="text.secondary">
                            {review.reviewCount}
                          </Typography>
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ReportOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
              <div ref={ref} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
