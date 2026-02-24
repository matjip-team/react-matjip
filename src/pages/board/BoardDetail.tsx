import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";
import { formatDateTime } from "../common/utils/helperUtil";

interface CommentNode {
  id: number;
  authorId?: number;
  userId?: number;
  authorNickname?: string;
  content: string;
  deleted?: boolean;
  createdAt?: string;
  children?: CommentNode[];
}

interface BoardPostDetail {
  id: number;
  boardType: "NOTICE" | "REVIEW" | string;
  title: string;
  content: string;
  authorNickname?: string;
  createdAt?: string;
  viewCount: number;
  recommendCount: number;
  commentCount: number;
  recommended?: boolean;
  imageUrl?: string;
  authorId?: number;
}

interface HttpErrorLike {
  response?: {
    status?: number;
  };
}

export default function BoardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const ACCENT = "#ff6b00";

  const [post, setPost] = useState<BoardPostDetail | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);

  const [sortType, setSortType] = useState<"created" | "latest">("latest");
  const [recommended, setRecommended] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const [loadingPost, setLoadingPost] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [toast, setToast] = useState("");

  const fetchPost = async () => {
    if (!id) return;

    try {
      setLoadingPost(true);
      const res = await axios.get(`/api/spring/boards/${id}`);
      const data = res.data?.data as BoardPostDetail;
      setPost(data);
      setRecommended(Boolean(data?.recommended));
    } catch {
      setToast("게시글 정보를 불러오지 못했습니다.");
    } finally {
      setLoadingPost(false);
    }
  };

  const fetchComments = async () => {
    if (!id) return;

    try {
      setLoadingComments(true);
      const res = await axios.get(`/api/spring/boards/${id}/comments`, {
        params: { sort: sortType },
      });
      setComments((res.data?.data as CommentNode[]) ?? []);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    void fetchPost();
    void fetchComments();
  }, [id, sortType]);

  useEffect(() => {
    setReportSubmitted(false);
  }, [id]);

  const canEditComment = (node: CommentNode) => {
    if (!user) return false;
    if (user.role === "ROLE_ADMIN") return true;

    const ownerId = node.authorId ?? node.userId;
    if (ownerId != null && user.id === ownerId) return true;
    if (node.authorNickname && user.nickname === node.authorNickname) return true;

    return false;
  };

  const handleRecommend = async () => {
    if (!id) return;

    try {
      await axios.post(`/api/spring/boards/${id}/recommendations`);
      const res = await axios.get(`/api/spring/boards/${id}`);
      const data = res.data?.data as BoardPostDetail;
      setPost(data);
      setRecommended(Boolean(data?.recommended));
      setToast(data?.recommended ? "추천했습니다." : "추천을 취소했습니다.");
    } catch (e: unknown) {
      const status = (e as HttpErrorLike)?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("추천 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("링크가 복사되었습니다.");
    } catch {
      setToast("링크 복사에 실패했습니다.");
    }
  };

  const handleReport = async () => {
    if (!id) return;

    if (reportSubmitted) {
      setToast("이미 신고한 게시글입니다.");
      return;
    }

    if (!user) {
      setToast("로그인이 필요합니다.");
      return;
    }

    const reason = window.prompt("신고 사유를 입력해주세요.");
    if (!reason || !reason.trim()) return;

    try {
      await axios.post(`/api/spring/boards/${id}/reports`, { reason: reason.trim() });
      setReportSubmitted(true);
      setToast("신고가 접수되었습니다.");
    } catch (e: unknown) {
      const status = (e as HttpErrorLike)?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else if (status === 409) {
        setReportSubmitted(true);
        setToast("이미 신고한 게시글입니다.");
      } else {
        setToast("신고 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await axios.delete(`/api/spring/boards/${id}`);
      setToast("게시글을 삭제했습니다.");
      navigate("/board");
    } catch {
      setToast("삭제 권한이 없습니다.");
    }
  };

  const submitComment = async () => {
    if (!id) return;
    if (!newComment.trim()) {
      setToast("댓글을 입력해 주세요.");
      return;
    }

    try {
      setLoadingSubmit(true);
      await axios.post(`/api/spring/boards/${id}/comments`, { content: newComment });
      setNewComment("");
      await fetchComments();
      await fetchPost();
      setToast("댓글을 등록했습니다.");
    } catch (e: unknown) {
      const status = (e as HttpErrorLike)?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("댓글 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  const submitReply = async (parentId: number, content: string) => {
    if (!id) return;
    if (!content.trim()) {
      setToast("답글을 입력해 주세요.");
      return;
    }

    try {
      setLoadingSubmit(true);
      await axios.post(`/api/spring/boards/${id}/comments`, { content, parentId });
      setReplyText("");
      setReplyTo(null);
      await fetchComments();
      await fetchPost();
      setToast("답글을 등록했습니다.");
    } catch (e: unknown) {
      const status = (e as HttpErrorLike)?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("답글 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  const updateComment = async (commentId: number) => {
    if (!id) return;
    if (!editingText.trim()) {
      setToast("내용을 입력해 주세요.");
      return;
    }

    try {
      setLoadingSubmit(true);
      await axios.put(`/api/spring/boards/${id}/comments/${commentId}`, { content: editingText });
      setEditingId(null);
      setEditingText("");
      await fetchComments();
      await fetchPost();
      setToast("댓글을 수정했습니다.");
    } catch (e: unknown) {
      const status = (e as HttpErrorLike)?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("댓글 수정 중 오류가 발생했습니다.");
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!id) return;
    if (!window.confirm("댓글을 삭제할까요?")) return;

    try {
      setLoadingSubmit(true);
      await axios.delete(`/api/spring/boards/${id}/comments/${commentId}`);
      await fetchComments();
      await fetchPost();
      setToast("댓글을 삭제했습니다.");
    } catch (e: unknown) {
      const status = (e as HttpErrorLike)?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("댓글 삭제 중 오류가 발생했습니다.");
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  const renderActionButtons = () => (
    <Box
      sx={{
        position: "absolute",
        top: 8,
        right: 8,
        display: "flex",
        gap: 0.6,
      }}
    >
      <Typography
        sx={{
          cursor: "pointer",
          fontSize: 14,
          px: 1,
          py: 0.5,
          borderRadius: 1.5,
          backgroundColor: recommended ? "rgba(255,107,0,0.15)" : "#f8fafc",
          color: recommended ? ACCENT : "#64748b",
          "&:hover": {
            backgroundColor: recommended ? "rgba(255,107,0,0.2)" : "#f1f5f9",
          },
        }}
        onClick={() => void handleRecommend()}
      >
        {recommended ? "👍 추천됨" : "👍 추천"}
      </Typography>

      <Typography
        sx={{
          cursor: "pointer",
          fontSize: 14,
          px: 1,
          py: 0.5,
          borderRadius: 1.5,
          backgroundColor: "#f8fafc",
          color: "#64748b",
          "&:hover": { backgroundColor: "#f1f5f9" },
        }}
        onClick={() => void handleShare()}
      >
        🔗 공유
      </Typography>

      <Typography
        sx={{
          cursor: reportSubmitted ? "default" : "pointer",
          fontSize: 14,
          px: 1,
          py: 0.5,
          borderRadius: 1.5,
          color: reportSubmitted ? "#94a3b8" : "#64748b",
          backgroundColor: reportSubmitted ? "#f1f5f9" : "#f8fafc",
          "&:hover": {
            backgroundColor: reportSubmitted ? "#f1f5f9" : "#fdecea",
          },
        }}
        onClick={reportSubmitted ? undefined : () => void handleReport()}
      >
        {reportSubmitted ? "🚨 신고완료" : "🚨 신고"}
      </Typography>
    </Box>
  );

  if (loadingPost && !post) {
    return (
      <Box sx={{ textAlign: "center", py: 10, color: "#64748b" }}>
        로딩중...
      </Box>
    );
  }

  if (!post) {
    return (
      <Box sx={{ textAlign: "center", py: 10, color: "#64748b" }}>
        게시글이 없습니다.
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 1100,
        mx: "auto",
        py: 5,
        px: { xs: 2, sm: 3 },
      }}
    >
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
        {renderActionButtons()}

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <span>
            [{post.boardType === "NOTICE" ? "공지" : "일반"}] {post.title}
          </span>
          <Typography component="span" sx={{ fontSize: 15, color: "#64748b" }}>
            {post.commentCount > 0 && `[${post.commentCount}]`}
          </Typography>
        </Typography>

        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "space-between",
            color: "#64748b",
          }}
        >
          <Typography sx={{ fontSize: 12 }}>
            {post.authorNickname} |{" "}
            {post.createdAt ? formatDateTime(post.createdAt) : "-"}
          </Typography>
          <Typography sx={{ fontSize: 12 }}>
            조회 {post.viewCount} | 추천 {post.recommendCount}
          </Typography>
        </Box>

        <Divider sx={{ my: 2, borderColor: "rgba(0,0,0,0.06)" }} />

        <Box
          sx={{
            fontSize: 15,
            lineHeight: 1.7,
            minHeight: 200,
            "& img": { maxWidth: "100%" },
            "& a": { color: ACCENT },
          }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <Divider sx={{ my: 3, borderColor: "rgba(0,0,0,0.06)" }} />

        <Box sx={{ mt: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography sx={{ fontSize: 13 }}>전체 댓글 {post.commentCount ?? 0}개</Typography>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Typography
                sx={{
                  fontSize: 13,
                  cursor: "pointer",
                  color: sortType === "created" ? ACCENT : "#94a3b8",
                }}
                onClick={() => setSortType("created")}
              >
                ✓ 등록순
              </Typography>

              <Typography
                sx={{
                  fontSize: 13,
                  cursor: "pointer",
                  color: sortType === "latest" ? ACCENT : "#94a3b8",
                }}
                onClick={() => setSortType("latest")}
              >
                ✓ 최신순
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2, borderColor: "rgba(0,0,0,0.06)" }} />

          {user && (
            <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={6}
                size="small"
                placeholder="댓글을 입력하세요"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submitComment();
                  }
                }}
                disabled={loadingSubmit}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: ACCENT,
                      borderWidth: 2,
                    },
                  },
                  "& textarea": { fontSize: 14 },
                }}
              />
              <Button
                variant="contained"
                sx={{
                  bgcolor: ACCENT,
                  whiteSpace: "nowrap",
                  height: 40,
                  fontSize: 14,
                  px: 2,
                  borderRadius: 1.5,
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#e55f00" },
                }}
                onClick={() => void submitComment()}
                disabled={loadingSubmit}
              >
                {loadingSubmit ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "등록"
                )}
              </Button>
            </Box>
          )}

          {loadingComments ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : comments.length === 0 ? (
            <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
              아직 댓글이 없습니다.
            </Typography>
          ) : (
            comments.map((c) => (
              <Box key={c.id} sx={{ py: 1.2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: 13, color: "#666", minWidth: 70 }}>
                    {c.authorNickname ?? "익명"}
                  </Typography>

                  {editingId === c.id ? (
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                        maxRows={6}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void updateComment(c.id);
                          }
                        }}
                        sx={{ "& .MuiInputBase-root": { width: 630, fontSize: 13 } }}
                      />
                      <Button
                        variant="contained"
                        sx={{
                          bgcolor: ACCENT,
                          height: 36,
                          fontSize: 13,
                          borderRadius: 1.5,
                          fontWeight: 600,
                          "&:hover": { bgcolor: "#e55f00" },
                        }}
                        onClick={() => void updateComment(c.id)}
                      >
                        저장
                      </Button>
                      <Button
                        variant="outlined"
                        sx={{
                          height: 32,
                          fontSize: 12,
                          borderColor: "#cbd5e1",
                          color: "#64748b",
                        }}
                        onClick={() => {
                          setEditingId(null);
                          setEditingText("");
                        }}
                      >
                        취소
                      </Button>
                    </Box>
                  ) : (
                    <Typography
                      sx={{
                        fontSize: 13,
                        flex: 1,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        color: c.deleted ? "#aaa" : "#000",
                        fontStyle: c.deleted ? "italic" : "normal",
                      }}
                    >
                      {c.deleted ? "삭제된 댓글입니다." : c.content}
                    </Typography>
                  )}

                  {editingId !== c.id && !c.deleted && (
                    <>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
                        {canEditComment(c) && (
                          <>
                            <Button
                              variant="text"
                              size="small"
                              sx={{ minWidth: 0, fontSize: 12, color: "#666" }}
                              onClick={() => {
                                setEditingId(c.id);
                                setEditingText(c.content);
                              }}
                            >
                              수정
                            </Button>
                            <Button
                              variant="text"
                              size="small"
                              sx={{ minWidth: 0, fontSize: 12, color: "#d32f2f" }}
                              onClick={() => void deleteComment(c.id)}
                            >
                              삭제
                            </Button>
                          </>
                        )}
                      </Box>

                      <Typography sx={{ fontSize: 12, color: "#999" }}>
                        {c.createdAt ? formatDateTime(c.createdAt) : "-"}
                      </Typography>
                    </>
                  )}
                </Box>

                {user && (
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: ACCENT,
                      cursor: "pointer",
                      mt: 0.6,
                      width: "fit-content",
                      ml: 1,
                    }}
                    onClick={() => {
                      setReplyTo(c.id);
                      setReplyText("");
                    }}
                  >
                    답글 달기
                  </Typography>
                )}

                {replyTo === c.id && (
                  <Box sx={{ display: "flex", gap: 1, mt: 1, ml: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      maxRows={6}
                      placeholder="답글을 입력하세요"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void submitReply(c.id, replyText);
                        }
                      }}
                      sx={{ "& .MuiInputBase-root": { fontSize: 13 } }}
                    />
                    <Button
                      variant="contained"
                      sx={{
                        bgcolor: ACCENT,
                        whiteSpace: "nowrap",
                        height: 36,
                        fontSize: 13,
                        borderRadius: 1.5,
                        fontWeight: 600,
                        "&:hover": { bgcolor: "#e55f00" },
                      }}
                      onClick={() => void submitReply(c.id, replyText)}
                    >
                      등록
                    </Button>
                    <Button
                      variant="text"
                      sx={{
                        color: "#64748b",
                        whiteSpace: "nowrap",
                        backgroundColor: "#f1f5f9",
                        height: 32,
                        fontSize: 12,
                      }}
                      onClick={() => setReplyTo(null)}
                    >
                      취소
                    </Button>
                  </Box>
                )}

                {Array.isArray(c.children) && c.children.length > 0 && (
                  <Box sx={{ mt: 1, ml: 4 }}>
                    {c.children.map((r) => (
                      <Box key={r.id} sx={{ mt: 1, display: "flex", gap: 1, alignItems: "flex-start" }}>
                        <Typography sx={{ fontSize: 13, color: "#999", mt: 0.2 }}>↳</Typography>

                        <Box
                          sx={{
                            flex: 1,
                            p: 1,
                            py: 0.4,
                            borderRadius: 1,
                            backgroundColor: "#f8fafc",
                            border: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              width: "100%",
                            }}
                          >
                            <Typography sx={{ fontSize: 13, color: "#666", minWidth: 70 }}>
                              {r.authorNickname ?? "익명"}
                            </Typography>

                            {editingId === r.id ? (
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <TextField
                                  size="small"
                                  multiline
                                  minRows={2}
                                  maxRows={6}
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      void updateComment(r.id);
                                    }
                                  }}
                                  sx={{ "& .MuiInputBase-root": { width: 500, fontSize: 13 } }}
                                />
                                <Button
                                  variant="contained"
                                  sx={{
                                    bgcolor: ACCENT,
                                    height: 36,
                                    fontSize: 13,
                                    borderRadius: 1.5,
                                    fontWeight: 600,
                                    "&:hover": { bgcolor: "#e55f00" },
                                  }}
                                  onClick={() => void updateComment(r.id)}
                                >
                                  저장
                                </Button>
                                <Button
                                  variant="outlined"
                                  sx={{ height: 32, fontSize: 12, borderColor: "#cbd5e1", color: "#64748b" }}
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditingText("");
                                  }}
                                >
                                  취소
                                </Button>
                              </Box>
                            ) : (
                              <Typography
                                sx={{
                                  fontSize: 13,
                                  flex: 1,
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                  color: r.deleted ? "#aaa" : "#000",
                                  fontStyle: r.deleted ? "italic" : "normal",
                                }}
                              >
                                {r.deleted ? "삭제된 댓글입니다." : r.content}
                              </Typography>
                            )}

                            {editingId !== r.id && !r.deleted && (
                              <>
                                <Box sx={{ display: "flex" }}>
                                  {canEditComment(r) && (
                                    <>
                                      <Button
                                        variant="text"
                                        size="small"
                                        sx={{ minWidth: 0, fontSize: 12, color: "#666" }}
                                        onClick={() => {
                                          setEditingId(r.id);
                                          setEditingText(r.content);
                                        }}
                                      >
                                        수정
                                      </Button>

                                      <Button
                                        variant="text"
                                        size="small"
                                        sx={{ minWidth: 0, fontSize: 12, color: "#d32f2f" }}
                                        onClick={() => void deleteComment(r.id)}
                                      >
                                        삭제
                                      </Button>
                                    </>
                                  )}
                                </Box>
                                <Typography sx={{ fontSize: 12, color: "#999" }}>
                                  {r.createdAt ? formatDateTime(r.createdAt) : "-"}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                <Divider sx={{ mt: 1.5 }} />
              </Box>
            ))
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            mt: 4,
          }}
        >
          {user && (user.id === post.authorId || user.role === "ROLE_ADMIN") && (
            <>
              <Button
                variant="contained"
                sx={{
                  height: 40,
                  fontSize: 14,
                  borderRadius: 1.5,
                  fontWeight: 600,
                  bgcolor: ACCENT,
                  "&:hover": { bgcolor: "#e55f00" },
                }}
                onClick={() => navigate(`/board/edit/${id}`)}
              >
                수정
              </Button>
              <Button
                variant="outlined"
                color="error"
                sx={{
                  height: 40,
                  fontSize: 14,
                  borderRadius: 1.5,
                  fontWeight: 600,
                }}
                onClick={() => void handleDelete()}
              >
                삭제
              </Button>
            </>
          )}

          <Button
            variant="outlined"
            sx={{
              height: 40,
              fontSize: 14,
              borderRadius: 1.5,
              fontWeight: 600,
              borderColor: "rgba(0,0,0,0.2)",
              color: "#64748b",
              "&:hover": {
                borderColor: ACCENT,
                color: ACCENT,
                bgcolor: "rgba(255,107,0,0.04)",
              },
            }}
            onClick={() => navigate("/board")}
          >
            목록으로
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={1500}
        message={toast}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
