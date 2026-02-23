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

const ACCENT = "#4F9FFA";

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
    borderRadius: 1.5,
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: ACCENT,
      borderWidth: 2,
    },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: ACCENT },
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
        <CircularProgress sx={{ color: ACCENT }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 1100,
        mx: "auto",
        py: 5,
        px: { xs: 2, sm: 3 },
        mb: 4,
      }}
    >
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
          회원 수정
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#64748b" }}>
          회원 정보를 수정할 수 있습니다
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
              <Avatar
                src={toAvatarUrl(form.profileImageUrl)}
                onClick={() => setImageViewerOpen(true)}
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: 40,
                  cursor: "pointer",
                  border: "3px solid",
                  borderColor: "#fff",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  position: "relative",
                  "&:hover": { opacity: 0.95 },
                }}
              >
                {form.name?.charAt(0) ?? form.email?.charAt(0) ?? "?"}
              </Avatar>
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
          </Box>
        </Paper>

        <ImageViewerDialog
          open={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
          imageUrl={
            form.profileImageUrl ? toAvatarUrl(form.profileImageUrl) : undefined
          }
          alt="프로필 사진"
        />

        {/* 오른쪽: 폼 */}
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleSubmit}
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
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ color: "#1a1a1a" }}
            >
              회원 정보 수정
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#64748b", display: "block", mt: 0.5 }}
            >
              이름, 닉네임, 역할, 상태, 자기소개를 수정할 수 있습니다
            </Typography>
          </Box>

          <Box sx={{ px: 4, py: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                    color: "#64748b",
                  }}
                >
                  <PersonOutlineIcon sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    기본 정보
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="이메일"
                    value={form.email}
                    disabled
                    fullWidth
                    sx={textFieldSx}
                  />
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

              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                    color: "#64748b",
                  }}
                >
                  <BadgeOutlinedIcon sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    권한
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <FormControl
                    fullWidth
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  >
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
                  <FormControl
                    fullWidth
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  >
                    <InputLabel>상태</InputLabel>
                    <Select
                      value={form.status}
                      label="상태"
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          status: String(e.target.value),
                        }))
                      }
                    >
                      <MenuItem value="ACTIVE">활성</MenuItem>
                      <MenuItem value="BLOCKED">차단</MenuItem>
                      <MenuItem value="DELETED">탈퇴</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                    color: "#64748b",
                  }}
                >
                  <NotesOutlinedIcon sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    자기소개
                  </Typography>
                </Box>
                <TextField
                  label="자기소개"
                  placeholder="자기소개를 입력하세요 (선택사항)"
                  value={form.bio ?? ""}
                  onChange={handleChange("bio")}
                  fullWidth
                  multiline
                  rows={5}
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
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon fontSize="small" />}
                onClick={() => navigate("/admin/user")}
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
                목록
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`/admin/user/${id}`)}
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
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                sx={{
                  borderRadius: 1.5,
                  bgcolor: ACCENT,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  "&:hover": { bgcolor: "#e55f00" },
                }}
              >
                {submitting ? "저장 중..." : "저장"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
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
