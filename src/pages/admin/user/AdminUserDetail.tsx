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
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import axios from "../../common/axios";
import { formatDateTime } from "../../common/utils/helperUtil";
import { ADMIN_USER_API } from "./api/adminUserApi";
import type { AdminUserDetail as AdminUserDetailType } from "./types/adminUser";
import { API_BASE_URL } from "../../common/config/config";

const MAIN_COLOR = "#4F9FFA";

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

  const getStatusColor = (status: string | undefined): "success" | "warning" | "error" | "default" => {
    if (status === "ACTIVE") return "success";
    if (status === "BLOCKED") return "warning";
    if (status === "DELETED") return "error";
    return "default";
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography color="text.secondary">회원 정보를 찾을 수 없습니다.</Typography>
        <Button sx={{ mt: 2, borderRadius: 2 }} onClick={() => navigate("/admin/user")}>
          목록으로
        </Button>
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
            회원 상세
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
                src={toAvatarUrl(user.profileImageUrl)}
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
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.02)" },
                }}
              >
                {user.name?.charAt(0) ?? "?"}
              </Avatar>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={700}>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {user.email}
              </Typography>
              <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={getRoleLabel(user.role)}
                  size="small"
                  color={user.role?.includes("ADMIN") ? "primary" : "default"}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
                <Chip
                  label={getStatusLabel(user.status)}
                  size="small"
                  color={getStatusColor(user.status)}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setImageViewerOpen(true)}
                  sx={{
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
        </Box>

        <ImageViewerDialog
          open={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
          imageUrl={toAvatarUrl(user.profileImageUrl)}
          alt={`${user.name} 프로필 사진`}
        />

        {/* 상세 정보 */}
        <Box sx={{ px: 4, py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <InfoRow icon={<BadgeOutlinedIcon sx={{ fontSize: 20 }} />} label="ID" value={String(user.id)} />
            <InfoRow icon={<EmailOutlinedIcon sx={{ fontSize: 20 }} />} label="이메일" value={user.email} />
            <InfoRow icon={<BadgeOutlinedIcon sx={{ fontSize: 20 }} />} label="이름" value={user.name} />
            <InfoRow icon={<BadgeOutlinedIcon sx={{ fontSize: 20 }} />} label="닉네임" value={user.nickname} />
            <InfoRow label="역할" value={getRoleLabel(user.role)} />
            <InfoRow label="상태" value={getStatusLabel(user.status)} />
            <InfoRow label="가입일" value={user.createdAt ? formatDateTime(user.createdAt) : "-"} />
            {user.updatedAt && <InfoRow label="수정일" value={formatDateTime(user.updatedAt)} />}
          </Box>
          {user.bio && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: "grey.50",
                border: "1px solid",
                borderColor: "grey.200",
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                자기소개
              </Typography>
              <Typography sx={{ mt: 1, whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: "0.9rem" }}>
                {user.bio}
              </Typography>
            </Box>
          )}

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
              variant="contained"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => navigate(`/admin/user/${id}/edit`)}
              sx={{
                borderRadius: 2,
                bgcolor: MAIN_COLOR,
                textTransform: "none",
                fontWeight: 600,
                px: 2.5,
                "&:hover": { bgcolor: "#3d8ae6" },
              }}
            >
              수정
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "grey.100",
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      {icon && (
        <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>
          {icon}
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
        <Typography sx={{ mt: 0.25, fontSize: "0.95rem", fontWeight: 500 }}>
          {value || "-"}
        </Typography>
      </Box>
    </Box>
  );
}
