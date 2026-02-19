import * as React from "react";
import { Box, TextField, Button, Typography, Paper, Alert } from "@mui/material";
import AvatarUpload from "./AvatarUpload";
import { type ProfileResponse } from "../types/profile";
import { useState } from "react";
import { updateProfile } from "../api/mypageApi";
import { uploadProfileImage } from "../api/profileImageUpload";
import CustomizedDialogs from "../../common/component/dialog";
import { useFormError } from "../../common/utils/useFormError";
import { API_BASE_URL } from "../../common/config/config";

interface ProfileResponseForm extends ProfileResponse {
  password: string;
  passwordConfirm: string;
  profileImage: File | null;
}

interface Props {
  data: ProfileResponse;
}

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

const toPreviewUrl = (url?: string) => {
  if (!url) {
    return undefined;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_BASE_URL}/images/${url}`;
};

export default function ProfileEdit({ data }: Props) {
  const { globalError, fieldErrors, setFieldErrors, handleApiError, resetErrors } =
    useFormError<ProfileResponseForm>();

  const [form, setForm] = useState<ProfileResponseForm>(EMPTY_FORM);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [modal, setModal] = React.useState({
    open: false,
    title: "",
    message: "",
  });

  React.useEffect(() => {
    setForm((prev) => ({ ...prev, ...data, password: "", passwordConfirm: "", profileImage: null }));
    setPreviewUrl(toPreviewUrl(data.profileImageUrl));
  }, [data]);

  const handleChange =
    (key: keyof ProfileResponseForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (key === "bio" && value.length > 200) {
        return;
      }

      setForm((prev) => ({ ...prev, [key]: value }));
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const handleFileChange = (file?: File) => {
    if (!file) {
      setForm((prev) => ({ ...prev, profileImage: null }));
      setPreviewUrl(toPreviewUrl(form.profileImageUrl));
      return;
    }

    setForm((prev) => ({ ...prev, profileImage: file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (form.password !== form.passwordConfirm) {
      setFieldErrors({ passwordConfirm: "비밀번호가 일치하지 않습니다." });
      return;
    }

    try {
      let profileImageUrl = form.profileImageUrl || "";

      if (form.profileImage) {
        profileImageUrl = await uploadProfileImage(form.profileImage);
      }

      const formData = new FormData();
      formData.append("nickname", form.nickname);

      if (form.password) {
        formData.append("password", form.password);
      }

      if (form.bio) {
        formData.append("bio", form.bio);
      }

      if (profileImageUrl) {
        formData.append("profileImageUrl", profileImageUrl);
      }

      const response = await updateProfile(formData);

      if (response.data?.success) {
        setForm((prev) => ({
          ...prev,
          password: "",
          passwordConfirm: "",
          profileImage: null,
          profileImageUrl,
        }));
        setPreviewUrl(toPreviewUrl(profileImageUrl));
        setModal({
          open: true,
          title: "성공",
          message: response.data.message || "프로필이 수정되었습니다.",
        });
        return;
      }

      throw new Error(response.data?.error?.message || "프로필 수정에 실패했습니다.");
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <>
      <Paper sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Typography variant="h6">회원 정보 수정</Typography>
          {globalError && <Alert severity="error">{globalError}</Alert>}

          <AvatarUpload imageUrl={previewUrl} onChange={handleFileChange} />

          <TextField label="이메일" value={form.email} disabled fullWidth required />

          <TextField
            label="비밀번호"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password}
            autoComplete="new-password"
          />

          <TextField
            label="비밀번호 확인"
            type="password"
            value={form.passwordConfirm}
            onChange={handleChange("passwordConfirm")}
            error={!!fieldErrors.passwordConfirm}
            helperText={fieldErrors.passwordConfirm}
            autoComplete="new-password"
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

          <Typography variant="caption" sx={{ alignSelf: "flex-end", color: "text.secondary" }}>
            {(form.bio?.length || 0)} / 200
          </Typography>

          <Button variant="contained" type="submit">
            저장
          </Button>
        </Box>

        <CustomizedDialogs
          open={modal.open}
          onClose={() => setModal((prev) => ({ ...prev, open: false }))}
          title={modal.title}
          message={modal.message}
        />
      </Paper>
    </>
  );
}
