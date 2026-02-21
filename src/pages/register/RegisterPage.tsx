import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ReactQuill, { Quill } from "react-quill-new";
import QuillTableBetter from "quill-table-better";
import "react-quill-new/dist/quill.snow.css";
import "quill-table-better/dist/quill-table-better.css";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";
import {
  getBusinessLicenseFileViewUrl,
  uploadBusinessLicenseFile,
  uploadRestaurantRepresentativeImage,
} from "./api/registerFileUpload";
import { registerBlogQuillModules } from "../blog/quillSetup";
import {
  getMyRestaurantRequestDetail,
  getMyRestaurantRequestLicenseViewUrl,
  updateMyRestaurantRequest,
} from "./api/restaurantRequestApi";
import { ThemeProvider } from "@mui/material/styles";
import { boardTheme } from "../board/theme/boardTheme";

registerBlogQuillModules(Quill);

const ACCENT = "#ff6b00";

type FormState = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  description: string;
  categories: string[];
  businessLicenseFileKey: string;
  imageUrl: string;
};

type PlaceItem = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

interface HttpErrorLike {
  response?: {
    status?: number;
  };
}

const initialForm: FormState = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  phone: "",
  description: "",
  categories: [],
  businessLicenseFileKey: "",
  imageUrl: "",
};

const CATEGORY_OPTIONS = [
  "한식",
  "양식",
  "고기/구이",
  "씨푸드",
  "일중/세계음식",
  "비건",
  "카페/디저트",
];

