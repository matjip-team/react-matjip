import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import { type ProfileResponse } from "../types/profile";
import ImageViewerDialog from "../../common/component/ImageViewerDialog";
import { API_BASE_URL } from "../../common/config/config";
import { withdrawAccount } from "../api/mypageApi";
import { useAuth } from "../../common/context/useAuth";

interface Props {
  data: ProfileResponse;
  onEdit: () => void;
}

const toPreviewUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}/images/${url}`;
};

export default function ProfileInfo({ data, onEdit }: Props) {
  const { logout } = useAuth();
  const [imageViewerOpen, setImageViewerOpen] = React.useState(false);
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const [withdrawPassword, setWithdrawPassword] = React.useState("");
  const [withdrawError, setWithdrawError] = React.useState("");
  const [withdrawing, setWithdrawing] = React.useState(false);
  const previewUrl = toPreviewUrl(data.profileImageUrl);

  const handleWithdrawClick = () => {
    setWithdrawPassword("");
    setWithdrawError("");
    setWithdrawOpen(true);
  };

  const handleWithdrawClose = () => {
    setWithdrawOpen(false);
    setWithdrawPassword("");
    setWithdrawError("");
  };

  const handleWithdrawSubmit = async () => {
    if (!withdrawPassword.trim()) {
      setWithdrawError("비밀번호를 입력해주세요.");
      return;
    }
    try {
      setWithdrawing(true);
      setWithdrawError("");
      await withdrawAccount(withdrawPassword);
      handleWithdrawClose();
      logout();
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; error?: { message?: string } } } })?.response?.data;
      const msg = res?.message ?? res?.error?.message;
      setWithdrawError(msg || "비밀번호가 일치하지 않습니다.");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <>
      <Paper sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h6">회원 정보</Typography>

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
            <Avatar
              src={previewUrl}
              onClick={() => setImageViewerOpen(true)}
              sx={{
                width: 100,
                height: 100,
                fontSize: 40,
                cursor: "pointer",
                border: "1px solid #e0e0e0",
                "&:hover": { opacity: 0.9 },
              }}
            >
              {data.name?.charAt(0) ?? data.email?.charAt(0) ?? "?"}
            </Avatar>
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="h6">{data.name || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {data.email || "-"}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setImageViewerOpen(true)}
                >
                  사진보기
                </Button>
              </Box>
            </Box>
          </Box>

          <ImageViewerDialog
            open={imageViewerOpen}
            onClose={() => setImageViewerOpen(false)}
            imageUrl={previewUrl}
            alt="프로필 사진"
          />

          <Box sx={{ display: "grid", gap: 1.5 }}>
            <InfoRow label="이메일" value={data.email} />
            <InfoRow label="닉네임" value={data.nickname} />
            {data.bio && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  자기소개
                </Typography>
                <Typography sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                  {data.bio}
                </Typography>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              mt: 3,
              pt: 2,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Button
              variant="outlined"
              color="error"
              startIcon={<PersonOffIcon />}
              onClick={handleWithdrawClick}
            >
              회원탈퇴
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={onEdit}
            >
              수정
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog open={withdrawOpen} onClose={handleWithdrawClose} maxWidth="xs" fullWidth>
        <DialogTitle>회원탈퇴</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다. 비밀번호를 입력해주세요.
          </Typography>
          <TextField
            type="password"
            label="비밀번호"
            value={withdrawPassword}
            onChange={(e) => {
              setWithdrawPassword(e.target.value);
              setWithdrawError("");
            }}
            error={!!withdrawError}
            helperText={withdrawError}
            fullWidth
            autoComplete="current-password"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleWithdrawClose}>취소</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleWithdrawSubmit}
            disabled={withdrawing}
          >
            {withdrawing ? "처리 중..." : "탈퇴"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "baseline" }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
        {label}
      </Typography>
      <Typography>{value || "-"}</Typography>
    </Box>
  );
}
