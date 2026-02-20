import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Menu,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Paper,
  Pagination,
  IconButton,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";
import { ThemeProvider } from "@mui/material/styles";
import { blogTheme } from "./theme/blogTheme";

type CategoryType = "ALL" | "NOTICE" | "REVIEW";

interface BlogPost {
  id: number;
  title: string;
  content?: string;
  contentHtml?: string;
  contentDelta?: unknown;
  blogType: "NOTICE" | "REVIEW";
  authorNickname: string;
  createdAt?: string;
  viewCount: number;
  recommendCount: number;
  commentCount: number;
  hasImage?: boolean;
  hasVideo?: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
  mediaType?: string | null;
  mediaUrls?: string[] | null;
}

interface DeltaInsertObject {
  image?: unknown;
  video?: unknown;
}

interface DeltaOp {
  insert?: string | DeltaInsertObject;
}

interface DeltaLike {
  ops?: DeltaOp[];
}

interface BlogLikePayload extends Omit<BlogPost, "hasImage" | "hasVideo"> {
  hasImage?: unknown;
  hasVideo?: unknown;
}

const toBoolean = (value: unknown): boolean =>
  value === true || value === "true" || value === 1 || value === "1";

const normalizeBlog = (blog: BlogLikePayload): BlogPost => ({
  ...blog,
  hasImage: toBoolean(blog?.hasImage),
  hasVideo: toBoolean(blog?.hasVideo),
});

const parseDelta = (rawDelta: unknown): DeltaLike | null => {
  if (!rawDelta) return null;
  if (typeof rawDelta === "object") return rawDelta as DeltaLike;
  if (typeof rawDelta !== "string") return null;
  try {
    return JSON.parse(rawDelta) as DeltaLike;
  } catch {
    return null;
  }
};

const hasEmbedInDelta = (rawDelta: unknown, embedType: "image" | "video") => {
  const delta = parseDelta(rawDelta);
  const ops = Array.isArray(delta?.ops) ? delta.ops : [];
  return ops.some((op) => {
    if (typeof op?.insert !== "object" || op.insert === null) return false;
    return Boolean((op.insert as DeltaInsertObject)?.[embedType]);
  });
};

const getPostHtml = (post: BlogPost) => post.contentHtml ?? post.content ?? "";

