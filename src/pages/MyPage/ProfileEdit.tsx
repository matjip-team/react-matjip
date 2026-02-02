import * as React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
} from "@mui/material";

import AvatarUpload from "./components/AvatarUpload";
import { type UserInfo } from "./types/user";
import axios from "../common/axios";
import { useState } from "react";
import { profileEdit } from "./api/mypageApi";
import { useNavigate } from "react-router-dom";
import { handleApiError } from "../common/utils/handleApiError";

interface UserInfoForm extends UserInfo {
  passwordConfirm: string;
}

type FieldErrors = Partial<Record<keyof UserInfoForm, string>>;

export default function ProfileEdit() {
  const [form, setForm] = useState<UserInfoForm>({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    nickname: "",
  });

  const navigate = useNavigate();

  //const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>(
    form.profileImageUrl,
  );
  //const [loading, setLoading] = useState(false);

  const handleChange =
    (key: keyof UserInfoForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [key]: e.target.value });
      setFieldErrors({ ...fieldErrors, [key]: undefined });
    };

  const handleFileChange = (file?: File) => {
    if (file) {
      setForm({ ...form, profileImage: file });
      //setSelectedFile(file);

      setPreviewUrl(URL.createObjectURL(file)); // 미리보기 URL 생성
    } else {
      setPreviewUrl(undefined);
    }
  };

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const resUser = await axios.get<UserInfoForm>("/api/mypage/userInfo");
        setForm(resUser.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

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
      //setLoading(true);

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") formData.append(key, value);
      });

      const response = await profileEdit(formData);

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
        handleApiError<UserInfoForm>(err);
      setFieldErrors(fe);
      setGlobalError(ge);
    } finally {
      //setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 500, mx: "auto", mt: 4 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6">회원 정보 수정</Typography>
        {globalError && <Alert severity="error">{globalError}</Alert>}
        <AvatarUpload imageUrl={previewUrl} onChange={handleFileChange} />

        <TextField label="이메일" value={form.email} disabled fullWidth />

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

        <TextField
          label="닉네임"
          value={form.nickname}
          onChange={handleChange("nickname")}
          error={!!fieldErrors.nickname}
          helperText={fieldErrors.nickname}
          required
        />

        <TextField
          label="자기소개"
          value={form.bio || ""}
          onChange={handleChange("bio")}
          error={!!fieldErrors.bio}
          helperText={fieldErrors.bio}
          required
        />

        <Button variant="contained" onClick={handleSubmit}>
          저장
        </Button>
      </Box>
    </Paper>
  );
}
