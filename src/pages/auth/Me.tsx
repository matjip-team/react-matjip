import { Box, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { logout } from "./api/authApi";

const MyPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    //logout();
    navigate("/auth/login");
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          border: "1px solid #ddd",
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" fontWeight="bold" textAlign="center">
          내 정보
        </Typography>

        <Typography>
          <strong>이름:</strong>
        </Typography>
        <Typography>
          <strong>닉네임:</strong>
        </Typography>
        <Typography>
          <strong>이메일:</strong>
        </Typography>
        <Typography>
          <strong>권한:</strong>
        </Typography>

        <Button variant="contained" color="error" onClick={handleLogout}>
          로그아웃
        </Button>
      </Box>
    </Container>
  );
};

export default MyPage;
