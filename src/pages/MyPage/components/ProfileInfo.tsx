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
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import { type ProfileResponse } from "../types/profile";
import ImageViewerDialog from "../../common/component/ImageViewerDialog";
import { API_BASE_URL } from "../../common/config/config";
import { withdrawAccount } from "../api/mypageApi";
import { useAuth } from "../../common/context/useAuth";

const ACCENT = "#ff6b00";

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
          내 정보
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#64748b" }}>
          프로필을 확인하고 수정할 수 있습니다
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
                src={previewUrl}
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
                {data.name?.charAt(0) ?? data.email?.charAt(0) ?? "?"}
              </Avatar>
            </Box>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ mt: 2, color: "#1a1a1a" }}
            >
              {data.name || "-"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: "#64748b" }}>
              {data.email || "-"}
            </Typography>
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
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1a1a1a" }}>
              프로필 상세 정보
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.5 }}>
              나의 프로필 정보를 확인합니다
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "#64748b" }}>
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
                  <DetailField label="이메일" value={data.email} />
                  <DetailField label="닉네임" value={data.nickname} />
                </Box>
              </Box>

              {/* 자기소개 */}
              {(data.bio ?? "").trim() ? (
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
                  <Typography
                    sx={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.8,
                      fontSize: "0.95rem",
                      color: "#334155",
                    }}
                  >
                    {data.bio}
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
                color="error"
                startIcon={<PersonOffIcon fontSize="small" />}
                onClick={handleWithdrawClick}
                sx={{
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                회원탈퇴
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon fontSize="small" />}
                onClick={onEdit}
                sx={{
                  borderRadius: 1.5,
                  bgcolor: ACCENT,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  "&:hover": { bgcolor: "#e55f00" },
                }}
              >
                프로필 수정
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      <ImageViewerDialog
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={previewUrl}
        alt="프로필 사진"
      />

      <Dialog
        open={withdrawOpen}
        onClose={handleWithdrawClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, p: 0 },
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
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: ACCENT,
                  borderWidth: 2,
                },
              },
              "& .MuiInputLabel-root.Mui-focused": { color: ACCENT },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
          <Button
            onClick={handleWithdrawClose}
            sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
          >
            취소
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleWithdrawSubmit}
            disabled={withdrawing}
            sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
          >
            {withdrawing ? "처리 중..." : "탈퇴"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.95rem", fontWeight: 500, color: "#1a1a1a" }}>
        {value || "-"}
      </Typography>
    </Box>
  );
}
