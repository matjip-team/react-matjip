import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Link as MuiLink,
} from "@mui/material";
import { useState } from "react";
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
        navigate("/auth/login");
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
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Typography variant="h4" fontWeight="bold" textAlign="center">
          회원가입
        </Typography>

        {globalError && <Alert severity="error">{globalError}</Alert>}

        <TextField
          label="이메일"
          value={form.email}
          onChange={handleChange("email")}
          error={!!fieldErrors.email}
          helperText={fieldErrors.email}
          required
        />

        <TextField
          label="이름"
          value={form.name}
          onChange={handleChange("name")}
          error={!!fieldErrors.name}
          helperText={fieldErrors.name}
          required
        />

        <TextField
          label="닉네임"
          value={form.nickname}
          onChange={handleChange("nickname")}
          error={!!fieldErrors.nickname}
          helperText={fieldErrors.nickname}
          required
        />

        <TextField
          label="비밀번호"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          error={!!fieldErrors.password}
          helperText={fieldErrors.password}
          required
        />

        <TextField
          label="비밀번호 확인"
          type="password"
          value={form.passwordConfirm}
          onChange={handleChange("passwordConfirm")}
          error={!!fieldErrors.passwordConfirm}
          helperText={fieldErrors.passwordConfirm}
          required
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
        >
          회원가입
        </Button>

        <Typography textAlign="center" variant="body2">
          이미 계정이 있나요?{" "}
          <MuiLink component={Link} to="/auth/login">
            로그인
          </MuiLink>
        </Typography>
      </Box>
    </Container>
  );
};

export default SignupPage;
