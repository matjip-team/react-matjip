import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Typography,
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";

type RestaurantApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type RestaurantAdminDetail = {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  categoryNames?: string[] | null;
  hasBusinessLicenseFile: boolean;
  approvalStatus: RestaurantApprovalStatus;
  createdAt?: string | null;
  reviewedAt?: string | null;
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

const formatCoordinate = (value?: number | null) => {
  if (value === null || value === undefined) {
    return "-";
  }
  return String(value);
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
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [detail, setDetail] = useState<RestaurantAdminDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [openingLicense, setOpeningLicense] = useState(false);
  const [toast, setToast] = useState("");

  const requestId = useMemo(() => Number(id), [id]);
  const hasValidRequestId = Number.isInteger(requestId) && requestId > 0;

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
      setDetail(res.data?.data ?? null);
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

    try {
      setProcessing(true);
      await axios.patch(`/api/admin/restaurants/${detail.id}/approval`, { status });
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

    try {
      setOpeningLicense(true);
      const res = await axios.get(`/api/admin/restaurants/${detail.id}/license-view-url`);
      const viewUrl = res.data?.data;
      if (!viewUrl) {
        setToast("서류 보기 URL 발급에 실패했습니다.");
        return;
      }
      window.open(viewUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setToast("서류 보기 URL 발급에 실패했습니다.");
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
                <InfoRow label="사업자등록증" value={detail.hasBusinessLicenseFile ? "첨부됨" : "없음"} />
                <Box sx={{ pl: { xs: 0, sm: 13.8 }, mt: 0.8 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DescriptionOutlinedIcon />}
                    onClick={() => void handleOpenLicense()}
                    disabled={!detail.hasBusinessLicenseFile || openingLicense}
                  >
                    {openingLicense ? "여는 중..." : "사업자등록증 열기"}
                  </Button>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography sx={{ fontWeight: 700, mb: 1 }}>신청 정보</Typography>
            <Stack spacing={0.9}>
              <InfoRow label="주소" value={detail.address || "-"} />
              <InfoRow label="전화번호" value={detail.phone || "-"} />
              <InfoRow label="카테고리" value={detail.categoryNames?.length ? detail.categoryNames.join(", ") : "-"} />
              <InfoRow label="위치 좌표" value={`${formatCoordinate(detail.latitude)} / ${formatCoordinate(detail.longitude)}`} />
              <Box sx={{ pl: { xs: 0, sm: 13.8 } }}>
                <Button size="small" variant="outlined" endIcon={<OpenInNewIcon />} onClick={openMap}>
                  지도에서 크게 보기
                </Button>
              </Box>
              <InfoRow label="설명" value={detail.description?.trim() ? detail.description.trim() : "-"} />
            </Stack>

            <Box
              ref={mapContainerRef}
              sx={{
                mt: 2,
                width: "100%",
                height: 250,
                borderRadius: 1,
                border: "1px solid #e8e8e8",
                overflow: "hidden",
                backgroundColor: "#fafafa",
              }}
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => navigate("/admin/restaurant-requests")}>닫기</Button>
              {detail.approvalStatus === "PENDING" && (
                <>
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
                </>
              )}
            </Stack>
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