export default function BlogPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const MAIN_COLOR = "#ff6b00";

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [category, setCategory] = useState<CategoryType>("ALL");
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [toast, setToast] = useState("");
  const [searchType, setSearchType] = useState("TITLE_CONTENT");
  const [appliedSearchType, setAppliedSearchType] = useState("TITLE_CONTENT");
  const [authorAnchor, setAuthorAnchor] = useState<null | HTMLElement>(null);
  const [selectedAuthor, setSelectedAuthor] = useState("");

  useEffect(() => {
    const fetchBlogs = async () => {
      const res = await axios.get("/api/blogs", {
        params: {
          page,
          size,
          type: category === "ALL" ? null : category,
          keyword: appliedKeyword,
          searchType: appliedSearchType,
        },
      });

      const data = res.data.data;
      const notices = (data.notices ?? []).filter(Boolean).map(normalizeBlog);
      const contents = (data.contents ?? []).filter(Boolean).map(normalizeBlog);

      if (category === "ALL") {
        setPosts([...notices, ...contents]);
      } else if (category === "NOTICE") {
        setPosts(notices);
      } else {
        setPosts(contents);
      }

      const computedTotalPages = Math.ceil(
        (data.totalElements ?? 0) / (data.size ?? size),
      );
      setTotalPages(Math.max(1, computedTotalPages));
    };

    fetchBlogs();
  }, [page, category, appliedKeyword, size, appliedSearchType]);

  const getBlogType = (post?: BlogPost) => post?.blogType ?? "";

  const getBlogLabel = (post: BlogPost) => {
    if (post.blogType === "NOTICE") return "공지";
    if (post.blogType === "REVIEW") return "후기";
    return "-";
  };

  const hasImageContent = (post: BlogPost) => {
    if (post.hasImage) return true;
    const content = getPostHtml(post);
    return (
      /<img[\s>]/i.test(content) ||
      hasEmbedInDelta(post.contentDelta, "image") ||
      Boolean(post.imageUrl?.trim()) ||
      /image/i.test(post.mediaType ?? "") ||
      (Array.isArray(post.mediaUrls) &&
        post.mediaUrls.some((url) =>
          /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url),
        ))
    );
  };

  const hasVideoContent = (post: BlogPost) => {
    if (post.hasVideo) return true;
    const content = getPostHtml(post);
    return (
      /<(video|iframe)[\s>]/i.test(content) ||
      hasEmbedInDelta(post.contentDelta, "video") ||
      Boolean(post.videoUrl?.trim()) ||
      /video/i.test(post.mediaType ?? "") ||
      (Array.isArray(post.mediaUrls) &&
        post.mediaUrls.some((url) =>
          /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url),
        ))
    );
  };

  const getThumbnailUrl = (post: BlogPost) => {
    if (post.imageUrl?.trim()) {
      return post.imageUrl.trim();
    }

    const content = getPostHtml(post);
    const match = content.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
    return match?.[1] ?? "";
  };

  const handleSearch = () => {
    if (!keyword.trim()) {
      setToast("검색어를 입력해주세요.");
      return;
    }
    setPage(0);
    setAppliedKeyword(keyword);
    setAppliedSearchType(searchType);
  };

  const openAuthorMenu = (e: React.MouseEvent<HTMLElement>, author: string) => {
    setAuthorAnchor(e.currentTarget as HTMLElement);
    setSelectedAuthor(author);
  };

  const closeAuthorMenu = () => setAuthorAnchor(null);

  const handleWriteClick = () => {
    if (!user) {
      setToast("로그인이 필요합니다.");
      return;
    }
    navigate("/blog/write");
  };

  return (
    <ThemeProvider theme={blogTheme}>
      <Box sx={{ maxWidth: 1100, mx: "auto", mt: 5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Box sx={{ fontSize: 28, fontWeight: 700, color: MAIN_COLOR }}>
            블로그
          </Box>
          <Button
            variant="contained"
            sx={{ bgcolor: MAIN_COLOR }}
            onClick={handleWriteClick}
          >
            새글쓰기
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 1, mb: 4 }}>
          <Select
            size="small"
            value={searchType}
            onChange={(e) => setSearchType(String(e.target.value))}
            sx={{ width: 120 }}
          >
            <MenuItem value="TITLE_CONTENT">제목+내용</MenuItem>
            <MenuItem value="TITLE">제목</MenuItem>
            <MenuItem value="CONTENT">내용</MenuItem>
            <MenuItem value="AUTHOR">글쓴이</MenuItem>
            <MenuItem value="COMMENT">댓글</MenuItem>
          </Select>

          <TextField
            size="small"
            placeholder="검색어 입력"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            sx={{ width: 300 }}
          />

          <IconButton
            sx={{
              bgcolor: MAIN_COLOR,
              color: "#fff",
              "&:hover": { bgcolor: MAIN_COLOR },
            }}
            onClick={handleSearch}
          >
            <SearchIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5, mb: 1, alignItems: "center" }}>
          {[
            { key: "ALL" as const, label: "전체글" },
            { key: "NOTICE" as const, label: "공지" },
            { key: "REVIEW" as const, label: "후기" },
          ].map((c) => (
            <Button
              key={c.key}
              size="small"
              variant={category === c.key ? "contained" : "outlined"}
              sx={{
                bgcolor: category === c.key ? MAIN_COLOR : "#fff",
                color: category === c.key ? "#fff" : MAIN_COLOR,
                borderColor: MAIN_COLOR,
              }}
              onClick={() => {
                setCategory(c.key);
                setPage(0);
                setKeyword("");
                setAppliedKeyword("");
              }}
            >
              {c.label}
            </Button>
          ))}

          <Box sx={{ marginLeft: "auto" }}>
            <Select
              size="small"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              sx={{ width: 90 }}
            >
              <MenuItem value={10}>10개</MenuItem>
              <MenuItem value={30}>30개</MenuItem>
              <MenuItem value={50}>50개</MenuItem>
              <MenuItem value={100}>100개</MenuItem>
            </Select>
          </Box>
        </Box>

        {posts.length === 0 ? (
          <Paper sx={{ py: 6, textAlign: "center", color: "#888" }}>
            게시글이 없습니다.
          </Paper>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.2,
            }}
          >
            {posts.map((post) => {
              const type = getBlogType(post);
              const showImageIcon = hasImageContent(post);
              const showVideoIcon = hasVideoContent(post);
              const showDefaultBubble = !showImageIcon && !showVideoIcon;
              const thumbnailUrl = getThumbnailUrl(post);

              return (
                <Card
                  key={post.id}
                  variant="outlined"
                  onClick={() => navigate(`/blog/${post.id}`)}
                  sx={{
                    borderColor: "#ececec",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: MAIN_COLOR,
                      boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                    },
                  }}
                >
                  <CardContent sx={{ py: 1.6, px: 2 }}>
                    <Box
                      sx={{
                        width: "100%",
                        height: 160,
                        borderRadius: 1,
                        border: "1px solid #efefef",
                        mb: 1.1,
                        overflow: "hidden",
                        bgcolor: "#fafafa",
                      }}
                    >
                      {thumbnailUrl ? (
                        <Box
                          component="img"
                          src={thumbnailUrl}
                          alt="블로그 썸네일"
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <Box sx={{ width: "100%", height: "100%" }} />
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.9,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Chip
                          label={getBlogLabel(post)}
                          size="small"
                          sx={{
                            bgcolor: type === "NOTICE" ? MAIN_COLOR : "#adb5bd",
                            color: "#fff",
                          }}
                        />
                        <Typography sx={{ fontSize: 12, color: "#999" }}>
                          #{post.id}
                        </Typography>
                      </Box>

                      <Typography sx={{ fontSize: 12, color: "#999" }}>
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString("ko-KR")
                          : "-"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.9,
                        mb: 1,
                        "&:hover .blog-title": { textDecoration: "underline" },
                      }}
                    >
                      {showDefaultBubble && (
                        <ChatBubbleOutlineIcon
                          sx={{ fontSize: 18, color: "#9e9e9e" }}
                        />
                      )}
                      {showImageIcon && (
                        <ImageOutlinedIcon
                          sx={{ fontSize: 18, color: "#2e7d32" }}
                        />
                      )}
                      {showVideoIcon && (
                        <VideocamOutlinedIcon
                          sx={{ fontSize: 18, color: "#1565c0" }}
                        />
                      )}

                      <Typography
                        className="blog-title"
                        sx={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: type === "NOTICE" ? 700 : 500,
                        }}
                      >
                        {post.title}
                      </Typography>

                      {post.commentCount > 0 && (
                        <Typography sx={{ fontSize: 13, color: "#888" }}>
                          [{post.commentCount}]
                        </Typography>
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: 13,
                          color: "#666",
                          cursor: "pointer",
                          "&:hover": { textDecoration: "underline" },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openAuthorMenu(e, post.authorNickname);
                        }}
                      >
                        {post.authorNickname}
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.4,
                          color: "#777",
                          fontSize: 13,
                        }}
                      >
                        <Typography sx={{ fontSize: 13 }}>
                          조회 {post.viewCount}
                        </Typography>
                        <Typography sx={{ fontSize: 13 }}>
                          추천 {post.recommendCount}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        <Menu
          anchorEl={authorAnchor}
          open={Boolean(authorAnchor)}
          onClose={closeAuthorMenu}
        >
          <MenuItem onClick={() => alert(`${selectedAuthor} 글 보기`)}>
            글
          </MenuItem>
          <MenuItem onClick={() => alert(`${selectedAuthor} 댓글 보기`)}>
            댓글
          </MenuItem>
          <MenuItem onClick={() => alert(`${selectedAuthor} 작성글 검색`)}>
            작성글 검색
          </MenuItem>
        </Menu>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={posts.length === 0 ? 1 : totalPages}
            page={page + 1}
            disabled={posts.length === 0}
            onChange={(_, v) => setPage(v - 1)}
          />
        </Box>
      </Box>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={1500}
        message={toast}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </ThemeProvider>
  );
}
