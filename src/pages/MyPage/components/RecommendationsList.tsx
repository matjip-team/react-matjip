import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BookmarkIcon from "@mui/icons-material/Bookmark";

import { type Recommendation } from "../types/recommendation";

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

interface Props {
  data: Recommendation[];
}

export default function RecommendationsList({ data }: Props) {

  console.log("여기는 추천")
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {data.map((item) => (
          <Grid key={item.id} size={{ xs: 6, sm: 6, md: 3 }}>
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
                  <RatingStars rating={item.rating} />
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
                  <Typography variant="caption">
                    {item.favorites}2222
                  </Typography>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
