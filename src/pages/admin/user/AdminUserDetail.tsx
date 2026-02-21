import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Snackbar,
  Divider,
} from "@mui/material";
import ImageViewerDialog from "../../common/component/ImageViewerDialog";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
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
        <Button sx={{ mt: 2 }} onClick={() => navigate("/admin/user")}>목록으로</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 5, mb: 4 }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: MAIN_COLOR, mb: 3 }}>회원 상세</Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, mb: 3 }}>
          {toAvatarUrl(user.profileImageUrl) ? (
            <Box
              component="img"
              src={toAvatarUrl(user.profileImageUrl)}
              alt={user.name}
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
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Box sx={{ width: 100, height: 100, borderRadius: "50%", bgcolor: "#e0e0e0",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
              {user.name?.charAt(0) ?? "?"}
            </Box>
          )}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="h6">{user.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user.email}</Typography>
            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Chip label={getRoleLabel(user.role)} size="small"
                color={user.role?.includes("ADMIN") ? "primary" : "default"} variant="outlined" />
              <Chip label={getStatusLabel(user.status)} size="small"
                color={getStatusColor(user.status)} variant="outlined" />
              <Button size="small" variant="outlined" onClick={() => setImageViewerOpen(true)}>
                사진보기
              </Button>
            </Box>
          </Box>
        </Box>
        <ImageViewerDialog
          open={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
          imageUrl={toAvatarUrl(user.profileImageUrl)}
          alt={`${user.name} 프로필 사진`}
        />
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "grid", gap: 2 }}>
          <InfoRow label="ID" value={String(user.id)} />
          <InfoRow label="이메일" value={user.email} />
          <InfoRow label="이름" value={user.name} />
          <InfoRow label="닉네임" value={user.nickname} />
          <InfoRow label="역할" value={getRoleLabel(user.role)} />
          <InfoRow label="상태" value={getStatusLabel(user.status)} />
          <InfoRow label="가입일" value={user.createdAt ? formatDateTime(user.createdAt) : "-"} />
          {user.updatedAt && <InfoRow label="수정일" value={formatDateTime(user.updatedAt)} />}
          {user.bio && (
            <Box>
              <Typography variant="caption" color="text.secondary">자기소개</Typography>
              <Typography sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>{user.bio}</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate("/admin/user")}>
            목록
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            sx={{ bgcolor: MAIN_COLOR }}
            onClick={() => navigate(`/admin/user/${id}/edit`)}
          >
            수정
          </Button>
        </Box>
      </Paper>
      <Snackbar open={Boolean(toast)} autoHideDuration={2000} message={toast}
        onClose={() => setToast("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} />
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "baseline" }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>{label}</Typography>
      <Typography>{value || "-"}</Typography>
    </Box>
  );
}
