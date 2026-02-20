import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Pagination,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import axios from "../../common/axios";
import { ADMIN_USER_API } from "./api/adminUserApi";
import type { AdminUserListItem } from "./types/adminUser";
import { API_BASE_URL } from "../../common/config/config";

const MAIN_COLOR = "#4F9FFA";

const toAvatarUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}/images/${url}`;
};

export default function AdminUserListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [searchType, setSearchType] = useState("EMAIL");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(ADMIN_USER_API, {
          params: {
            page,
            size,
            keyword: appliedKeyword || undefined,
            searchType: appliedKeyword ? searchType : undefined,
            status: statusFilter || undefined,
          },
        });
        const data = res.data?.data ?? res.data;
        const content = data?.content ?? data ?? [];
        setItems(Array.isArray(content) ? content : []);
        const total = data?.totalElements ?? 0;
        const pages = (data?.totalPages ?? Math.ceil(total / size)) || 1;
        setTotalPages(Math.max(1, pages));
      } catch {
        setToast("회원 목록 조회에 실패했습니다.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, size, appliedKeyword, searchType, statusFilter]);

  const handleSearch = () => {
    setPage(0);
    setAppliedKeyword(keyword);
  };

  const getRoleLabel = (role: string) => {
    if (role === "ROLE_ADMIN" || role === "ADMIN") return "관리자";
    if (role === "ROLE_USER" || role === "USER") return "일반";
    return role ?? "-";
  };

  const getRoleColor = (role: string) =>
    role === "ROLE_ADMIN" || role === "ADMIN" ? "primary" : "default";

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return "-";
    if (status === "ACTIVE") return "활성";
    if (status === "BLOCKED") return "차단";
    if (status === "DELETED") return "탈퇴";
    return status;
  };

  const getStatusColor = (status: string | undefined): "success" | "warning" | "error" | "default" => {
    if (status === "ACTIVE") return "success";
    if (status === "BLOCKED") return "warning";
    if (status === "DELETED") return "error";
    return "default";
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 5, mb: 4 }}>
      <Typography
        sx={{ fontSize: 28, fontWeight: 700, color: MAIN_COLOR, mb: 3 }}
      >
        회원 관리
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 4, alignItems: "center", flexWrap: "wrap" }}>
        <Select
          size="small"
          value={searchType}
          onChange={(e) => setSearchType(String(e.target.value))}
          sx={{ width: 120 }}
        >
          <MenuItem value="EMAIL">이메일</MenuItem>
          <MenuItem value="NAME">이름</MenuItem>
          <MenuItem value="NICKNAME">닉네임</MenuItem>
        </Select>
        <Select
          size="small"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(String(e.target.value));
            setPage(0);
          }}
          displayEmpty
          sx={{ width: 100 }}
        >
          <MenuItem value="">전체 상태</MenuItem>
          <MenuItem value="ACTIVE">활성</MenuItem>
          <MenuItem value="BLOCKED">차단</MenuItem>
          <MenuItem value="DELETED">탈퇴</MenuItem>
        </Select>
        <TextField
          size="small"
          placeholder="검색어 입력"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          sx={{ width: 280 }}
        />
        <IconButton
          sx={{
            bgcolor: MAIN_COLOR,
            color: "#fff",
            "&:hover": { bgcolor: "#3d8ae6" },
          }}
          onClick={handleSearch}
        >
          <SearchIcon />
        </IconButton>
        <Box sx={{ ml: "auto" }}>
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

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell align="center" sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, width: 72 }}>사진</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>이메일</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>이름</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>닉네임</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                역할
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                상태
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>가입일</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                관리
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  align="center"
                  sx={{ py: 6, color: "#888" }}
                >
                  조회된 회원이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  onClick={() => navigate(`/admin/user/${row.id}`)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#fafafa" },
                  }}
                >
                  <TableCell align="center">{row.id}</TableCell>
                  <TableCell align="center" sx={{ py: 1 }}>
                    <Avatar
                      src={toAvatarUrl(row.profileImageUrl)}
                      sx={{ width: 36, height: 36, fontSize: 14 }}
                    >
                      {row.name?.charAt(0) ?? row.email?.charAt(0) ?? "?"}
                    </Avatar>
                  </TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.nickname}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getRoleLabel(row.role)}
                      size="small"
                      color={getRoleColor(row.role) as "primary" | "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(row.status)}
                      size="small"
                      color={getStatusColor(row.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleDateString("ko-KR")
                      : "-"}
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/admin/user/${row.id}/edit`)}
                      title="수정"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page + 1}
          disabled={loading || items.length === 0}
          onChange={(_, v) => setPage(v - 1)}
          color="primary"
        />
      </Box>

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
