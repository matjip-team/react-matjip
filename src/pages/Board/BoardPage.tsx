// 게시글 목록 페이지
import { useEffect, useState } from "react";
// 자유게시판 목록 페이지
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Menu,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import SmartDisplayOutlinedIcon from "@mui/icons-material/SmartDisplayOutlined";
import axios from "../common/axios";
import { ThemeProvider } from "@mui/material/styles";
import { boardTheme } from "./theme/boardTheme";

// 타입 정의

type CategoryType = "ALL" | "공지" | "일반";

interface Board {
  id: number;
  title: string;
  // 타입 정의
  content?: string;
  boardType: "NOTICE" | "REVIEW";
  authorNickname: string;
  createdAt?: string;
  viewCount: number;
  recommendCount: number;
  commentCount: number;
  hasImage?: boolean;
  hasVideo?: boolean;
  hidden?: boolean;
  reportCount?: number;
}

// 메인 컴포넌트

export default function BoardPage() {
  const navigate = useNavigate();
  const MAIN_COLOR = "#ff6b00";

  // 메인 컴포넌트
  // 상태
  const [posts, setPosts] = useState<Board[]>([]);
  const [category, setCategory] = useState<CategoryType>("ALL");

  const [keyword, setKeyword] = useState("");
    // 상태
  const [appliedKeyword, setAppliedKeyword] = useState("");

  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [toast, setToast] = useState("");
  const [searchType, setSearchType] = useState("TITLE_CONTENT");
  const [appliedSearchType, setAppliedSearchType] = useState("TITLE_CONTENT"); // 실제 검색용

  // 글쓴이 컨텍스트 메뉴
  const [authorAnchor, setAuthorAnchor] = useState<null | HTMLElement>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");

    // 게시글 목록 조회
    // 글쓴이 메뉴

  useEffect(() => {
    const fetchBoards = async () => {
      const res = await axios.get("/api/boards", {
    // 게시글 목록 조회
        params: {
          page,
          size,
          type:
            category === "ALL"
              ? null
              : category === "공지"
              ? "NOTICE"
              : "REVIEW",
          keyword: appliedKeyword,
          searchType: appliedSearchType,
        },
      });

      const data = res.data.data;

      const isVisibleBoard = (item: Board | null | undefined): item is Board =>
        item != null && item.hidden !== true;

      const notices = (data.notices ?? []).filter(isVisibleBoard);
      const contents = (data.contents ?? []).filter(isVisibleBoard);

      if (category === "ALL") {
        setPosts([...notices, ...contents]);
      } else if (category === "공지") {
        setPosts(notices);
      } else {
        setPosts(contents);
      }

      const computedTotalPages = Math.ceil(
        (data.totalElements ?? 0) / (data.size ?? size)
      );

      setTotalPages(Math.max(1, computedTotalPages));
    };

    fetchBoards();
  }, [page, category, appliedKeyword, size, appliedSearchType]);

    // 헬퍼 함수

  // 글 타입 반환
  const getBoardType = (post?: Board) => post?.boardType ?? "";
    // 헬퍼 함수

  // 글 타입 레이블 변환
  const getBoardLabel = (post: Board) => {
    if (post.boardType === "NOTICE") return "공지";
    if (post.boardType === "REVIEW") return "일반";
    return "-";
  };

  // 검색 실행
  const getTitleIcons = (post: Board) => {
    if (post.hasImage && post.hasVideo) {
      return (
        <Box component="span" sx={{ display: "inline-flex", gap: 0.4, mr: 0.8 }}>
          <ImageOutlinedIcon sx={{ fontSize: 16, verticalAlign: "middle", color: "#2e7d32" }} />
          <SmartDisplayOutlinedIcon sx={{ fontSize: 16, verticalAlign: "middle", color: "#d32f2f" }} />
        </Box>
      );
    }

    if (post.hasImage) {
      return (
        <ImageOutlinedIcon
          sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.8, color: "#2e7d32" }}
        />
      );
    }

    if (post.hasVideo) {
      return (
        <SmartDisplayOutlinedIcon
          sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.8, color: "#d32f2f" }}
        />
      );
    }

    return (
      <ChatBubbleOutlineIcon
        sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.8, color: "#9e9e9e" }}
      />
    );
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

    // 글쓴이 메뉴

  // 글쓴이 메뉴 오픈
    // 글쓴이 메뉴
  const openAuthorMenu = (
    e: React.MouseEvent<HTMLElement>,
    author: string
  ) => {
    setAuthorAnchor(e.currentTarget as HTMLElement);
    setSelectedAuthor(author);
  };

  // 글쓴이 메뉴 닫기
  const closeAuthorMenu = () => {
    setAuthorAnchor(null);
  };

    // 렌더

    // 렌더
  return (
    <ThemeProvider theme={boardTheme}>
      <Box sx={{ maxWidth: 1100, mx: "auto", mt: 5 }}>

        {/* 제목 / 글쓰기 */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Box sx={{ fontSize: 28, fontWeight: 700, color: MAIN_COLOR }}>
            커뮤니티
          </Box>

          <Button
            variant="contained"
            sx={{ bgcolor: MAIN_COLOR }}
            onClick={() => navigate("/board/write")}
          >
            새글쓰기
          </Button>
        </Box>

        {/* 검색 */}
        <Box sx={{ display: "flex", gap: 1, mb: 4 }}>
          <Select
            size="small"
            value={searchType}
            onChange={(e) => {
              setSearchType(e.target.value)
            }}
            sx={{width: 120}}
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
            sx={{width: 300}}
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

        {/* 카테고리 */}
        <Box sx={{ display: "flex", gap: 0.5, mb: 1, alignItems: "center" }}>
          {["ALL", "공지", "일반"].map((c) => (
            <Button
              key={c}
              size="small"
              variant={category === c ? "contained" : "outlined"}
              sx={{
                bgcolor: category === c ? MAIN_COLOR : "#fff",
                color: category === c ? "#fff" : MAIN_COLOR,
                borderColor: MAIN_COLOR,
              }}
              onClick={() => {
                setCategory(c as CategoryType);
                setPage(0);
                setKeyword("");
  setAppliedKeyword("");
              }}
            >
              {c === "ALL" ? "전체글" : c}
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
              sx={{width: 90}}
            >
              <MenuItem value={10}>10개</MenuItem>
              <MenuItem value={30}>30개</MenuItem>
              <MenuItem value={50}>50개</MenuItem>
              <MenuItem value={100}>100개</MenuItem>
            </Select>
          </Box>
        </Box>

        {/* 테이블 */}
        <TableContainer component={Paper}>
          <Table sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ borderBottom: "2px solid #ff6b00" }}>
                <TableCell align="center" sx={{ width: 30 }}>번호</TableCell>
                <TableCell align="center" sx={{ width: 50 }}>말머리</TableCell>
                <TableCell align="center">제목</TableCell>
                <TableCell align="center" sx={{ width: 130 }}>글쓴이</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>작성일</TableCell>
                <TableCell align="center" sx={{ width: 40 }}>조회</TableCell>
                <TableCell align="center" sx={{ width: 40 }}>추천</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#888" }}>
                    게시글이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => {
                  const type = getBoardType(post);

                  return (
                    <TableRow key={post.id} hover>
                      <TableCell align="center">{post.id}</TableCell>

                      <TableCell align="center">
                        <Chip
                          label={getBoardLabel(post)}
                          size="small"
                          sx={{
                            bgcolor: type === "NOTICE" ? MAIN_COLOR : "#adb5bd",
                            color: "#fff",
                          }}
                        />
                      </TableCell>

                      <TableCell
                        align="left"
                        sx={{
                          pl: 10,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: type === "NOTICE" ? 700 : 400,
                        }}
                      >
                        <Box
                          component="span"
                          onClick={() => navigate(`/board/${post.id}`)}
                          sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                        >
                          {getTitleIcons(post)}
                          {post.title}
                          {post.commentCount > 0 && (
                            <span style={{ color: "#999", marginLeft: 4 }}>
                              [{post.commentCount}]
                            </span>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        <Box
                          component="span"
                          sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                          onClick={(e) => openAuthorMenu(e, post.authorNickname)}
                        >
                          {post.authorNickname}
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString("ko-KR")
                          : "-"}
                      </TableCell>

                      <TableCell align="center">{post.viewCount}</TableCell>
                      <TableCell align="center">{post.recommendCount}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 글쓴이 메뉴 */}
        <Menu anchorEl={authorAnchor} open={Boolean(authorAnchor)} onClose={closeAuthorMenu}>
          <MenuItem onClick={() => alert(`${selectedAuthor} 글 보기`)}>글</MenuItem>
          <MenuItem onClick={() => alert(`${selectedAuthor} 댓글 보기`)}>댓글</MenuItem>
          <MenuItem onClick={() => alert(`${selectedAuthor} 작성글 검색`)}>
            작성글 검색
          </MenuItem>
        </Menu>

        {/* 페이지네이션 */}
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
