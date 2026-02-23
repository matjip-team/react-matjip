import Box from "@mui/material/Box";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

interface Props {
  rating: number;
}

export default function RatingStars({ rating }: Props) {
  return (
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
}
