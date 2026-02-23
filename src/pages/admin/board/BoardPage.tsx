import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import SmartDisplayOutlinedIcon from "@mui/icons-material/SmartDisplayOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { ThemeProvider } from "@mui/material/styles";
import {
  fetchAdminBoards,
  type AdminBoardListItem,
  type AdminBoardStatusFilter,
  type BoardSearchType,
} from "./api/adminBoardApi";
import { boardTheme } from "./theme/boardTheme";

const statusOptions: Array<{ value: AdminBoardStatusFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "NOTICE", label: "공지" },
  { value: "REVIEW", label: "일반" },
  { value: "HIDDEN", label: "숨김" },
  { value: "REPORTED", label: "신고" },
];

type SortType =
  | "LATEST"
  | "OLDEST"
  | "VIEW_DESC"
  | "RECOMMEND_DESC"
  | "COMMENT_DESC";

const uniqueById = (items: AdminBoardListItem[]): AdminBoardListItem[] => {
  const map = new Map<number, AdminBoardListItem>();
  items.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
};

const getTime = (date?: string): number => {
  if (!date) return 0;
  const parsed = new Date(date).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const compareBySort = (a: AdminBoardListItem, b: AdminBoardListItem, sort: SortType): number => {
  if (sort === "OLDEST") return getTime(a.createdAt) - getTime(b.createdAt);
  if (sort === "VIEW_DESC") return b.viewCount - a.viewCount;
  if (sort === "RECOMMEND_DESC") return b.recommendCount - a.recommendCount;
  if (sort === "COMMENT_DESC") return b.commentCount - a.commentCount;
  return getTime(b.createdAt) - getTime(a.createdAt);
};

const applyStatusFilter = (
  items: AdminBoardListItem[],
  status: AdminBoardStatusFilter,
): AdminBoardListItem[] => {
  if (status === "NOTICE") return items.filter((item) => item.boardType === "NOTICE");
  if (status === "REVIEW") return items.filter((item) => item.boardType === "REVIEW");
  if (status === "HIDDEN") return items.filter((item) => item.hidden);
  if (status === "REPORTED") return items.filter((item) => (item.reportCount ?? 0) > 0);
  return items;
};

const ACCENT = "#ff6b00";

const statusChip = (item: AdminBoardListItem) => {
  if (item.hidden) {
    return (
      <Chip
        size="small"
        label="숨김"
        sx={{
          height: 22,
          fontSize: 11,
          fontWeight: 600,
          bgcolor: "#64748b",
          color: "#fff",
          "& .MuiChip-label": { px: 1 },
        }}
      />
    );
  }
  if ((item.reportCount ?? 0) > 0) {
    return (
      <Chip
        size="small"
        label={`신고 ${item.reportCount ?? 0}`}
        sx={{
          height: 22,
          fontSize: 11,
          fontWeight: 600,
          bgcolor: "#dc2626",
          color: "#fff",
          "& .MuiChip-label": { px: 1 },
        }}
      />
    );
  }
  return (
    <Chip
      size="small"
      label="정상"
      sx={{
        height: 22,
        fontSize: 11,
        fontWeight: 600,
        bgcolor: "#059669",
        color: "#fff",
        "& .MuiChip-label": { px: 1 },
      }}
    />
  );
};

const mediaIcon = (item: AdminBoardListItem) => {
  const hasImage = Boolean(item.hasImage);
  const hasVideo = Boolean(item.hasVideo);

  if (hasImage && hasVideo) {
    return (
      <Box component="span" sx={{ display: "inline-flex", gap: 0.4, mr: 0.8 }}>
        <ImageOutlinedIcon sx={{ fontSize: 16, verticalAlign: "middle", color: "#059669" }} />
        <SmartDisplayOutlinedIcon sx={{ fontSize: 16, verticalAlign: "middle", color: "#2563eb" }} />
      </Box>
    );
  }

  if (hasImage) {
    return (
      <ImageOutlinedIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.8, color: "#059669" }} />
    );
  }

  if (hasVideo) {
    return (
      <SmartDisplayOutlinedIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.8, color: "#2563eb" }} />
    );
  }

  return (
    <ChatBubbleOutlineIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.8, color: "#94a3b8" }} />
  );
};

