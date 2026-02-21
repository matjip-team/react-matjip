import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import axios from "../../common/axios";
import { useFormError } from "../../common/utils/useFormError";
import { ADMIN_USER_API } from "./api/adminUserApi";
import ImageViewerDialog from "../../common/component/ImageViewerDialog";
import { API_BASE_URL } from "../../common/config/config";

const MAIN_COLOR = "#4F9FFA";

interface AdminUserEditForm {
  email: string;
  name: string;
  nickname: string;
  role: string;
  status: string;
  bio?: string;
  profileImageUrl?: string;
}

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

const toAvatarUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}/images/${url}`;
};

export default function AdminUserEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fieldErrors, handleApiError, resetErrors } =
    useFormError<AdminUserEditForm>();
  const [form, setForm] = useState<AdminUserEditForm>({
    email: "",
    name: "",
    nickname: "",
    role: "ROLE_USER",
    status: "ACTIVE",
    bio: "",
    profileImageUrl: "",
  });
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await axios.get(`${ADMIN_USER_API}/${id}`);
        const data = res.data?.data ?? res.data;
        if (data) {
          setForm({
            email: data.email ?? "",
            name: data.name ?? "",
            nickname: data.nickname ?? "",
            role: data.role ?? "ROLE_USER",
            status: data.status ?? "ACTIVE",
            bio: data.bio ?? "",
            profileImageUrl: data.profileImageUrl ?? "",
          });
        }
      } catch {
        setToast("회원 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleChange =
    (key: keyof AdminUserEditForm) =>
    (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
      setForm((prev) => ({
        ...prev,
        [key]: (e.target as HTMLInputElement).value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();
    if (!id) return;
    try {
      setSubmitting(true);
      await axios.put(`${ADMIN_USER_API}/${id}`, {
        name: form.name,
        nickname: form.nickname,
        role: form.role,
        status: form.status,
        bio: form.bio,
        profileImageUrl: form.profileImageUrl,
      });
      setToast("수정되었습니다.");
      setTimeout(() => navigate(`/admin/user/${id}`), 500);
    } catch (err) {
      handleApiError(err);
      setToast("수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 560, mx: "auto", mt: 5, mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box component="form" onSubmit={handleSubmit}>
          {/* 헤더 */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${MAIN_COLOR}08 0%, ${MAIN_COLOR}18 100%)`,
              px: 4,
              pt: 4,
              pb: 3,
            }}
          >
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ color: "text.primary", letterSpacing: "-0.02em", mb: 3 }}
            >
              회원 수정
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Box
                sx={{
                  position: "relative",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: -4,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${MAIN_COLOR}40, ${MAIN_COLOR}10)`,
                  },
                }}
              >
                <Avatar
                  src={toAvatarUrl(form.profileImageUrl)}
                  onClick={() => setImageViewerOpen(true)}
                  sx={{
                    width: 88,
                    height: 88,
                    fontSize: 36,
                    cursor: "pointer",
                    border: "3px solid",
                    borderColor: "background.paper",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                    position: "relative",
                    "&:hover": { opacity: 0.95 },
                  }}
                >
                  {form.name?.charAt(0) ?? form.email?.charAt(0) ?? "?"}
                </Avatar>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={600}>
                  {form.name || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {form.email || "-"}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setImageViewerOpen(true)}
                  sx={{
                    mt: 1.5,
                    color: MAIN_COLOR,
                    fontWeight: 600,
                    "&:hover": { bgcolor: `${MAIN_COLOR}12` },
                  }}
                >
                  사진 보기
                </Button>
              </Box>
            </Box>
          </Box>

          <ImageViewerDialog
            open={imageViewerOpen}
            onClose={() => setImageViewerOpen(false)}
            imageUrl={form.profileImageUrl ? toAvatarUrl(form.profileImageUrl) : undefined}
            alt="프로필 사진"
          />

          {/* 폼 필드 */}
          <Box sx={{ px: 4, py: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "text.secondary" }}>
                  <PersonOutlineIcon sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    기본 정보
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField label="이메일" value={form.email} disabled fullWidth sx={textFieldSx} />
                  <TextField
                    label="이름"
                    value={form.name}
                    onChange={handleChange("name")}
                    error={!!fieldErrors.name}
                    helperText={fieldErrors.name}
                    fullWidth
                    required
                    sx={textFieldSx}
                  />
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
              </Box>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "text.secondary" }}>
                  <BadgeOutlinedIcon sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    권한
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <FormControl fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}>
                    <InputLabel>역할</InputLabel>
                    <Select
                      value={form.role}
                      label="역할"
                      onChange={(e) => setForm((p) => ({ ...p, role: String(e.target.value) }))}
                    >
                      <MenuItem value="USER">일반 (USER)</MenuItem>
                      <MenuItem value="ADMIN">관리자 (ADMIN)</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}>
                    <InputLabel>상태</InputLabel>
                    <Select
                      value={form.status}
                      label="상태"
                      onChange={(e) => setForm((p) => ({ ...p, status: String(e.target.value) }))}
                    >
                      <MenuItem value="ACTIVE">활성</MenuItem>
                      <MenuItem value="BLOCKED">차단</MenuItem>
                      <MenuItem value="DELETED">탈퇴</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "text.secondary" }}>
                  <NotesOutlinedIcon sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    자기소개
                  </Typography>
                </Box>
                <TextField
                  label="자기소개"
                  placeholder="자기소개를 입력하세요"
                  value={form.bio ?? ""}
                  onChange={handleChange("bio")}
                  fullWidth
                  multiline
                  rows={4}
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
                borderColor: "divider",
              }}
            >
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon fontSize="small" />}
                onClick={() => navigate("/admin/user")}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                목록
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`/admin/user/${id}`)}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                sx={{
                  borderRadius: 2,
                  bgcolor: MAIN_COLOR,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  "&:hover": { bgcolor: "#3d8ae6" },
                }}
              >
                {submitting ? "저장 중..." : "저장"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2000}
        message={toast}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
