import { Box, Typography } from "@mui/material";

export default function AdminBoardPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight="bold">
        커뮤니티 관리
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        커뮤니티 관리 기능을 구현해 주세요.
      </Typography>
    </Box>
  );
}
