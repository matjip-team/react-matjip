import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Alert,
  Link as MuiLink,
} from "@mui/material";
import { useEffect, useState } from "react";

const MAIN_COLOR = "#4F9FFA";

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: MAIN_COLOR,
      borderWidth: 2,
    },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: MAIN_COLOR },
};
import { Link, useNavigate } from "react-router-dom";
import { login } from "./api/authApi";
import type { LoginRequest } from "./api/types";
import type { FieldErrors } from "../common/types/api";
import { handleApiError } from "../common/utils/handleApiError";
import { useAuth } from "../common/context/useAuth";
import type { User } from "../common/types/user";

export type LoginForm = LoginRequest;

/** 로그인/me API는 roles 배열을 줄 수 있음 → User 타입의 role로 정규화 */
function toUser(data: { id: number; email: string; name: string; nickname: string; role?: string; roles?: string[]; profileImageUrl?: string }): User {
  const role = data.role ?? (Array.isArray(data.roles) ? data.roles[0] : undefined) ?? "ROLE_USER";
  return { id: data.id, email: data.email, name: data.name, nickname: data.nickname, role, profileImageUrl: data.profileImageUrl };
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  // 로그인된 상태면 메인으로 이동
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginForm>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange =
    (key: keyof LoginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [key]: e.target.value });
      setFieldErrors({ ...fieldErrors, [key]: undefined });
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    try {
      setLoading(true);
      const response = await login({
        email: form.email,
        password: form.password,
      });

      if (response.data?.success) {
        // 로그인 성공 시 홈으로 이동 (roles → role 정규화로 관리자 메뉴 즉시 반영)
        const data = response.data.data;
        if (data) {
          setUser(toUser(data));
          navigate("/");
        } else {
          throw new Error("로그인 오류 발생");
        }
        
        return;
      }

      // HTTP 200이지만 실패(success=false)
      const { fieldErrors: fe, globalError: ge } = handleApiError<LoginForm>({
        response: { data: response.data },
      });

      setFieldErrors(fe);
      setGlobalError(ge);
    } catch (err) {
      const { fieldErrors: fe, globalError: ge } =
        handleApiError<LoginForm>(err);
      setFieldErrors(fe);
      setGlobalError(ge);
    } finally {
      setLoading(false);
    }
  };

  if (user) return null; // 리다이렉트 중

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 6, mb: 6, px: 2 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          {/* 헤더 */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${MAIN_COLOR}08 0%, ${MAIN_COLOR}18 100%)`,
              px: 4,
              py: 4,
            }}
          >
            <Typography
              variant="h5"
              fontWeight={700}
              textAlign="center"
              sx={{ letterSpacing: "-0.02em" }}
            >
              로그인
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mt: 1 }}
            >
              오늘 뭐 먹지? 맛집을 찾아보세요
            </Typography>
          </Box>

          {/* 폼 */}
          <Box sx={{ px: 4, py: 4 }}>
            {globalError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {globalError}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="이메일"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}
                required
                fullWidth
                sx={textFieldSx}
              />
              <TextField
                label="비밀번호"
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                error={!!fieldErrors.password}
                helperText={fieldErrors.password}
                required
                fullWidth
                sx={textFieldSx}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              fullWidth
              sx={{
                mt: 4,
                py: 1.5,
                borderRadius: 2,
                bgcolor: MAIN_COLOR,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                "&:hover": { bgcolor: "#3d8ae6" },
              }}
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>

            <Typography
              textAlign="center"
              variant="body2"
              color="text.secondary"
              sx={{ mt: 3 }}
            >
              계정이 없으신가요?{" "}
              <MuiLink
                component={Link}
                to="/auth/signup"
                sx={{
                  color: MAIN_COLOR,
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                회원가입
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