export default function BoardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = (searchParams.get("status") as AdminBoardStatusFilter) || "ALL";

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [rawItems, setRawItems] = useState<AdminBoardListItem[]>([]);

  const [statusFilter, setStatusFilter] = useState<AdminBoardStatusFilter>(initialStatus);
  const [searchType, setSearchType] = useState<BoardSearchType>("TITLE_CONTENT");
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [sortType, setSortType] = useState<SortType>("LATEST");

  const [size, setSize] = useState(20);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const serverType =
          statusFilter === "NOTICE" ? "NOTICE" : statusFilter === "REVIEW" ? "REVIEW" : undefined;

        const data = await fetchAdminBoards({
          page: 0,
          size: 300,
          type: serverType,
          keyword: appliedKeyword || undefined,
          searchType,
        });

        setRawItems(uniqueById([...(data.notices ?? []), ...(data.contents ?? [])]));
      } catch {
        setToast("관리자 게시글을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [statusFilter, appliedKeyword, searchType]);

  const filteredItems = useMemo(() => {
    const byStatus = applyStatusFilter(rawItems, statusFilter);
    return [...byStatus].sort((a, b) => compareBySort(a, b, sortType));
  }, [rawItems, statusFilter, sortType]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / size));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * size;
    return filteredItems.slice(start, start + size);
  }, [currentPage, filteredItems, size]);

  const handleSearch = () => {
    setPage(1);
    setAppliedKeyword(keyword.trim());
  };

  const handleStatusChange = (next: AdminBoardStatusFilter) => {
    setStatusFilter(next);
    setPage(1);

    if (next === "ALL") {
      searchParams.delete("status");
      setSearchParams(searchParams, { replace: true });
      return;
    }

    setSearchParams({ status: next }, { replace: true });
  };

  return (
    <ThemeProvider theme={boardTheme}>
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          py: 5,
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* 헤더 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#1a1a1a",
                letterSpacing: "-0.02em",
                mb: 0.5,
              }}
            >
              관리자 게시글 목록
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#64748b" }}>
              게시글을 검토하고 관리합니다
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
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
              onClick={() => navigate("/admin/board")}
            >
              대시보드
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: ACCENT,
                "&:hover": { bgcolor: "#e55f00" },
                textTransform: "none",
                fontWeight: 600,
                px: 2.5,
                borderRadius: 1.5,
              }}
              onClick={() => navigate("/admin/board/write")}
            >
              관리자 작성
            </Button>
          </Box>
        </Box>

        {/* 검색 + 필터 */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            bgcolor: "#fafafa",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "center",
            }}
          >
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                size="small"
                variant={statusFilter === option.value ? "contained" : "outlined"}
                sx={{
                  bgcolor: statusFilter === option.value ? ACCENT : "transparent",
                  color: statusFilter === option.value ? "#fff" : "#64748b",
                  borderColor: statusFilter === option.value ? ACCENT : "rgba(0,0,0,0.2)",
                  "&:hover": {
                    bgcolor: statusFilter === option.value ? "#e55f00" : "rgba(0,0,0,0.04)",
                    borderColor: statusFilter === option.value ? "#e55f00" : "rgba(0,0,0,0.3)",
                  },
                  borderRadius: 1,
                }}
                onClick={() => handleStatusChange(option.value)}
              >
                {option.label}
              </Button>
            ))}

            <Select
              size="small"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as BoardSearchType)}
              sx={{
                width: 120,
                bgcolor: "#fff",
                borderRadius: 1,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(0,0,0,0.08)",
                },
              }}
            >
              <MenuItem value="TITLE_CONTENT">제목+내용</MenuItem>
              <MenuItem value="TITLE">제목</MenuItem>
              <MenuItem value="CONTENT">내용</MenuItem>
              <MenuItem value="AUTHOR">작성자</MenuItem>
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
              sx={{
                width: { xs: "100%", sm: 280 },
                flex: "1 1 200px",
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: 1,
                },
              }}
            />

            <IconButton
              sx={{
                bgcolor: ACCENT,
                color: "#fff",
                "&:hover": { bgcolor: "#e55f00", transform: "scale(1.02)" },
                transition: "all 0.2s",
              }}
              onClick={handleSearch}
            >
              <SearchIcon />
            </IconButton>

            <Select
              size="small"
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              sx={{
                width: 110,
                bgcolor: "#fff",
                borderRadius: 1,
              }}
            >
              <MenuItem value="LATEST">최신순</MenuItem>
              <MenuItem value="OLDEST">등록순</MenuItem>
              <MenuItem value="VIEW_DESC">조회순</MenuItem>
              <MenuItem value="RECOMMEND_DESC">추천순</MenuItem>
              <MenuItem value="COMMENT_DESC">댓글순</MenuItem>
            </Select>

            <Select
              size="small"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
              sx={{
                width: 90,
                ml: "auto",
                bgcolor: "#fff",
                borderRadius: 1,
              }}
            >
              <MenuItem value={10}>10개</MenuItem>
              <MenuItem value={20}>20개</MenuItem>
              <MenuItem value={50}>50개</MenuItem>
            </Select>
          </Box>
        </Paper>

        {/* 테이블 */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <Table sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: "#f8fafc",
                  "& th": {
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#475569",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                  },
                }}
              >
                <TableCell align="center" sx={{ width: 50 }}>번호</TableCell>
                <TableCell align="center" sx={{ width: 60 }}>상태</TableCell>
                <TableCell align="center" sx={{ width: 60 }}>말머리</TableCell>
                <TableCell align="center">제목</TableCell>
                <TableCell align="center" sx={{ width: 120 }}>작성자</TableCell>
                <TableCell align="center" sx={{ width: 110 }}>작성일</TableCell>
                <TableCell align="center" sx={{ width: 50 }}>조회</TableCell>
                <TableCell align="center" sx={{ width: 50 }}>추천</TableCell>
                <TableCell align="center" sx={{ width: 50 }}>신고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && pageItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    align="center"
                    sx={{
                      py: 8,
                      color: "#94a3b8",
                      fontSize: 15,
                      borderBottom: "none",
                    }}
                  >
                    게시글이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((item) => {
                  const isReported = (item.reportCount ?? 0) > 0;
                  const type = item.boardType;
                  return (
                    <TableRow
                      key={item.id}
                      sx={{
                        "&:hover": { bgcolor: "rgba(255,107,0,0.04)" },
                        transition: "background 0.2s",
                        bgcolor: item.hidden ? "#fafafa" : "transparent",
                        "& td": {
                          py: 1.75,
                          fontSize: 14,
                          color: "#334155",
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                        },
                      }}
                    >
                      <TableCell align="center">{item.id}</TableCell>
                      <TableCell align="center">{statusChip(item)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={type === "NOTICE" ? "공지" : "일반"}
                          sx={{
                            height: 22,
                            fontSize: 11,
                            fontWeight: 600,
                            bgcolor: type === "NOTICE" ? ACCENT : "#64748b",
                            color: "#fff",
                            "& .MuiChip-label": { px: 1 },
                          }}
                        />
                      </TableCell>
                      <TableCell
                        align="left"
                        sx={{
                          pl: 3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: type === "NOTICE" ? 700 : 500,
                        }}
                      >
                        <Box
                          component="span"
                          onClick={() => navigate(`/admin/board/${item.id}`)}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            cursor: "pointer",
                            "&:hover": { color: ACCENT, textDecoration: "underline" },
                          }}
                        >
                          {mediaIcon(item)}
                          {item.hidden ? <VisibilityOffOutlinedIcon sx={{ fontSize: 15, mr: 0.5, color: "#94a3b8" }} /> : null}
                          {isReported ? <FlagOutlinedIcon sx={{ fontSize: 15, mr: 0.5, color: "#dc2626" }} /> : null}
                          {item.title}
                          {item.commentCount > 0 ? (
                            <Typography component="span" sx={{ color: "#94a3b8", ml: 0.5, fontSize: "inherit" }}>
                              [{item.commentCount}]
                            </Typography>
                          ) : null}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{item.authorNickname}</TableCell>
                      <TableCell align="center">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("ko-KR") : "-"}
                      </TableCell>
                      <TableCell align="center">{item.viewCount}</TableCell>
                      <TableCell align="center">{item.recommendCount}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="신고 수">
                          <Box component="span">{item.reportCount ?? 0}</Box>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
            "& .MuiPaginationItem-root": { fontSize: 14 },
            "& .Mui-selected": {
              bgcolor: ACCENT,
              color: "#fff",
              "&:hover": { bgcolor: "#e55f00" },
            },
          }}
        >
          <Pagination
            count={pageItems.length === 0 ? 1 : totalPages}
            page={currentPage}
            disabled={pageItems.length === 0}
            onChange={(_, v) => setPage(v)}
            color="standard"
            shape="rounded"
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
