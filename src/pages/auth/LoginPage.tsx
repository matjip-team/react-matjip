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
import { login } from "./api/authApi";
import type { LoginRequest } from "./api/types";
import type { FieldErrors } from "../common/types/api";
import { handleApiError } from "../common/utils/handleApiError";
import { useAuth } from "../common/context/useAuth";
import type { User } from "../common/types/user";

export type LoginForm = LoginRequest;

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

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
        const loginUser = response.data.data;
        if (loginUser) {
          const normalizedUser: User = {
            id: loginUser.id,
            email: loginUser.email,
            name: loginUser.name,
            nickname: loginUser.nickname,
            role: loginUser.role ?? loginUser.roles?.[0] ?? "ROLE_USER",
          };
          setUser(normalizedUser);
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

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Typography variant="h4" fontWeight="bold" textAlign="center">
          로그인
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
          label="비밀번호"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          error={!!fieldErrors.password}
          helperText={fieldErrors.password}
          required
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
        >
          로그인
        </Button>

        <Typography textAlign="center" variant="body2">
          계정이 없으신가요?{" "}
          <MuiLink component={Link} to="/auth/signup">
            회원가입
          </MuiLink>
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;
