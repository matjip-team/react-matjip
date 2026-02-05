import { useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Divider,
  Grid,
  Alert,
} from "@mui/material";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ReportOutlinedIcon from "@mui/icons-material/ReportOutlined";
import { useInView } from "react-intersection-observer";

import RatingStars from "./RatingStars";
import { formatRelativeTime } from "../../common/utils/helperUtil";
import { useReviews } from "../hooks/reviewsHook";
import { useFormError } from "../../common/utils/useFormError";
import type { ReviewPage } from "../types/review";
import { useQueryErrorHandler } from "../hooks/useQueryErrorHandler";

export default function ReviewsList() {
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
    // 초기 로딩 Skeleton
    return <div>로딩중</div>;
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

  return (
    <>
      <Box sx={{ p: 2 }}>
        {globalError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {globalError}
          </Alert>
        )}

        <Box
          sx={{
            py: 6,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="body1" fontWeight={500}>
            작성한 리뷰가 없습니다
          </Typography>
          <Typography variant="caption">첫 리뷰를 작성해보세요 ✍️</Typography>
        </Box>

        <Grid container spacing={2} sx={{ px: { xs: 1, sm: 2 } }}>
          {reviews.map((review) => (
            <Grid
              key={review.id}
              size={{ xs: 12, sm: 6, md: 4 }} //모바일: 1열 , 태블릿: 2열, 데스크탑: 3열
            >
              <Card
                key={review.id}
                sx={{
                  mb: 2,
                  borderRadius: 3,
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
                      <Typography fontWeight={700}>
                        {review.restaurantName}
                      </Typography>
                      내평가
                      <RatingStars rating={review.rating} />
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      {formatRelativeTime(review.createdAt)}
                      {review.updatedAt && " · 수정됨"}
                    </Typography>
                  </Box>

                  {/* 본문 */}
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {review.content}
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
                      onClick={() => toggleLike(review.id)}
                    >
                      {review.liked ? (
                        <FavoriteIcon color="error" fontSize="small" />
                      ) : (
                        <FavoriteBorderIcon fontSize="small" />
                      )}
                    </IconButton>
                    <Typography variant="caption">
                      {review.likeCount}
                    </Typography>

                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <ChatBubbleOutlineIcon fontSize="small" />
                      <Typography variant="caption">
                        {review.commentCount}
                      </Typography>
                    </Box>

                    <Box sx={{ ml: "auto" }}>
                      <IconButton
                        size="small"
                        // onClick={() => setReportId(item.id)}
                      >
                        <ReportOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              {/* Intersection Observer가 감지할 div */}
              <div ref={ref} className="h-10 w-full" />
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
}
