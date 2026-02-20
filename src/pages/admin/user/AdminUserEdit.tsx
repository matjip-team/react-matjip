import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
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
import axios from "../../common/axios";
import { useFormError } from "../../common/utils/useFormError";
import { ADMIN_USER_API } from "./api/adminUserApi";
import ImageViewerDialog from "../../common/component/ImageViewerDialog";
import { API_BASE_URL } from "../../common/config/config";

interface AdminUserEditForm {
  email: string;
  name: string;
  nickname: string;
  role: string;
  status: string;
  bio?: string;
  profileImageUrl?: string;
}

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
  const MAIN_COLOR = "#4F9FFA";

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
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 5, mb: 4 }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: MAIN_COLOR, mb: 3 }}>회원 수정</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, mb: 3 }}>
            {toAvatarUrl(form.profileImageUrl) ? (
              <Box
                component="img"
                src={toAvatarUrl(form.profileImageUrl)}
                alt={form.name}
                onClick={() => setImageViewerOpen(true)}
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid #e0e0e0",
                  cursor: "pointer",
                  "&:hover": { opacity: 0.9 },
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  bgcolor: "#e0e0e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                }}
              >
                {form.name?.charAt(0) ?? form.email?.charAt(0) ?? "?"}
              </Box>
            )}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="h6">{form.name || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {form.email || "-"}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Button size="small" variant="outlined" onClick={() => setImageViewerOpen(true)}>
                  사진보기
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
          <TextField label="이메일" value={form.email} disabled fullWidth />
          <TextField
            label="이름"
            value={form.name}
            onChange={handleChange("name")}
            error={!!fieldErrors.name}
            helperText={fieldErrors.name}
            fullWidth
            required
          />
          <TextField
            label="닉네임"
            value={form.nickname}
            onChange={handleChange("nickname")}
            error={!!fieldErrors.nickname}
            helperText={fieldErrors.nickname}
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>역할</InputLabel>
            <Select
              value={form.role}
              label="역할"
              onChange={(e) =>
                setForm((p) => ({ ...p, role: String(e.target.value) }))
              }
            >
              <MenuItem value="USER">일반 (USER)</MenuItem>
              <MenuItem value="ADMIN">관리자 (ADMIN)</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>상태</InputLabel>
            <Select
              value={form.status}
              label="상태"
              onChange={(e) =>
                setForm((p) => ({ ...p, status: String(e.target.value) }))
              }
            >
              <MenuItem value="ACTIVE">활성</MenuItem>
              <MenuItem value="BLOCKED">차단</MenuItem>
              <MenuItem value="DELETED">탈퇴</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="자기소개"
            value={form.bio ?? ""}
            onChange={handleChange("bio")}
            fullWidth
            multiline
            rows={4}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate("/admin/user")}>
              목록
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(`/admin/user/${id}`)}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: MAIN_COLOR }}
            >
              {submitting ? "저장 중..." : "저장"}
            </Button>
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
