import * as React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
} from "@mui/material";

import AvatarUpload from "./AvatarUpload";
import { type ProfileResponse } from "../types/profile";
import { useState } from "react";
import { updateProfile } from "../api/mypageApi";
import CustomizedDialogs from "../../common/component/dialog";
import { useFormError } from "../../common/utils/useFormError";
import { API_BASE_URL } from "../../common/config/config";

interface ProfileResponseForm extends ProfileResponse {
  password: string | null;
  passwordConfirm: string | null;
  profileImage: File | null;
}

interface Props {
  data: ProfileResponse;
}
export default function ProfileEdit({ data }: Props) {
  const {
    globalError,
    fieldErrors,
    setFieldErrors,
    handleApiError,
    resetErrors,
  } = useFormError<ProfileResponseForm>();

  const EMPTY_FORM: ProfileResponseForm = {
    email: "",
    nickname: "",
    name: "",
    bio: "",
    profileImageUrl: "",
    password: "",
    passwordConfirm: "",
    profileImage: null,
  };

  const [form, setForm] = useState<ProfileResponseForm>({
    ...EMPTY_FORM,
  });

  // 이미지 미리보기
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  // 성공 다이얼로그
  const [modal, setModal] = React.useState({
    open: false,
    title: "",
    message: "",
  });

  React.useEffect(() => {
    console.log("ProfileEdit MOUNT");
    setForm((prev) => ({ ...prev, ...data }));
    if (data.profileImageUrl) {
      setPreviewUrl(`${API_BASE_URL}/images/${data.profileImageUrl}`);
    }
    return () => {
      console.log("ProfileEdit UNMOUNT");
    };
  }, [data]);

  const handleChange =
    (key: keyof ProfileResponseForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
      console.log("여긴 몇번을 탈까");
    };

  const handleFileChange = (file?: File) => {
    console.log("파일 변경 되었음");
    if (file) {
      setForm((prev) => ({ ...prev, profileImage: file }));
      setPreviewUrl(URL.createObjectURL(file)); // 미리보기 URL 생성
    } else {
      setPreviewUrl(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    // 클라이언트-side 비밀번호 확인
    if (form.password !== form.passwordConfirm) {
      setFieldErrors({ passwordConfirm: "비밀번호가 일치하지 않습니다." });
      return;
    }

    try {
      // 멀티파트는 FormData 사용
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") formData.append(key, value);
      });

      const response = await updateProfile(formData);
      //unwrapData(response.data);
      if (response.data?.success) {
        setModal({
          open: true,
          title: "성공!",
          message: response.data.message || "",
        });
      } else {
        throw new Error(response.data?.error?.message || "");
      }
    } catch (err) {
      // HTTP 400/500 등 에러 처리
      handleApiError(err); // ✅ 공통 훅으로 처리
    }
  };

  return (
    <>
      <Paper sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
        <Box
          onSubmit={handleSubmit}
          component="form"
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Typography variant="h6">회원 정보 수정</Typography>
          {globalError && <Alert severity="error">{globalError}</Alert>}
          <AvatarUpload imageUrl={previewUrl} onChange={handleFileChange} />
          <TextField
            label="이메일"
            value={form.email}
            disabled
            fullWidth
            required
          />
          <TextField
            label="비밀번호"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password}
          />
          <TextField
            label="비밀번호 확인"
            type="password"
            value={form.passwordConfirm}
            onChange={handleChange("passwordConfirm")}
            error={!!fieldErrors.passwordConfirm}
            helperText={fieldErrors.passwordConfirm}
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
            multiline
            rows={4}
          />
          <Button variant="contained" type="submit">
            저장
          </Button>
        </Box>
        <CustomizedDialogs
          open={modal.open}
          onClose={() => setModal({ ...modal, open: false })}
          title={modal.title}
          message={modal.message}
        />
      </Paper>
    </>
  );
}
