import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Pagination,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";

const categories = [
  { label: "전체", value: "전체" },
  { label: "한식", value: "한식" },
  { label: "양식", value: "양식" },
  { label: "고기/구이", value: "고기/구이" },
  { label: "씨푸드", value: "씨푸드" },
  { label: "일중/세계음식", value: "일중/세계음식" },
  { label: "비건", value: "비건" },
  { label: "카페/디저트", value: "카페/디저트" },
];

interface Restaurant {
  id: number;
  name: string;
  address: string;
  category: string;
  imageUrl?: string;
  likeCount: number;
  liked: boolean;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

type SearchParams = {
  categories?: string;
  keyword?: string;
  page?: number;
  size?: number;
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [stores, setStores] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  /* ===================== 맛집 조회 ===================== */
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);

    try {
      const params: SearchParams = {
        page,
        size: 9,
      };

      if (selectedCategory !== "전체") {
        params.categories = selectedCategory;
      }

      const trimmed = keyword.trim();
      if (trimmed !== "") {
        params.keyword = trimmed;
      }

      const res = await axios.get("/api/restaurants", { params });

      const data: PageResponse<Restaurant> = res.data.data;

      setStores(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("맛집 조회 실패", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, keyword, page]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  /* ===================== 좋아요 토글 ===================== */
  const toggleLike = async (storeId: number) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      navigate("/auth/login");
      return;
    }

    const target = stores.find((s) => s.id === storeId);
    if (!target) return;

    // optimistic UI
    setStores((prev) =>
      prev.map((store) =>
        store.id === storeId
          ? {
              ...store,
              liked: !store.liked,
              likeCount: store.liked
                ? store.likeCount - 1
                : store.likeCount + 1,
            }
          : store
      )
    );

    try {
      if (target.liked) {
        await axios.delete(`/api/restaurants/${storeId}/likes`);
      } else {
        await axios.post(`/api/restaurants/${storeId}/likes`);
      }
    } catch (error) {
      console.error("좋아요 실패", error);
      fetchRestaurants(); // 실패 시 서버 기준 재동기화
    }
  };

  return (
    <Box sx={{ backgroundColor: "#f5f6f8", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="lg">

        {/* 검색 */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 5 }}>
          <TextField
            placeholder="맛집명, 지역명을 검색해보세요"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchRestaurants();
            }}
            sx={{
              width: 420,
              backgroundColor: "#fff",
              borderRadius: 3,
            }}
          />

          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={fetchRestaurants}
            sx={{
              ml: 2,
              px: 3,
              backgroundColor: "#ff6b00",
              "&:hover": { backgroundColor: "#e65f00" },
            }}
          >
            검색
          </Button>
        </Box>

        {/* 카테고리 */}
        <Box sx={{ textAlign: "center", mb: 5 }}>
          {categories.map((cat) => (
            <Chip
              key={cat.value}
              label={cat.label}
              clickable
              onClick={() => {
                setSelectedCategory(cat.value);
                setPage(0);
              }}
              sx={{
                m: 1,
                px: 2,
                fontWeight: 600,
                borderRadius: 3,
                backgroundColor:
                  selectedCategory === cat.value ? "#ff6b00" : "#fff",
                color: selectedCategory === cat.value ? "#fff" : "#444",
                boxShadow: selectedCategory === cat.value ? 3 : 1,
              }}
            />
          ))}
        </Box>

        {/* 카드 영역 */}
        <Box
          sx={{
            display: "grid",
            gap: 4,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
          }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rectangular"
                  height={250}
                  sx={{ borderRadius: 4 }}
                />
              ))
            : stores.map((store) => (
                <Card
                  key={store.id}
                  sx={{
                    borderRadius: 4,
                    overflow: "hidden",
                    transition: "0.3s",
                    boxShadow: 2,
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/restaurant/${store.id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={store.imageUrl ?? "/images/world.jpg"}
                    />

                    <CardContent>
                      <Typography variant="h6" fontWeight={700}>
                        {store.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {store.address}
                      </Typography>

                      {/* 좋아요 버튼 */}
                      <Box
                        onClick={(e) => {
                          e.stopPropagation(); // 카드 이동 방지
                          toggleLike(store.id);
                        }}
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          mt: 1,
                          cursor: "pointer",
                          color: store.liked ? "#ff6b00" : "#bbb",
                          transition: "0.2s",
                          "&:hover": {
                            transform: "scale(1.1)",
                          },
                        }}
                      >
                        <FavoriteIcon sx={{ fontSize: 18 }} />
                        <Typography sx={{ ml: 0.5 }}>
                          {store.likeCount}
                        </Typography>
                      </Box>

                      <Chip
                        label={store.category}
                        size="small"
                        sx={{
                          mt: 2,
                          backgroundColor: "#fff3e6",
                          color: "#ff6b00",
                          fontWeight: 600,
                        }}
                      />
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
        </Box>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(_, value) => setPage(value - 1)}
              sx={{
                "& .Mui-selected": {
                  backgroundColor: "#ff6b00 !important",
                  color: "#fff",
                },
              }}
            />
          </Box>
        )}

        {!loading && stores.length === 0 && (
          <Typography textAlign="center" mt={8} color="text.secondary">
            검색 결과가 없습니다.
          </Typography>
        )}
      </Container>
    </Box>
  );
}
