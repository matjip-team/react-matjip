import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Select,
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
import axios from "../common/axios";
import { ThemeProvider } from "@mui/material/styles";
import { boardTheme } from "./theme/boardTheme";

type SearchType =
  | "TITLE_CONTENT"
  | "TITLE"
  | "CONTENT"
  | "AUTHOR"
  | "COMMENT";

type CategoryType = "ALL" | "공지" | "후기";

export default function BoardPage() {
  const navigate = useNavigate();
  const MAIN_COLOR = "#ff6b00";

  const [posts, setPosts] = useState<any[]>([]);
  const [category, setCategory] = useState<CategoryType>("ALL");

  const [keyword, setKeyword] = useState("");
  const [searchType, setSearchType] =
    useState<SearchType>("TITLE_CONTENT");

  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedSearchType, setAppliedSearchType] =
    useState<SearchType>("TITLE_CONTENT");

  /* ================================
     ✅ 목록 API 호출
  ================================= */
  useEffect(() => {
    const fetchBoards = async () => {
      const res = await axios.get("/api/boards", {
        params:
          category === "ALL"
            ? {}
            : { type: category === "공지" ? "NOTICE" : "REVIEW" },
      });
      setPosts(res.data.data);
    };

    fetchBoards();
  }, [category]);

  /* ================================
     ✅ 검색 버튼 클릭
  ================================= */
  const handleSearch = () => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setAppliedKeyword(trimmed);
    setAppliedSearchType(searchType);
  };

  /* ================================
     ✅ 프론트 검색 필터링
  ================================= */
  const filteredPosts = posts.filter((post) => {
    if (!appliedKeyword) return true;

    const kw = appliedKeyword;

    switch (appliedSearchType) {
      case "TITLE":
        return post.title?.includes(kw);
      case "CONTENT":
        return post.content?.includes(kw);
      case "AUTHOR":
        return post.authorNickname?.includes(kw);
      case "TITLE_CONTENT":
      default:
        return (
          post.title?.includes(kw) ||
          post.content?.includes(kw)
        );
    }
  });

  const getBoardType = (post: any) => {
    return post.boardType ?? post.type;
  };

  const getBoardLabel = (post: any) => {
    const type = getBoardType(post);
    if (type === "NOTICE") return "공지";
    if (type === "REVIEW") return "후기";
    return "-";
  };

  return (
    <ThemeProvider theme={boardTheme}>
      <Box sx={{ maxWidth: 1100, mx: "auto", mt: 5 }}>
        {/* ===== 제목 & 글쓰기 ===== */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box
            sx={{
              fontSize: 28,
              fontWeight: 700,
              color: MAIN_COLOR,
            }}
          >
            자유게시판
          </Box>

          <Button
            variant="contained"
            sx={{ bgcolor: MAIN_COLOR }}
            onClick={() => navigate("/board/write")}
          >
            새글쓰기
          </Button>
        </Box>

        {/* ===== 검색 ===== */}
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Select
            size="small"
            value={searchType}
            onChange={(e) =>
              setSearchType(e.target.value as SearchType)
            }
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
          />

          <IconButton
            onClick={handleSearch}
            sx={{
              bgcolor: MAIN_COLOR,
              color: "#fff",
              "&:hover": { bgcolor: MAIN_COLOR },
            }}
          >
            <SearchIcon />
          </IconButton>
        </Box>

        {/* ===== 카테고리 ===== */}
        <Box sx={{ display: "flex", gap: 0.5, mb: 2 }}>
          {["ALL", "공지", "후기"].map((c) => (
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
                setAppliedKeyword("");
                setKeyword("");
              }}
            >
              {c === "ALL" ? "전체글" : c}
            </Button>
          ))}
        </Box>

        {/* ===== 테이블 ===== */}
        <TableContainer component={Paper}>
          <Table sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ borderBottom: "2px solid #ff6b00" }}>
                <TableCell align="center" width={80}>번호</TableCell>
                <TableCell align="center" width={90}>말머리</TableCell>
                <TableCell align="center" width={300}>제목</TableCell>
                <TableCell align="center" width={120}>글쓴이</TableCell>
                <TableCell align="center" width={120}>작성일</TableCell>
                <TableCell align="center" width={80}>조회</TableCell>
                <TableCell align="center" width={80}>추천</TableCell>
              </TableRow>
            </TableHead>
            
             <TableBody>
              {filteredPosts.map((post, index) => {
                const type = getBoardType(post);

                return (
                  <TableRow
                    key={post.id}
                    hover
                    sx={{ borderBottom: "1px solid #e0e0e0" }}
                    >
                    <TableCell align="center">{post.id}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getBoardLabel(post)}
                        size="small"
                        sx={{
                          bgcolor:
                            type === "NOTICE"
                              ? MAIN_COLOR
                              : "#adb5bd",
                          color: "#fff",
                        }}
                      />
                    </TableCell>
                    <TableCell
                      align="left"
                      sx={{
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight:
                          post.boardType === "NOTICE" ? 700 : 400,
                      }}
                      onClick={() =>
                        navigate(`/board/${post.id}`)
                      }
                    >
                      {post.title}
                    </TableCell>
                    <TableCell align="center">{post.authorNickname}</TableCell>
                    <TableCell align="center">
                      {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell align="center">{post.viewCount}</TableCell>
                    <TableCell align="center">{post.recommendCount}</TableCell>
                  </TableRow>
              )})}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ===== 페이지네이션 ===== */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination count={1} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
