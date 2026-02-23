import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Snackbar,
} from "@mui/material";
import ImageViewerDialog from "../../common/component/ImageViewerDialog";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import axios from "../../common/axios";
import { formatDateTime } from "../../common/utils/helperUtil";
import { ADMIN_USER_API } from "./api/adminUserApi";
import type { AdminUserDetail as AdminUserDetailType } from "./types/adminUser";
import { API_BASE_URL } from "../../common/config/config";

const ACCENT = "#ff6b00";

const toAvatarUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}/images/${url}`;
};

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await axios.get(`${ADMIN_USER_API}/${id}`);
        const data = res.data?.data ?? res.data;
        setUser(data ?? null);
      } catch {
        setToast("회원 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const getRoleLabel = (role: string) => {
    if (role === "ROLE_ADMIN" || role === "ADMIN") return "관리자";
    if (role === "ROLE_USER" || role === "USER") return "일반";
    return role ?? "-";
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return "-";
    if (status === "ACTIVE") return "활성";
    if (status === "BLOCKED") return "차단";
    if (status === "DELETED") return "탈퇴";
    return status;
  };

  const getStatusColor = (
    status: string | undefined,
  ): "success" | "warning" | "error" | "default" => {
    if (status === "ACTIVE") return "success";
    if (status === "BLOCKED") return "warning";
    if (status === "DELETED") return "error";
    return "default";
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: ACCENT }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
        <Typography sx={{ color: "#64748b", fontSize: 15 }}>
          회원 정보를 찾을 수 없습니다.
        </Typography>
        <Button
          variant="outlined"
          sx={{
            mt: 2,
            borderRadius: 1.5,
            textTransform: "none",
            fontWeight: 600,
            borderColor: ACCENT,
            color: ACCENT,
            "&:hover": { borderColor: "#e55f00", bgcolor: "#fff7ed" },
          }}
          onClick={() => navigate("/admin/user")}
        >
          목록으로
        </Button>
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
          회원 상세
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#64748b" }}>
          회원 정보를 확인할 수 있습니다
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
                src={toAvatarUrl(user.profileImageUrl)}
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
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.03)" },
                }}
              >
                {user.name?.charAt(0) ?? "?"}
              </Avatar>
            </Box>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ mt: 2, color: "#1a1a1a" }}
            >
              {user.name}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: "#64748b" }}>
              {user.email}
            </Typography>
            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Chip
                label={getRoleLabel(user.role)}
                size="small"
                sx={{
                  height: 24,
                  fontWeight: 600,
                  borderRadius: 1.5,
                  ...(user.role?.includes("ADMIN")
                    ? { bgcolor: ACCENT, color: "#fff", border: "none" }
                    : { bgcolor: "#f1f5f9", color: "#64748b", border: "none" }),
                }}
              />
              <Chip
                label={getStatusLabel(user.status)}
                size="small"
                color={getStatusColor(user.status)}
                variant="outlined"
                sx={{ height: 24, borderRadius: 1.5 }}
              />
            </Box>
            <Button
              size="small"
              variant="text"
              onClick={() => setImageViewerOpen(true)}
              sx={{
                mt: 1.5,
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

        {/* 오른쪽: 상세 정보 */}
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
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ color: "#1a1a1a" }}
            >
              회원 상세 정보
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#64748b", display: "block", mt: 0.5 }}
            >
              회원의 기본 정보와 권한을 확인합니다
            </Typography>
          </Box>

          <Box sx={{ px: 4, py: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* 기본 정보 */}
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
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    "& > *": {
                      py: 1.5,
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                    },
                    "& > *:last-child": { borderBottom: "none", pb: 0 },
                  }}
                >
                  <DetailField label="ID" value={String(user.id)} />
                  <DetailField label="이메일" value={user.email} />
                  <DetailField label="이름" value={user.name} />
                  <DetailField label="닉네임" value={user.nickname} />
                </Box>
              </Box>

              {/* 권한 */}
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
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    "& > *": {
                      py: 1.5,
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                    },
                    "& > *:last-child": { borderBottom: "none", pb: 0 },
                  }}
                >
                  <DetailField label="역할" value={getRoleLabel(user.role)} />
                  <DetailField
                    label="상태"
                    value={getStatusLabel(user.status)}
                  />
                  <DetailField
                    label="가입일"
                    value={
                      user.createdAt ? formatDateTime(user.createdAt) : "-"
                    }
                  />
                  {user.updatedAt && (
                    <DetailField
                      label="수정일"
                      value={formatDateTime(user.updatedAt)}
                    />
                  )}
                </Box>
              </Box>

              {/* 자기소개 */}
              {(user.bio ?? "").trim() ? (
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
                  <Typography
                    sx={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.8,
                      fontSize: "0.95rem",
                      color: "#334155",
                    }}
                  >
                    {user.bio}
                  </Typography>
                </Box>
              ) : null}
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
                variant="contained"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => navigate(`/admin/user/${id}/edit`)}
                sx={{
                  borderRadius: 1.5,
                  bgcolor: ACCENT,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  "&:hover": { bgcolor: "#e55f00" },
                }}
              >
                수정
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      <ImageViewerDialog
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={toAvatarUrl(user.profileImageUrl)}
        alt={`${user.name} 프로필 사진`}
      />
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

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: "0.95rem", fontWeight: 500, color: "#1a1a1a" }}
      >
        {value || "-"}
      </Typography>
    </Box>
  );
}
