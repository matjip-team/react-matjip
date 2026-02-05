import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BookmarkIcon from "@mui/icons-material/Bookmark";

import { type LikesPage } from "../types/likes";
import { useEffect } from "react";
import { useQueryErrorHandler } from "../hooks/useQueryErrorHandler";
import { useLikes } from "../hooks/LikesHook";
import { useFormError } from "../../common/utils/useFormError";
import { useInView } from "react-intersection-observer";

// 별점 컴포넌트
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
  // Intersection Observer
  const { ref, inView } = useInView({
    threshold: 0.5, // 화면에 절반 이상 보이면 nextPage 호출
  });

  const { globalError, handleApiError } = useFormError<LikesPage>();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    // isFetching,
    isFetchingNextPage,
    status,
  } = useLikes();

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

  // 모든 페이지의 리뷰를 하나의 배열로 합치기
  const likes = data?.pages.flatMap((page) => page?.likes ?? []) ?? [];

  return (
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
          선택한 좋아요가 없습니다
        </Typography>
        <Typography variant="caption">
          첫 좋아요를 누르고 싶은 가게를 선택해보세요 ✍️
        </Typography>
      </Box>
      <Grid container spacing={2} sx={{ px: { xs: 1, sm: 2 } }}>
        {likes.map((item) => (
          <Grid key={item.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardMedia
                component="img"
                height="140"
                // image={item.image}
                image="/images/hero-bg.jpg"
                alt={item.restaurantName}
              />
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column", // 위아래로 쌓이도록
                    mb: 1,
                  }}
                >
                  <RatingStars rating={item.avgRating} />
                  <Typography
                    fontWeight={700}
                    sx={{
                      mt: 0.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.restaurantName}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  대표 메뉴: {item.menu}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <VisibilityIcon fontSize="small" />
                  <Typography variant="caption">{item.views}11111</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <FavoriteIcon fontSize="small" />
                  <Typography variant="caption">{item.likes}1111</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <BookmarkIcon fontSize="small" />
                  <Typography variant="caption">{item.favorites}</Typography>
                </Box>
              </CardActions>
            </Card>
            {/* Intersection Observer가 감지할 div */}
            <div ref={ref} className="h-10 w-full" />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
