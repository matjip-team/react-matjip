import { useState, useEffect } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlaceIcon from "@mui/icons-material/Place";
import MapIcon from "@mui/icons-material/Map";
import PhoneIcon from "@mui/icons-material/Phone";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import axios from "../common/axios";
import { AI_RECOMMEND_BASE_URL } from "../common/config/config";

export type Place = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  /** 카카오맵 장소 상세 URL (백엔드에서 내려주면 사용) */
  place_url?: string;
  /** 전화번호 (백엔드에서 내려주면 표시) */
  phone?: string;
  /** 대표 이미지 URL (백엔드에서 내려주면 사용, 없으면 플레이스홀더) */
  imageUrl?: string;
  /** 소개/설명 (백엔드에서 내려주면 표시) */
  description?: string;
};

const ACCENT = "#ff6b00";

type Props = {
  place: Place;
  onClose: () => void;
};

/** 카카오맵 검색 URL (상호명으로 검색) */
function getKakaoMapSearchUrl(placeName: string, address: string): string {
  const query = encodeURIComponent(`${placeName} ${address}`);
  return `https://map.kakao.com/link/search/${query}`;
}

type PlaceDetails = { description: string; image_url: string | null };

export default function RecommendedPlaceDetail({ place, onClose }: Props) {
  const mapSearchUrl = place.place_url || getKakaoMapSearchUrl(place.name, place.address);
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setDetailsLoading(true);
    setDetails(null);

    axios
      .post<PlaceDetails>(`${AI_RECOMMEND_BASE_URL}/api/fastapi/recommend/place-details`, {
        name: place.name,
        address: place.address,
        category: place.category,
        place_url: place.place_url || undefined,
      })
      .then((res) => {
        if (!cancelled && res.data) {
          setDetails({
            description: res.data.description ?? "",
            image_url: res.data.image_url ?? null,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setDetails(null);
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [place.name, place.address, place.category, place.place_url]);

  const displayDescription =
    details?.description ||
    place.description ||
    `${place.category} 맛집이에요. AI가 추천한 곳입니다. 카카오맵에서 메뉴·리뷰·영업시간을 확인해 보세요.`;

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 4,
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "rgba(255,107,0,0.25)",
        bgcolor: "#fff",
        position: "relative",
      }}
    >
      {/* 닫기 버튼 */}
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1,
          bgcolor: "rgba(0,0,0,0.04)",
          "&:hover": { bgcolor: "rgba(0,0,0,0.08)" },
        }}
        size="small"
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      {/* 본문 */}
      <Box sx={{ p: 3, pt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: "-0.02em",
            }}
          >
            {place.name}
          </Typography>
          <Typography
            component="span"
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              fontSize: 12,
              fontWeight: 600,
              bgcolor: ACCENT,
              color: "#fff",
            }}
          >
            {place.category}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            mb: 1.5,
            color: "#64748b",
          }}
        >
          <PlaceIcon sx={{ fontSize: 18, mt: 0.25, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 14, lineHeight: 1.6 }}>
            {place.address}
          </Typography>
        </Box>

        {place.phone && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
              color: "#64748b",
            }}
          >
            <PhoneIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14 }}>{place.phone}</Typography>
          </Box>
        )}

        {/* 소개/내용 (주소·가게 이름으로 API에서 가져옴) */}
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            bgcolor: "#f8fafc",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {detailsLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={18} sx={{ color: ACCENT }} />
              <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>
                소개 문구 생성 중...
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={{
                fontSize: 14,
                color: "#475569",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {displayDescription}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<MapIcon />}
            href={mapSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              bgcolor: ACCENT,
              "&:hover": { bgcolor: "#e55f00" },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            {place.place_url ? "카카오맵에서 보기" : "카카오맵에서 검색"}
          </Button>
          {/* 카카오 장소 페이지에만 사진·블로그 탭이 있음 (place.map.kakao.com) */}
          {place.place_url && place.place_url.includes("place.map.kakao.com") && (
            <Button
              variant="contained"
              startIcon={<PhotoCameraIcon />}
              href={`${place.place_url}#blogreview`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                bgcolor: "#03C75A",
                "&:hover": { bgcolor: "#02b351" },
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              사진·블로그 리뷰 보기
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
