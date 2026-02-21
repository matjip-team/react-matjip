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
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import { type ProfileResponse } from "../types/profile";
import ImageViewerDialog from "../../common/component/ImageViewerDialog";
import { API_BASE_URL } from "../../common/config/config";
import { withdrawAccount } from "../api/mypageApi";
import { useAuth } from "../../common/context/useAuth";

const MAIN_COLOR = "#4F9FFA";

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
      <Paper
        elevation={0}
        sx={{
          maxWidth: 560,
          mx: "auto",
          mt: 5,
          mb: 4,
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* 프로필 헤더 */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${MAIN_COLOR}08 0%, ${MAIN_COLOR}18 100%)`,
            px: 4,
            pt: 4,
            pb: 2,
          }}
        >
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
                src={previewUrl}
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
                {data.name?.charAt(0) ?? data.email?.charAt(0) ?? "?"}
              </Avatar>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ color: "text.primary", letterSpacing: "-0.02em" }}
              >
                {data.name || "-"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, fontSize: "0.9rem" }}
              >
                {data.email || "-"}
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
          imageUrl={previewUrl}
          alt="프로필 사진"
        />

        {/* 상세 정보 */}
        <Box sx={{ px: 4, py: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <InfoRow icon={<EmailOutlinedIcon sx={{ fontSize: 20 }} />} label="이메일" value={data.email} />
            <InfoRow icon={<BadgeOutlinedIcon sx={{ fontSize: 20 }} />} label="닉네임" value={data.nickname} />
            {data.bio && (
              <Box
                sx={{
                  mt: 0.5,
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
                <Typography
                  sx={{ mt: 1, whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: "0.9rem" }}
                >
                  {data.bio}
                </Typography>
              </Box>
            )}
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
              color="error"
              size="medium"
              startIcon={<PersonOffIcon fontSize="small" />}
              onClick={handleWithdrawClick}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              회원탈퇴
            </Button>
            <Button
              variant="contained"
              size="medium"
              startIcon={<EditIcon fontSize="small" />}
              onClick={onEdit}
              sx={{
                borderRadius: 2,
                bgcolor: MAIN_COLOR,
                textTransform: "none",
                fontWeight: 600,
                px: 2.5,
                "&:hover": { bgcolor: "#3d8ae6" },
              }}
            >
              프로필 수정
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={withdrawOpen}
        onClose={handleWithdrawClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 0 },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "1.25rem",
            fontWeight: 700,
            pt: 3,
            px: 3,
          }}
        >
          회원탈퇴
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2.5, lineHeight: 1.7 }}
          >
            탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
            <br />
            비밀번호를 입력해주세요.
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
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button
            onClick={handleWithdrawClose}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            취소
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleWithdrawSubmit}
            disabled={withdrawing}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {withdrawing ? "처리 중..." : "탈퇴"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
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
        <Typography
          sx={{
            mt: 0.25,
            fontSize: "0.95rem",
            fontWeight: 500,
          }}
        >
          {value || "-"}
        </Typography>
      </Box>
    </Box>
  );
}
