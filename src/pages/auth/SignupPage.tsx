import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Alert,
  Link as MuiLink,
} from "@mui/material";
import { useState } from "react";

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
import { signup } from "./api/authApi";
import type { SignupRequest } from "./api/types";
import { handleApiError } from "../common/utils/handleApiError";

interface SignupForm extends SignupRequest {
  passwordConfirm: string;
}

// keyof SignupForm 은 SignupForm의 키들만 뽑아낸 타입
// Record<K, T>는 TypeScript에서 K 타입 키들을 가진 객체를 만들고, 각 키의 값 타입을 T로 지정
// Partial<T>는 T 타입의 모든 필드를 optional로 만들어 줌
type FieldErrors = Partial<Record<keyof SignupForm, string>>;

const SignupPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<SignupForm>({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    nickname: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange =
    (key: keyof SignupForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [key]: e.target.value });
      setFieldErrors({ ...fieldErrors, [key]: undefined });
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    // 클라이언트-side 비밀번호 확인
    if (form.password !== form.passwordConfirm) {
      setFieldErrors({ passwordConfirm: "비밀번호가 일치하지 않습니다." });
      return;
    }

    try {
      setLoading(true);

      const response = await signup({
        email: form.email,
        password: form.password,
        name: form.name,
        nickname: form.nickname,
      });

      // 서버가 HTTP 200이면 success 체크
      if (response.data?.success) {
        navigate("/auth/login", {
          state: { signupSuccess: "회원 가입처리 되었습니다. 로그인 하세요." },
        });
        return;
      }

      // HTTP 200인데 실패인 경우
      if (!response.data?.success) {
        throw response.data; // 여기서 그냥 던짐
      }
    } catch (err) {
      // HTTP 400/500 등 에러 처리
      const { fieldErrors: fe, globalError: ge } =
        handleApiError<SignupForm>(err);
      setFieldErrors(fe);
      setGlobalError(ge);
    } finally {
      setLoading(false);
    }
  };

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
          autoComplete="off"
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
              회원가입
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mt: 1 }}
            >
              맛집 탐방을 시작해보세요
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
                autoComplete="off"
                sx={textFieldSx}
              />
              <TextField
                label="이름"
                value={form.name}
                onChange={handleChange("name")}
                error={!!fieldErrors.name}
                helperText={fieldErrors.name}
                required
                fullWidth
                autoComplete="off"
                sx={textFieldSx}
              />
              <TextField
                label="닉네임"
                value={form.nickname}
                onChange={handleChange("nickname")}
                error={!!fieldErrors.nickname}
                helperText={fieldErrors.nickname}
                required
                fullWidth
                autoComplete="off"
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
                autoComplete="new-password"
                sx={textFieldSx}
              />
              <TextField
                label="비밀번호 확인"
                type="password"
                value={form.passwordConfirm}
                onChange={handleChange("passwordConfirm")}
                error={!!fieldErrors.passwordConfirm}
                helperText={fieldErrors.passwordConfirm}
                required
                fullWidth
                autoComplete="new-password"
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
              {loading ? "가입 중..." : "회원가입"}
            </Button>

            <Typography
              textAlign="center"
              variant="body2"
              color="text.secondary"
              sx={{ mt: 3 }}
            >
              이미 계정이 있나요?{" "}
              <MuiLink
                component={Link}
                to="/auth/login"
                sx={{
                  color: MAIN_COLOR,
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                로그인
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default SignupPage;
