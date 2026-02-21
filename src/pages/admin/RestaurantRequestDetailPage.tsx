import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.bubble.css";
import "quill-table-better/dist/quill-table-better.css";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";
import { registerBlogQuillModules } from "../blog/quillSetup";

registerBlogQuillModules(Quill);

type RestaurantApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type RestaurantAdminDetail = {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  representativeImageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  categoryNames?: string[] | null;
  hasBusinessLicenseFile: boolean;
  approvalStatus: RestaurantApprovalStatus;
  createdAt?: string | null;
  reviewedAt?: string | null;
  rejectedReason?: string | null;
  registeredById?: number | null;
  registeredByNickname?: string | null;
};

const STATUS_META: Record<RestaurantApprovalStatus, { label: string; color: "warning" | "success" | "error" | "default" }> = {
  PENDING: { label: "승인 대기", color: "warning" },
  APPROVED: { label: "승인 완료", color: "success" },
  REJECTED: { label: "반려", color: "error" },
  CANCELLED: { label: "철회", color: "default" },
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("ko-KR");
};

const S3_PUBLIC_BASE_URL =
  (import.meta.env.VITE_S3_PUBLIC_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "https://matjip-board-images-giduon-2026.s3.ap-northeast-2.amazonaws.com";

const toDisplayImageUrl = (value?: string | null): string | null => {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) return raw;
  return `${S3_PUBLIC_BASE_URL}/${raw.replace(/^\/+/, "")}`;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={0.7}>
      <Typography sx={{ width: { xs: "100%", sm: 110 }, color: "#666", fontSize: 14 }}>
        {label}
      </Typography>
      <Typography sx={{ flex: 1, color: "#222", fontSize: 14, whiteSpace: "pre-wrap" }}>{value}</Typography>
    </Stack>
  );
}

