import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";
import { uploadBusinessLicenseFile } from "./api/registerFileUpload";

type FormState = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  description: string;
  categories: string;
  businessLicenseFileKey: string;
};

type PlaceItem = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

const initialForm: FormState = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  phone: "",
  description: "",
  categories: "",
  businessLicenseFileKey: "",
};

const ACCEPTED_LICENSE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const MAX_LICENSE_FILE_SIZE = 10 * 1024 * 1024;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const ACCENT = "#ff8a3d";

  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [licenseFileName, setLicenseFileName] = useState("");
  const [toast, setToast] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceItem[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markerRef = useRef<kakao.maps.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const categoryNames = useMemo(
    () =>
      form.categories
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    [form.categories],
  );

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;

    kakao.maps.load(() => {
      const container = mapContainerRef.current;
      if (!container) return;

      const map = new kakao.maps.Map(container, {
        center: new kakao.maps.LatLng(37.5665, 126.978),
        level: 5,
      });
      mapRef.current = map;
    });
  }, []);

  const handleChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const moveMapToPlace = (place: PlaceItem) => {
    const map = mapRef.current;
    if (!map) return;

    const position = new kakao.maps.LatLng(place.lat, place.lng);
    map.setCenter(position);

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new kakao.maps.Marker({
      map,
      position,
    });
  };

  const selectPlace = (place: PlaceItem) => {
    setSelectedPlaceId(place.id);
    setForm((prev) => ({
      ...prev,
      address: place.address,
      latitude: String(place.lat),
      longitude: String(place.lng),
    }));
    moveMapToPlace(place);
  };

  const handleSearchPlace = () => {
    const keyword = searchKeyword.trim();
    if (!keyword) {
      setToast("주소 또는 상호를 입력해 주세요.");
      return;
    }

    if (!window.kakao?.maps?.services) {
      setToast("지도 서비스를 불러오지 못했습니다.");
      return;
    }

    const places = new kakao.maps.services.Places();
    places.keywordSearch(keyword, (data, status) => {
      if (status !== "OK") {
        setSearchResults([]);
        setToast("검색 결과가 없습니다.");
        return;
      }

      const mapped: PlaceItem[] = data.map((p) => ({
        id: p.id,
        name: p.place_name,
        address: p.road_address_name || p.address_name,
        lat: Number(p.y),
        lng: Number(p.x),
      }));

      setSearchResults(mapped);
      if (mapped[0]) {
        selectPlace(mapped[0]);
      }
    });
  };

  const handleLicenseButtonClick = () => {
    if (!user) {
      setToast("로그인이 필요합니다.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleLicenseFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ACCEPTED_LICENSE_TYPES.includes(file.type)) {
      setToast("PDF 또는 이미지 파일만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_LICENSE_FILE_SIZE) {
      setToast("파일 크기는 10MB 이하만 가능합니다.");
      e.target.value = "";
      return;
    }

    try {
      setLicenseUploading(true);
      const fileKey = await uploadBusinessLicenseFile(file);

      setForm((prev) => ({
        ...prev,
        businessLicenseFileKey: fileKey,
      }));
      setLicenseFileName(file.name);
      setToast("사업자등록증 파일 업로드가 완료되었습니다.");
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("사업자등록증 파일 업로드에 실패했습니다.");
      }
    } finally {
      setLicenseUploading(false);
      e.target.value = "";
    }
  };

  const validate = () => {
    if (!form.name.trim()) return "가게명을 입력해 주세요.";
    if (!form.address.trim()) return "주소를 선택해 주세요.";
    if (!form.latitude || !form.longitude) return "주소 검색 후 위치를 선택해 주세요.";
    if (!form.businessLicenseFileKey.trim()) return "사업자등록증 파일을 업로드해 주세요.";

    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return "위도/경도 값이 올바르지 않습니다.";
    }
    if (lat < -90 || lat > 90) return "위도는 -90 ~ 90 범위여야 합니다.";
    if (lng < -180 || lng > 180) return "경도는 -180 ~ 180 범위여야 합니다.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setToast("로그인이 필요합니다.");
      return;
    }

    if (licenseUploading) {
      setToast("파일 업로드가 끝난 뒤 등록해 주세요.");
      return;
    }

    const error = validate();
    if (error) {
      setToast(error);
      return;
    }

    try {
      setSubmitting(true);
      await axios.post("/api/restaurants", {
        name: form.name.trim(),
        address: form.address.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        phone: form.phone.trim() || null,
        description: form.description.trim() || null,
        businessLicenseFileKey: form.businessLicenseFileKey,
        categoryNames,
      });

      setToast("등록 요청이 접수되었습니다. 관리자 승인 후 노출됩니다.");
      setForm(initialForm);
      setSearchKeyword("");
      setSearchResults([]);
      setSelectedPlaceId(null);
      setLicenseFileName("");
      navigate("/register/requests");
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else if (status === 404 || status === 405) {
        setToast("서버에 맛집 등록 API가 연결되지 않았습니다.");
      } else {
        setToast("맛집 등록에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ maxWidth: 760, mx: "auto", mt: 5 }}>
        <Alert severity="warning" sx={{ mb: 2, border: `1px solid ${ACCENT}` }}>
          맛집 등록은 로그인 후 이용할 수 있습니다.
        </Alert>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={() => navigate("/auth/login")}
            sx={{ bgcolor: ACCENT, "&:hover": { bgcolor: "#f07a2d" } }}
          >
            로그인 하러가기
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/")}
            sx={{ borderColor: ACCENT, color: ACCENT }}
          >
            홈
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", mt: 5 }}>
      <Card sx={{ border: "1px solid rgba(255, 138, 61, 0.28)" }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: ACCENT }}>
                맛집 등록
              </Typography>
              <Typography sx={{ color: "#666", mt: 0.5 }}>
                주소를 검색해 위치를 선택하고 사업자등록증을 첨부해 주세요.
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate("/register/requests")}
              sx={{ borderColor: ACCENT, color: ACCENT }}
            >
              내 신청내역
            </Button>
          </Stack>

          <Divider sx={{ my: 2, borderColor: "rgba(255, 138, 61, 0.35)" }} />

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="가게명"
                value={form.name}
                onChange={handleChange("name")}
                required
                fullWidth
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  label="주소/상호 검색"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  fullWidth
                  placeholder="예: 강남 갈비"
                />
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleSearchPlace}
                  sx={{ borderColor: ACCENT, color: ACCENT, minWidth: 110 }}
                >
                  검색
                </Button>
              </Stack>

              <Box
                ref={mapContainerRef}
                sx={{
                  width: "100%",
                  height: 260,
                  borderRadius: 1,
                  border: "1px solid #e0e0e0",
                  overflow: "hidden",
                }}
              />

              {searchResults.length > 0 && (
                <Box sx={{ maxHeight: 170, overflowY: "auto", border: "1px solid #eee", borderRadius: 1 }}>
                  {searchResults.map((place) => (
                    <Box
                      key={place.id}
                      onClick={() => selectPlace(place)}
                      sx={{
                        px: 1.2,
                        py: 0.9,
                        cursor: "pointer",
                        borderBottom: "1px solid #f5f5f5",
                        backgroundColor: selectedPlaceId === place.id ? "rgba(255, 138, 61, 0.12)" : "#fff",
                        "&:hover": { backgroundColor: "rgba(255, 138, 61, 0.08)" },
                      }}
                    >
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{place.name}</Typography>
                      <Typography sx={{ fontSize: 12, color: "#666" }}>{place.address}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <TextField label="주소" value={form.address} fullWidth InputProps={{ readOnly: true }} />

              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  사업자등록증 첨부 (임시 보관)
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleLicenseButtonClick}
                    disabled={licenseUploading}
                    sx={{ borderColor: ACCENT, color: ACCENT, minWidth: 160 }}
                  >
                    {licenseUploading ? "업로드 중..." : "파일 선택/업로드"}
                  </Button>
                  <Typography sx={{ fontSize: 13, color: "#666" }}>
                    {licenseFileName || "선택된 파일 없음"}
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 12, color: "#999" }}>
                  허용: PDF, PNG, JPG, WEBP (최대 10MB, 14일 후 자동 삭제)
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                  style={{ display: "none" }}
                  onChange={handleLicenseFileChange}
                />
              </Stack>

              <TextField
                label="전화번호"
                value={form.phone}
                onChange={handleChange("phone")}
                fullWidth
                placeholder="예: 02-123-4567"
              />

              <TextField
                label="카테고리"
                value={form.categories}
                onChange={handleChange("categories")}
                fullWidth
                placeholder="예: 한식, 고깃집, 해장국"
                helperText="쉼표(,)로 구분해 입력하세요"
              />

              <TextField
                label="설명"
                value={form.description}
                onChange={handleChange("description")}
                fullWidth
                multiline
                minRows={3}
              />

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate("/")}
                  sx={{ borderColor: ACCENT, color: ACCENT }}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting || licenseUploading}
                  sx={{ bgcolor: ACCENT, "&:hover": { bgcolor: "#f07a2d" } }}
                >
                  {submitting ? "등록 중..." : "등록"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>

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