const ACCEPTED_LICENSE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const MAX_LICENSE_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_REPRESENTATIVE_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const MAX_REPRESENTATIVE_IMAGE_SIZE = 10 * 1024 * 1024;
const S3_PUBLIC_BASE_URL =
  (import.meta.env.VITE_S3_PUBLIC_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "https://matjip-board-images-giduon-2026.s3.ap-northeast-2.amazonaws.com";

const getHttpStatus = (error: unknown): number | undefined =>
  (error as HttpErrorLike)?.response?.status;

const toDisplayImageUrl = (value?: string | null): string => {
  const raw = value?.trim();
  if (!raw) return "";
  if (
    raw.startsWith("blob:") ||
    raw.startsWith("/") ||
    /^https?:\/\//i.test(raw)
  ) {
    return raw;
  }
  return `${S3_PUBLIC_BASE_URL}/${raw.replace(/^\/+/, "")}`;
};

interface Props {
  /** 마이페이지 탭 내부에 렌더될 때 true (상단 여백 제거) */
  embedded?: boolean;
}

export default function RegisterPage({ embedded = false }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryEditRequestId = Number(
    new URLSearchParams(location.search).get("editRequestId"),
  );
  const editRequestId =
    Number.isInteger(queryEditRequestId) && queryEditRequestId > 0
      ? queryEditRequestId
      : (location.state as { mode?: string; requestId?: number } | null)?.mode === "edit"
        ? Number((location.state as { requestId?: number } | null)?.requestId)
        : null;
  const isEditMode = Number.isInteger(editRequestId) && Number(editRequestId) > 0;

  const [form, setForm] = useState<FormState>(initialForm);
  const [editLoading, setEditLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [licenseOpening, setLicenseOpening] = useState(false);
  const [hasExistingLicenseFile, setHasExistingLicenseFile] = useState(false);
  const [licenseFileName, setLicenseFileName] = useState("");
  const [representativeUploading, setRepresentativeUploading] = useState(false);
  const [representativeImageName, setRepresentativeImageName] = useState("");
  const [representativePreviewUrl, setRepresentativePreviewUrl] = useState("");
  const [toast, setToast] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceItem[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markerRef = useRef<kakao.maps.Marker | null>(null);
  const licenseFileInputRef = useRef<HTMLInputElement | null>(null);
  const representativeImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (representativePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(representativePreviewUrl);
      }
    };
  }, [representativePreviewUrl]);

  const descriptionQuillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: 1 }, { header: 2 }],
        ["bold", "italic", "underline", "strike"],
        ["link", "image", "video", "code-block", "formula"],
        [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["table-better"],
        ["clean"],
      ],
      table: false,
      "table-better": {
        language: "en_US",
        menus: ["column", "row", "merge", "table", "cell", "wrap", "copy", "delete"],
        toolbarTable: true,
      },
      keyboard: {
        bindings: QuillTableBetter.keyboardBindings,
      },
      imageResize: {
        parchment: Quill.import("parchment"),
        modules: ["Resize", "DisplaySize", "Toolbar"],
      },
    }),
    [],
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

  useEffect(() => {
    if (!isEditMode || !user || !editRequestId) {
      return;
    }

    const fetchEditData = async () => {
      try {
        setEditLoading(true);
        const data = await getMyRestaurantRequestDetail(editRequestId);
        const normalizedImageUrl = toDisplayImageUrl(data.imageUrl ?? data.representativeImageUrl ?? "");
        setForm({
          name: data.name ?? "",
          address: data.address ?? "",
          latitude:
            data.latitude !== null && data.latitude !== undefined ? String(data.latitude) : "",
          longitude:
            data.longitude !== null && data.longitude !== undefined ? String(data.longitude) : "",
          phone: data.phone ?? "",
          description: data.description ?? "",
          categories: data.categoryNames ?? [],
          businessLicenseFileKey: data.businessLicenseFileKey ?? "",
          imageUrl: normalizedImageUrl,
        });
        setHasExistingLicenseFile(Boolean(data.hasBusinessLicenseFile));
        setLicenseFileName(data.hasBusinessLicenseFile ? "기존 첨부 파일" : "");
        setRepresentativeImageName(normalizedImageUrl ? "기존 대표사진" : "");
        setRepresentativePreviewUrl(normalizedImageUrl);
      } catch {
        setToast("수정할 신청 정보를 불러오지 못했습니다.");
      } finally {
        setEditLoading(false);
      }
    };

    void fetchEditData();
  }, [editRequestId, isEditMode, user]);

  useEffect(() => {
    if (!form.latitude || !form.longitude || !window.kakao?.maps || !mapRef.current) {
      return;
    }
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }
    const map = mapRef.current;
    const position = new kakao.maps.LatLng(lat, lng);
    map.setCenter(position);
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    markerRef.current = new kakao.maps.Marker({ map, position });
  }, [form.latitude, form.longitude]);

  useEffect(() => {
    if (!isEditMode || !editRequestId) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [editRequestId, isEditMode]);

  const handleChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneWithHyphen = e.target.value.replace(/[^0-9-]/g, "").slice(0, 13);
    setForm((prev) => ({ ...prev, phone: phoneWithHyphen }));
  };

  const toggleCategory = (category: string) => {
    setForm((prev) => {
      const exists = prev.categories.includes(category);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((value) => value !== category)
          : [...prev.categories, category],
      };
    });
  };

  const moveMapToPlace = (place: PlaceItem) => {
    const map = mapRef.current;
    if (!map) return;

    const position = new kakao.maps.LatLng(place.lat, place.lng);
    map.setCenter(position);

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new kakao.maps.Marker({ map, position });
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
    licenseFileInputRef.current?.click();
  };

  const handleRepresentativeImageButtonClick = () => {
    if (!user) {
      setToast("로그인이 필요합니다.");
      return;
    }
    representativeImageInputRef.current?.click();
  };

  const handleLicenseFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setForm((prev) => ({ ...prev, businessLicenseFileKey: fileKey }));
      setHasExistingLicenseFile(true);
      setLicenseFileName(file.name);
      setToast("사업자등록증 파일 업로드가 완료되었습니다.");
    } catch (error: unknown) {
      const status = getHttpStatus(error);
      setToast(status === 401 || status === 403 ? "로그인이 필요합니다." : "사업자등록증 파일 업로드에 실패했습니다.");
    } finally {
      setLicenseUploading(false);
      e.target.value = "";
    }
  };

  const handleRepresentativeImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_REPRESENTATIVE_IMAGE_TYPES.includes(file.type)) {
      setToast("PNG, JPG, WEBP 이미지 파일만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_REPRESENTATIVE_IMAGE_SIZE) {
      setToast("대표사진은 10MB 이하만 가능합니다.");
      e.target.value = "";
      return;
    }

    if (representativePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(representativePreviewUrl);
    }
    setRepresentativePreviewUrl(URL.createObjectURL(file));
    setRepresentativeImageName(file.name);

    try {
      setRepresentativeUploading(true);
      const imageUrl = await uploadRestaurantRepresentativeImage(file);
      const normalizedImageUrl = toDisplayImageUrl(imageUrl);
      setForm((prev) => ({ ...prev, imageUrl: normalizedImageUrl }));
      setToast("대표사진 업로드가 완료되었습니다.");
    } catch (error: unknown) {
      const status = getHttpStatus(error);
      setToast(status === 401 || status === 403 ? "로그인이 필요합니다." : "대표사진 업로드에 실패했습니다.");
    } finally {
      setRepresentativeUploading(false);
      e.target.value = "";
    }
  };

  const validate = () => {
    if (!form.name.trim()) return "가게명을 입력해 주세요.";
    if (!form.address.trim()) return "주소를 선택해 주세요.";
    if (!form.latitude || !form.longitude) return "주소 검색 후 위치를 선택해 주세요.";
    if (form.categories.length === 0) return "카테고리를 1개 이상 선택해 주세요.";
    if (!form.imageUrl.trim()) return "대표사진을 업로드해 주세요.";
    if (!isEditMode && !form.businessLicenseFileKey.trim()) return "사업자등록증 파일을 업로드해 주세요.";

    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return "위도/경도 값이 올바르지 않습니다.";
    if (lat < -90 || lat > 90) return "위도는 -90 ~ 90 범위여야 합니다.";
    if (lng < -180 || lng > 180) return "경도는 -180 ~ 180 범위여야 합니다.";

    return null;
  };

  const handleOpenLicenseFile = async () => {
    const fileKey = form.businessLicenseFileKey.trim();
    if (!fileKey && (!isEditMode || !editRequestId || !hasExistingLicenseFile)) {
      setToast("확인할 첨부파일이 없습니다.");
      return;
    }

    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      setToast("브라우저 팝업 차단을 해제한 뒤 다시 시도해 주세요.");
      return;
    }

    try {
      setLicenseOpening(true);
      const viewUrl = fileKey
        ? await getBusinessLicenseFileViewUrl(fileKey)
        : await getMyRestaurantRequestLicenseViewUrl(editRequestId!);
      if (!viewUrl) {
        popup.close();
        setToast("첨부파일 주소를 불러오지 못했습니다.");
        return;
      }
      popup.location.replace(viewUrl);
      popup.focus();
    } catch {
      popup.close();
      setToast("첨부파일 열기에 실패했습니다.");
    } finally {
      setLicenseOpening(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setToast("로그인이 필요합니다.");
      return;
    }

    if (licenseUploading || representativeUploading) {
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
      if (isEditMode && editRequestId) {
        await updateMyRestaurantRequest(editRequestId, {
          name: form.name.trim(),
          address: form.address.trim(),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          phone: form.phone.trim() || null,
          description: form.description.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          businessLicenseFileKey: form.businessLicenseFileKey.trim() || null,
          categoryNames: form.categories,
        });
        setToast("신청 내용이 수정되었습니다.");
        navigate(`/register/requests/${editRequestId}`, {
          state: { imageUrl: form.imageUrl.trim() || null },
        });
      } else {
        await axios.post("/api/restaurants", {
          name: form.name.trim(),
          address: form.address.trim(),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          phone: form.phone.trim() || null,
          description: form.description.trim() || null,
          businessLicenseFileKey: form.businessLicenseFileKey,
          imageUrl: form.imageUrl.trim() || null,
          categoryNames: form.categories,
        });

        setToast("등록 요청이 접수되었습니다. 관리자 확인 후 노출됩니다.");
        setForm(initialForm);
        setSearchKeyword("");
        setSearchResults([]);
        setSelectedPlaceId(null);
        setLicenseFileName("");
        setRepresentativeImageName("");
        if (representativePreviewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(representativePreviewUrl);
        }
        setRepresentativePreviewUrl("");
        navigate("/register/requests");
      }
    } catch (error: unknown) {
      const status = getHttpStatus(error);
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
      <ThemeProvider theme={boardTheme}>
        <Box
          sx={{
            maxWidth: embedded ? "100%" : 1100,
            mx: embedded ? 0 : "auto",
            px: embedded ? 0 : { xs: 2, sm: 3 },
            ...(embedded ? { py: 0 } : { py: 5 }),
          }}
        >
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, border: "1px solid rgba(245,158,11,0.3)" }}>
            맛집 등록은 로그인 후 이용할 수 있습니다.
          </Alert>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              onClick={() => navigate("/auth/login")}
              sx={{
                bgcolor: ACCENT,
                "&:hover": { bgcolor: "#e55f00" },
                fontWeight: 600,
                borderRadius: 1.5,
              }}
            >
              로그인 하러가기
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              sx={{
                borderColor: "rgba(0,0,0,0.2)",
                color: "#64748b",
                fontWeight: 600,
                borderRadius: 1.5,
                "&:hover": {
                  borderColor: ACCENT,
                  color: ACCENT,
                  bgcolor: "rgba(255,107,0,0.04)",
                },
              }}
            >
              홈
            </Button>
          </Stack>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={boardTheme}>
      <Box
        sx={{
          maxWidth: embedded ? "100%" : 1100,
          mx: embedded ? 0 : "auto",
          px: embedded ? 0 : { xs: 2, sm: 3 },
          ...(embedded ? { py: 0 } : { py: 5 }),
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
            {isEditMode ? "맛집 신청 수정" : "맛집 등록"}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#64748b" }}>
            {isEditMode
              ? "기존 신청 정보를 수정합니다."
              : "주소를 검색해 위치를 선택하고 사업자등록증을 첨부해 주세요."}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            position: "relative",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            bgcolor: "#fff",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/register/requests")}
              sx={{
                borderColor: "rgba(0,0,0,0.2)",
                color: "#64748b",
                fontWeight: 600,
                borderRadius: 1.5,
                "&:hover": {
                  borderColor: ACCENT,
                  color: ACCENT,
                  bgcolor: "rgba(255,107,0,0.04)",
                },
              }}
            >
              내 신청내역
            </Button>
          </Box>

          <Divider sx={{ my: 2, borderColor: "rgba(0,0,0,0.06)" }} />

          <Box component="form" onSubmit={handleSubmit}>
            {isEditMode && editLoading && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2, border: "1px solid rgba(33,150,243,0.3)" }}>
                수정할 신청 정보를 불러오는 중입니다...
              </Alert>
            )}
            <Stack spacing={2}>
              <TextField
                label="가게명"
                value={form.name}
                onChange={handleChange("name")}
                required
                fullWidth
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

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  label="주소/상호 검색"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchPlace();
                    }
                  }}
                  fullWidth
                  placeholder="예) 강남 갈비"
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
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleSearchPlace}
                  sx={{
                    borderColor: ACCENT,
                    color: ACCENT,
                    minWidth: 110,
                    fontWeight: 600,
                    borderRadius: 1.5,
                    "&:hover": {
                      borderColor: "#e55f00",
                      bgcolor: "rgba(255,107,0,0.04)",
                    },
                  }}
                >
                  검색
                </Button>
              </Stack>

              <Box
                ref={mapContainerRef}
                sx={{
                  width: "100%",
                  height: 260,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.08)",
                  overflow: "hidden",
                  bgcolor: "#f8fafc",
                }}
              />

              {searchResults.length > 0 && (
                <Box
                  sx={{
                    maxHeight: 170,
                    overflowY: "auto",
                    border: "1px solid",
                    borderColor: "rgba(0,0,0,0.08)",
                    borderRadius: 1.5,
                  }}
                >
                  {searchResults.map((place) => (
                    <Box
                      key={place.id}
                      onClick={() => selectPlace(place)}
                      sx={{
                        px: 1.5,
                        py: 1,
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                        backgroundColor: selectedPlaceId === place.id ? "rgba(255,107,0,0.08)" : "#fff",
                        "&:hover": { backgroundColor: "rgba(255,107,0,0.04)" },
                      }}
                    >
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{place.name}</Typography>
                      <Typography sx={{ fontSize: 12, color: "#64748b" }}>{place.address}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <TextField
                label="주소"
                value={form.address}
                fullWidth
                InputProps={{ readOnly: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    bgcolor: "#f8fafc",
                  },
                }}
              />

              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#334155" }}>대표사진 (필수)</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleRepresentativeImageButtonClick}
                    disabled={representativeUploading}
                    sx={{
                      borderColor: ACCENT,
                      color: ACCENT,
                      minWidth: 160,
                      fontWeight: 600,
                      borderRadius: 1.5,
                      "&:hover": {
                        borderColor: "#e55f00",
                        bgcolor: "rgba(255,107,0,0.04)",
                      },
                    }}
                  >
                    {representativeUploading ? "업로드 중..." : "대표사진 업로드"}
                  </Button>
                  <Typography sx={{ fontSize: 13, color: "#64748b" }}>{representativeImageName || "선택된 대표사진 없음"}</Typography>
                </Stack>
                <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>허용: PNG, JPG, WEBP (최대 10MB)</Typography>
                {(representativePreviewUrl || form.imageUrl) && (
                  <Box
                    component="img"
                    src={toDisplayImageUrl(representativePreviewUrl || form.imageUrl)}
                    alt="대표사진 미리보기"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const img = e.currentTarget;
                      if (img.src.includes("/images/world.jpg")) return;
                      img.src = "/images/world.jpg";
                    }}
                    sx={{
                      width: 220,
                      maxWidth: "100%",
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: "rgba(0,0,0,0.08)",
                    }}
                  />
                )}
                <input ref={representativeImageInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" style={{ display: "none" }} onChange={handleRepresentativeImageChange} />
              </Stack>

              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#334155" }}>사업자등록증 첨부 (임시 보관)</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleLicenseButtonClick}
                    disabled={licenseUploading}
                    sx={{
                      borderColor: ACCENT,
                      color: ACCENT,
                      minWidth: 160,
                      fontWeight: 600,
                      borderRadius: 1.5,
                      "&:hover": {
                        borderColor: "#e55f00",
                        bgcolor: "rgba(255,107,0,0.04)",
                      },
                    }}
                  >
                    {licenseUploading ? "업로드 중..." : "파일 선택/업로드"}
                  </Button>
                  <Typography sx={{ fontSize: 13, color: "#64748b" }}>{licenseFileName || "선택된 파일 없음"}</Typography>
                  {(hasExistingLicenseFile || Boolean(form.businessLicenseFileKey.trim())) && (
                    <Button
                      type="button"
                      size="small"
                      variant="outlined"
                      onClick={() => void handleOpenLicenseFile()}
                      disabled={licenseOpening}
                      sx={{
                        borderColor: ACCENT,
                        color: ACCENT,
                        borderRadius: 1,
                        "&:hover": {
                          borderColor: "#e55f00",
                          bgcolor: "rgba(255,107,0,0.04)",
                        },
                      }}
                    >
                      {licenseOpening ? "여는 중..." : "첨부파일 확인"}
                    </Button>
                  )}
                </Stack>
                <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>허용: PDF, PNG, JPG, WEBP (최대 10MB, 14일 후 자동 삭제)</Typography>
                <input ref={licenseFileInputRef} type="file" accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp" style={{ display: "none" }} onChange={handleLicenseFileChange} />
              </Stack>

              <TextField
                label="전화번호"
                value={form.phone}
                onChange={handlePhoneChange}
                fullWidth
                placeholder="숫자와 - 입력 (예: 02-123-4567)"
                inputProps={{ inputMode: "tel", pattern: "[0-9-]*", maxLength: 13 }}
                helperText="숫자와 하이픈(-)만 입력 가능합니다."
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

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#334155" }}>카테고리</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {CATEGORY_OPTIONS.map((category) => {
                    const selected = form.categories.includes(category);
                    return (
                      <Chip
                        key={category}
                        clickable
                        label={category}
                        onClick={() => toggleCategory(category)}
                        sx={{
                          borderRadius: 1.5,
                          fontWeight: 600,
                          bgcolor: selected ? ACCENT : "#fff",
                          color: selected ? "#fff" : "#64748b",
                          border: `1px solid ${selected ? ACCENT : "rgba(0,0,0,0.2)"}`,
                          "&:hover": {
                            bgcolor: selected ? "#e55f00" : "rgba(0,0,0,0.04)",
                            borderColor: selected ? "#e55f00" : "rgba(0,0,0,0.3)",
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              </Stack>

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#334155" }}>식당 정보글을 작성해주세요</Typography>
                <Box
                  sx={{
                    "& .ql-toolbar.ql-snow": {
                      borderRadius: "8px 8px 0 0",
                      borderColor: "rgba(0,0,0,0.12)",
                    },
                    "& .ql-container.ql-snow": {
                      minHeight: 220,
                      borderRadius: "0 0 8px 8px",
                      borderColor: "rgba(0,0,0,0.12)",
                    },
                    "& .ql-editor": { minHeight: 180, fontSize: 15, lineHeight: 1.7 },
                  }}
                >
                  <ReactQuill
                    theme="snow"
                    value={form.description}
                    onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
                    modules={descriptionQuillModules}
                    placeholder="식당 소개, 대표 메뉴, 추천 포인트를 작성해 주세요."
                  />
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={1.5}
                justifyContent="flex-end"
                sx={{ mt: 4, pt: 2 }}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate(isEditMode && editRequestId ? `/register/requests/${editRequestId}` : "/")}
                  sx={{
                    height: 40,
                    fontSize: 14,
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "rgba(0,0,0,0.2)",
                    color: "#64748b",
                    "&:hover": {
                      borderColor: ACCENT,
                      color: ACCENT,
                      bgcolor: "rgba(255,107,0,0.04)",
                    },
                  }}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={editLoading || submitting || licenseUploading || representativeUploading}
                  sx={{
                    height: 40,
                    fontSize: 14,
                    borderRadius: 1.5,
                    bgcolor: ACCENT,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 2.5,
                    "&:hover": { bgcolor: "#e55f00" },
                  }}
                >
                  {submitting ? <CircularProgress size={20} color="inherit" /> : isEditMode ? "수정 저장" : "등록"}
                </Button>
              </Stack>
            </Stack>
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
    </ThemeProvider>
  );
}