export default function RestaurantRequestDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [detail, setDetail] = useState<RestaurantAdminDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [openingLicense, setOpeningLicense] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState("");

  const requestId = useMemo(() => Number(id), [id]);
  const hasValidRequestId = Number.isInteger(requestId) && requestId > 0;
  const imageUrlFromState = (location.state as { imageUrl?: string | null } | null)?.imageUrl ?? null;
  const displayImageUrl = toDisplayImageUrl(
    detail?.imageUrl ?? detail?.representativeImageUrl ?? imageUrlFromState ?? null,
  );

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markerRef = useRef<kakao.maps.Marker | null>(null);

  const isAdmin = useMemo(() => {
    const role = user?.role ?? "";
    return role === "ROLE_ADMIN" || role === "ADMIN";
  }, [user]);

  const fetchDetail = useCallback(async () => {
    if (!hasValidRequestId || !isAdmin) {
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/restaurants/${requestId}`);
      const nextDetail = (res.data?.data ?? null) as RestaurantAdminDetail | null;
      setDetail(nextDetail);
      setRejectReason(nextDetail?.rejectedReason ?? "");
    } catch (error) {
      console.error(error);
      setToast("신청 상세 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [hasValidRequestId, isAdmin, requestId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (!detail || !window.kakao?.maps || !mapContainerRef.current) {
      return;
    }

    kakao.maps.load(() => {
      const container = mapContainerRef.current;
      if (!container) {
        return;
      }

      const fallbackPosition = new kakao.maps.LatLng(37.5665, 126.978);
      const map =
        mapRef.current ??
        new kakao.maps.Map(container, {
          center: fallbackPosition,
          level: 4,
        });

      mapRef.current = map;

      if (detail.latitude !== null && detail.latitude !== undefined && detail.longitude !== null && detail.longitude !== undefined) {
        const position = new kakao.maps.LatLng(Number(detail.latitude), Number(detail.longitude));
        map.setCenter(position);

        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        markerRef.current = new kakao.maps.Marker({ map, position });
      }
    });
  }, [detail]);

  const handleDecision = async (status: "APPROVED" | "REJECTED") => {
    if (!detail) {
      return;
    }
    const trimmedReason = rejectReason.trim();
    if (status === "REJECTED" && !trimmedReason) {
      setToast("반려 사유를 입력해 주세요.");
      return;
    }

    try {
      setProcessing(true);
      await axios.patch(`/api/admin/restaurants/${detail.id}/approval`, {
        status,
        rejectedReason: status === "REJECTED" ? trimmedReason : null,
      });
      setToast(status === "APPROVED" ? "승인 처리되었습니다." : "반려 처리되었습니다.");
      await fetchDetail();
    } catch (error) {
      console.error(error);
      setToast("처리에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenLicense = async () => {
    if (!detail) {
      return;
    }

    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      setToast("브라우저 팝업 차단을 해제한 뒤 다시 시도해 주세요.");
      return;
    }

    try {
      setOpeningLicense(true);
      const res = await axios.get(`/api/admin/restaurants/${detail.id}/license-view-url`);
      const urlFromData = res.data?.data;
      const urlFromMessage = res.data?.message;
      const viewUrl = urlFromData
        ?? (typeof urlFromMessage === "string" && /^https?:\/\//i.test(urlFromMessage)
          ? urlFromMessage
          : null);
      if (!viewUrl) {
        popup.close();
        setToast("첨부파일 주소를 불러오지 못했습니다.");
        return;
      }
      try {
        popup.location.replace(viewUrl);
        popup.focus();
      } catch {
        window.open(viewUrl, "_blank");
      }
    } catch (error) {
      popup.close();
      console.error(error);
      setToast("첨부파일 열기에 실패했습니다.");
    } finally {
      setOpeningLicense(false);
    }
  };

  const openMap = () => {
    if (!detail) {
      return;
    }

    if (detail.address?.trim()) {
      window.open(`https://map.kakao.com/?q=${encodeURIComponent(detail.address)}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (detail.latitude !== undefined && detail.latitude !== null && detail.longitude !== undefined && detail.longitude !== null) {
      window.open(`https://map.kakao.com/link/map/${detail.latitude},${detail.longitude}`, "_blank", "noopener,noreferrer");
      return;
    }

    setToast("위치 정보가 없습니다.");
  };

  if (!user) {
    return (
      <Box sx={{ maxWidth: 980, mx: "auto", mt: 5 }}>
        <Alert severity="warning">로그인이 필요합니다.</Alert>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ maxWidth: 980, mx: "auto", mt: 5 }}>
        <Alert severity="error">관리자만 접근 가능합니다.</Alert>
      </Box>
    );
  }

  if (!hasValidRequestId) {
    return (
      <Box sx={{ maxWidth: 980, mx: "auto", mt: 5 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          잘못된 접근입니다.
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/admin/restaurant-requests")}>목록으로</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", mt: 5 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>신청 상세</Typography>
        <Button variant="outlined" onClick={() => navigate("/admin/restaurant-requests")}>목록으로</Button>
      </Stack>

      {loading && <Typography sx={{ color: "#666", mb: 2 }}>상세 정보를 불러오는 중...</Typography>}
      {!loading && !detail && <Alert severity="info">표시할 신청 정보가 없습니다.</Alert>}

      {detail && (
        <Card sx={{ border: "1px solid #eee" }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography sx={{ fontSize: 24, fontWeight: 800 }}>{detail.name}</Typography>
                <Typography sx={{ fontSize: 13, color: "#888", mt: 0.5 }}>신청 번호: #{detail.id}</Typography>
              </Box>
              <Chip
                size="small"
                label={STATUS_META[detail.approvalStatus].label}
                color={STATUS_META[detail.approvalStatus].color}
                sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>신청 요약</Typography>
                <Stack spacing={0.8}>
                  <InfoRow label="신청자" value={detail.registeredByNickname || "-"} />
                  <InfoRow label="신청일" value={formatDateTime(detail.createdAt)} />
                  <InfoRow
                    label="처리일"
                    value={detail.approvalStatus === "PENDING" ? "-" : formatDateTime(detail.reviewedAt)}
                  />
                </Stack>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>첨부 서류</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={0.7} alignItems={{ xs: "flex-start", sm: "center" }}>
                  <Typography sx={{ width: { xs: "100%", sm: 110 }, color: "#666", fontSize: 14 }}>
                    사업자등록증
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                    <Typography sx={{ color: "#222", fontSize: 14 }}>
                      {detail.hasBusinessLicenseFile ? "첨부됨" : "없음"}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DescriptionOutlinedIcon />}
                      onClick={() => void handleOpenLicense()}
                      disabled={!detail.hasBusinessLicenseFile || openingLicense}
                    >
                      {openingLicense ? "여는 중..." : "첨부파일 열기"}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography sx={{ fontWeight: 700, mb: 1 }}>신청 정보</Typography>
            {(() => {
              const raw = detail.description?.trim() ?? "";
              const hasHtml = /<[^>]+>/.test(raw);
              const escaped = raw
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
              const descriptionHtml = raw
                ? hasHtml
                  ? raw
                  : `<p>${escaped.replace(/\n/g, "<br/>")}</p>`
                : "<p>-</p>";
              return (
            <Stack spacing={0.9}>
              <InfoRow label="주소" value={detail.address || "-"} />
              <Box
                ref={mapContainerRef}
                sx={{
                  mt: 0.5,
                  width: "100%",
                  height: 250,
                  borderRadius: 1,
                  border: "1px solid #e8e8e8",
                  overflow: "hidden",
                  backgroundColor: "#fafafa",
                }}
              />
              <Box sx={{ pl: { xs: 0, sm: 13.8 } }}>
                <Button size="small" variant="outlined" endIcon={<OpenInNewIcon />} onClick={openMap}>
                  지도에서 크게 보기
                </Button>
              </Box>
              <InfoRow label="전화번호" value={detail.phone || "-"} />
              <InfoRow label="카테고리" value={detail.categoryNames?.length ? detail.categoryNames.join(", ") : "-"} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.7}>
                <Typography sx={{ width: { xs: "100%", sm: 110 }, color: "#666", fontSize: 14 }}>
                  대표사진
                </Typography>
                <Box sx={{ flex: 1 }}>
                  {displayImageUrl ? (
                    <Box
                      component="img"
                      src={displayImageUrl}
                      alt="대표사진"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const img = e.currentTarget;
                        if (img.src.includes("/images/world.jpg")) return;
                        img.src = "/images/world.jpg";
                      }}
                      sx={{
                        width: 240,
                        maxWidth: "100%",
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 1,
                        border: "1px solid #e8e8e8",
                      }}
                    />
                  ) : (
                    <Typography sx={{ color: "#222", fontSize: 14 }}>없음</Typography>
                  )}
                </Box>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.7}>
                <Typography sx={{ width: { xs: "100%", sm: 110 }, color: "#666", fontSize: 14 }}>
                  설명
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    "& .ql-editor": { padding: 0 },
                    "& .ql-editor img": { maxWidth: "100%", height: "auto" },
                    "& .ql-editor iframe, & .ql-editor video": { maxWidth: "100%" },
                    "& .ql-editor table": {
                      width: "100%",
                      borderCollapse: "collapse",
                      margin: "12px 0",
                    },
                    "& .ql-editor td, & .ql-editor th": {
                      border: "1px solid #d9d9d9",
                      padding: "8px 10px",
                      verticalAlign: "top",
                    },
                  }}
                >
                  <ReactQuill theme="bubble" readOnly modules={{ toolbar: false }} value={descriptionHtml} />
                </Box>
              </Stack>
            </Stack>
              );
            })()}

            {detail.approvalStatus === "PENDING" && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label="반려 사유"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="반려 사유를 입력해 주세요."
                />

                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={processing}
                    onClick={() => void handleDecision("APPROVED")}
                  >
                    승인
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    disabled={processing}
                    onClick={() => void handleDecision("REJECTED")}
                  >
                    반려
                  </Button>
                </Stack>
              </Box>
            )}
            {detail.approvalStatus === "REJECTED" && (
              <Alert severity="error" sx={{ mt: 2 }}>
                반려 사유: {detail.rejectedReason?.trim() ? detail.rejectedReason : "-"}
              </Alert>
            )}
            {detail.approvalStatus === "APPROVED" && (
              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/?keyword=${encodeURIComponent(detail.name)}`)}
                >
                  홈에서 카드 확인
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={1800}
        message={toast}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
