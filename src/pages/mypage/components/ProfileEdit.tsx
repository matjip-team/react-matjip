import * as React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";

import AvatarUpload from "./AvatarUpload";
import { type ProfileResponse } from "../types/profile";
import { useState } from "react";
import { updateProfile } from "../api/mypageApi";
import { uploadProfileImage } from "../api/profileImageUpload";
import CustomizedDialogs from "../../common/component/dialog";
import ImageViewerDialog from "../../common/component/ImageViewerDialog";
import { useFormError } from "../../common/utils/useFormError";
import { API_BASE_URL } from "../../common/config/config";

interface ProfileResponseForm extends ProfileResponse {
  password: string;
  passwordConfirm: string;
}

interface Props {
  data: ProfileResponse;
  onBack?: () => void;
  onSaved?: () => void;
}

interface HttpErrorLike {
  response?: {
    status?: number;
  };
  uploadStep?: "presign" | "s3-put";
}

const EMPTY_FORM: ProfileResponseForm = {
  email: "",
  nickname: "",
  name: "",
  bio: "",
  profileImageUrl: "",
  password: "",
  passwordConfirm: "",
};

const ACCENT = "#ff6b00";

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1.5,
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: ACCENT,
      borderWidth: 2,
    },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: ACCENT },
};

const toPreviewUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}/images/${url}`;
};

export default function ProfileEdit({ data, onBack, onSaved }: Props) {
  const {
    globalError,
    fieldErrors,
    setFieldErrors,
    handleApiError,
    resetErrors,
  } = useFormError<ProfileResponseForm>();

  const [form, setForm] = useState<ProfileResponseForm>({ ...EMPTY_FORM });
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [imageUploading, setImageUploading] = useState(false);
  const [modal, setModal] = React.useState({
    open: false,
    title: "",
    message: "",
  });
  const [imageViewerOpen, setImageViewerOpen] = React.useState(false);

  React.useEffect(() => {
    setForm((prev) => ({
      ...prev,
      ...data,
      password: "",
      passwordConfirm: "",
    }));
    setPreviewUrl(toPreviewUrl(data.profileImageUrl));
  }, [data]);

  const handleChange =
    (key: keyof ProfileResponseForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (key === "bio" && value.length > 200) return;

      setForm((prev) => ({ ...prev, [key]: value }));
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const handleFileChange = async (file?: File) => {
    if (!file) return;

    try {
      setImageUploading(true);
      setPreviewUrl(URL.createObjectURL(file));

      const fileUrl = await uploadProfileImage(file);
      setForm((prev) => ({ ...prev, profileImageUrl: fileUrl }));
      setPreviewUrl(fileUrl);
    } catch (error: unknown) {
      const status = (error as HttpErrorLike)?.response?.status;
      const uploadStep = (error as HttpErrorLike)?.uploadStep;

      if (uploadStep === "presign" && (status === 401 || status === 403)) {
        alert("로그인이 필요합니다.");
      } else if (uploadStep === "s3-put" && status === 403) {
        alert("S3 업로드 권한 또는 CORS 설정을 확인해 주세요.");
      } else {
        alert("프로필 이미지 업로드에 실패했습니다.");
      }
      setPreviewUrl(toPreviewUrl(form.profileImageUrl));
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (form.password !== form.passwordConfirm) {
      setFieldErrors({ passwordConfirm: "비밀번호가 일치하지 않습니다." });
      return;
    }

    if (imageUploading) {
      alert("이미지 업로드가 끝난 뒤 다시 시도해 주세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nickname", form.nickname);

      if (form.password) {
        formData.append("password", form.password);
      }

      if (form.bio) {
        formData.append("bio", form.bio);
      }

      if (form.profileImageUrl) {
        formData.append("profileImageUrl", form.profileImageUrl);
      }

      const response = await updateProfile(formData);
      if (response.data?.success) {
        setForm((prev) => ({
          ...prev,
          password: "",
          passwordConfirm: "",
        }));

        setModal({
          open: true,
          title: "성공",
          message: response.data.message || "프로필이 수정되었습니다.",
        });
      } else {
        throw new Error(
          response.data?.error?.message || "프로필 수정에 실패했습니다.",
        );
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
            mb: 0.5,
          }}
        >
          프로필 수정
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#64748b" }}>
          내 정보를 수정합니다
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
        {/* 왼쪽: 프로필 카드 */}
        <Paper
          elevation={0}
          sx={{
            flexShrink: 0,
            width: { xs: "100%", md: 320 },
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            alignSelf: "flex-start",
          }}
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, ${ACCENT}08 0%, ${ACCENT}15 100%)`,
              p: 3,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: -6,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${ACCENT}30, ${ACCENT}08)`,
                },
              }}
            >
              <Box sx={{ position: "relative" }}>
                <AvatarUpload
                  imageUrl={previewUrl}
                  onChange={(file) => void handleFileChange(file)}
                  size={100}
                />
              </Box>
            </Box>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ mt: 2, color: "#1a1a1a" }}
            >
              {form.name || "-"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: "#64748b" }}>
              {form.email || "-"}
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => setImageViewerOpen(true)}
              sx={{
                mt: 2,
                color: ACCENT,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#fff7ed" },
              }}
            >
              사진 보기
            </Button>
            {imageUploading && (
              <Typography
                variant="caption"
                display="block"
                sx={{ mt: 1, color: "#64748b" }}
              >
                이미지 업로드 중...
              </Typography>
            )}
          </Box>
        </Paper>

        {/* 오른쪽: 폼 */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minWidth: 0,
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
          }}
        >
          <Box
            sx={{
              px: 4,
              py: 3,
              borderBottom: "1px solid",
              borderColor: "rgba(0,0,0,0.06)",
              bgcolor: "#fafafa",
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1a1a1a" }}>
              회원 정보 수정
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.5 }}>
              프로필 정보를 수정할 수 있습니다
            </Typography>
          </Box>

          <Box
            onSubmit={handleSubmit}
            component="form"
            sx={{ display: "flex", flexDirection: "column" }}
          >
            {globalError && (
              <Alert severity="error" sx={{ m: 3, mb: 0, borderRadius: 2 }}>
                {globalError}
              </Alert>
            )}

            <ImageViewerDialog
              open={imageViewerOpen}
              onClose={() => setImageViewerOpen(false)}
              imageUrl={previewUrl}
              alt="프로필 사진"
            />

            {/* 폼 필드 */}
            <Box sx={{ px: 4, py: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* 계정 정보 */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "#64748b" }}>
                  <PersonOutlineIcon sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    계정 정보
                  </Typography>
                </Box>
                <TextField
                  label="이메일"
                  value={form.email}
                  disabled
                  fullWidth
                  sx={textFieldSx}
                />
              </Box>

              {/* 비밀번호 변경 */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "#64748b" }}>
                  <LockOutlinedIcon sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    비밀번호 변경
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="새 비밀번호"
                    type="password"
                    placeholder="변경하지 않으려면 비워두세요"
                    value={form.password}
                    onChange={handleChange("password")}
                    error={!!fieldErrors.password}
                    helperText={fieldErrors.password}
                    autoComplete="new-password"
                    fullWidth
                    sx={textFieldSx}
                  />
                  <TextField
                    label="비밀번호 확인"
                    type="password"
                    value={form.passwordConfirm}
                    onChange={handleChange("passwordConfirm")}
                    error={!!fieldErrors.passwordConfirm}
                    helperText={fieldErrors.passwordConfirm}
                    autoComplete="new-password"
                    fullWidth
                    sx={textFieldSx}
                  />
                </Box>
              </Box>

              {/* 프로필 정보 */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "#64748b" }}>
                  <BadgeOutlinedIcon sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    프로필
                  </Typography>
                </Box>
                <TextField
                  label="닉네임"
                  value={form.nickname}
                  onChange={handleChange("nickname")}
                  error={!!fieldErrors.nickname}
                  helperText={fieldErrors.nickname}
                  fullWidth
                  required
                  sx={textFieldSx}
                />
              </Box>

              {/* 자기소개 */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "#64748b" }}>
                  <NotesOutlinedIcon sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    자기소개
                  </Typography>
                </Box>
                <TextField
                  label="자기소개"
                  placeholder="자신을 소개해 주세요"
                  value={form.bio || ""}
                  onChange={handleChange("bio")}
                  error={!!fieldErrors.bio}
                  helperText={fieldErrors.bio ?? `${form.bio?.length || 0} / 200`}
                  multiline
                  rows={4}
                  fullWidth
                  sx={textFieldSx}
                />
              </Box>
            </Box>

            {/* 액션 버튼 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 4,
                pt: 3,
                borderTop: "1px solid",
                borderColor: "rgba(0,0,0,0.06)",
              }}
            >
              {onBack && (
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon fontSize="small" />}
                  onClick={onBack}
                  sx={{
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "rgba(0,0,0,0.2)",
                    color: "#64748b",
                    "&:hover": {
                      borderColor: ACCENT,
                      color: ACCENT,
                      bgcolor: "#fff7ed",
                    },
                  }}
                >
                  취소
                </Button>
              )}
              <Button
                variant="contained"
                type="submit"
                disabled={imageUploading}
                sx={{
                  borderRadius: 1.5,
                  bgcolor: ACCENT,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  "&:hover": { bgcolor: "#e55f00" },
                }}
              >
                저장
              </Button>
            </Box>
          </Box>
        </Box>
        </Paper>
      </Box>

      <CustomizedDialogs
        open={modal.open}
        onClose={() => {
          setModal({ ...modal, open: false });
          onSaved?.();
        }}
        title={modal.title}
        message={modal.message}
      />
    </>
  );
}
