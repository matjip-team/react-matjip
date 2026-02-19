import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../common/axios";
import { Box, Button, Typography, Paper, Divider, Snackbar, TextField, CircularProgress } from "@mui/material";
import { useAuth } from "../../pages/common/context/useAuth";
import { formatDateTime } from "../common/utils/helperUtil";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.bubble.css";
import "quill-table-better/dist/quill-table-better.css";
import { registerBlogQuillModules } from "./quillSetup";

registerBlogQuillModules(Quill);

export interface User {
  role: string;
}
// 게시글 상세 페이지

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState<any>(null);
  const [toast, setToast] = useState("");
  const [recommended, setRecommended] = useState(false);

  const MAIN_COLOR = "#ff6b00";

  // 로그인사용자 정보  가져오기
  const { user } = useAuth();
  

    // 댓글/대댓글 상태
  const [comments, setComments] = useState<any[]>([]);
  const [sortType, setSortType] = useState<"created" | "latest">("latest");
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const quillRef = useRef<ReactQuill | null>(null);

  
  // 로딩 상태
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const quillReadOnlyModules = useMemo(
    () => ({
      toolbar: false,
    }),
    [],
  );

  const parseContentDelta = (rawDelta: unknown) => {
    if (!rawDelta) return null;
    if (typeof rawDelta === "object") return rawDelta;
    if (typeof rawDelta !== "string") return null;
    try {
      return JSON.parse(rawDelta);
    } catch {
      return null;
    }
  };

  const requireLogin = () => {
    if (!user) {
      setToast("로그인이 필요합니다.");
      return false;
    }
    return true;
  };
    // 액션 핸들러

  const handleRecommend = async () => {
    if (!requireLogin()) return;

    try {
      // 서버 토글
      await axios.post(`/api/blogs/${id}/recommendations`);

      // ✅ 서버가 계산한 최신값으로 다시 덮어쓰기
      const res = await axios.get(`/api/blogs/${id}`);
      const data = res.data.data;

      setPost(data);
      setRecommended(data.recommended);

      setToast(data.recommended ? "추천되었습니다 👍" : "추천이 취소되었습니다.");
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("추천 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("링크가 복사되었습니다!");
  };

  const handleReport = () => {
    alert("신고 클릭!");
  };

// 게시글 삭제 함수
  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await axios.delete(`/api/blogs/${id}`);
      alert("삭제되었습니다.");
      navigate("/blog");
    } catch {
      alert("삭제 권한이 없습니다.");
    }
  };

    // 댓글 API 함수들

  // 댓글 목록 조회
  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await axios.get(`/api/blogs/${id}/comments`, {
        params: {
          sort: sortType,
        },
      });

      const commentsData = res.data.data ?? [];
      console.log("댓글 데이터:", commentsData);
      console.log("로그인 사용자:", user);
      setComments(commentsData);
    } catch {
      // 댓글은 비로그인도 볼 수 있게 할 수도 있어서 alert 안 띄움
      setComments([]);

        // 게시글 삭제 처리
    } finally {
      setLoadingComments(false);
    }
  };


  // 새 댓글 등록
  const submitComment = async () => {
    if (!requireLogin()) return;

    if (!newComment.trim()) {
      setToast("댓글을 입력해주세요.");
      return;
    }

    try {
      setLoadingSubmit(true);
      await axios.post(`/api/blogs/${id}/comments`, {
        content: newComment,
      });

      setNewComment("");
      await fetchComments();
      await fetchPost();
      setToast("댓글이 등록되었습니다.");
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("댓글 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setLoadingSubmit(false);
    }
  };


  // 대댓글 등록
  const submitReply = async (parentId: number, content: string) => {
    if (!requireLogin()) return;

    if (!content.trim()) {
      setToast("답글을 입력해주세요.");
      return;
    }

    try {
      setLoadingSubmit(true);
      await axios.post(`/api/blogs/${id}/comments`, {
        content: content,
        parentId: parentId,
      });

      setReplyText("");
      setReplyTo(null);
      await fetchComments();
      await fetchPost();
      setToast("답글이 등록되었습니다.");
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("답글 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setLoadingSubmit(false);
    }
  };


  // 댓글 수정
  const updateComment = async (commentId: number) => {
    if (!requireLogin()) return;

    if (!editingText.trim()) {
      setToast("내용을 입력해주세요.");
      return;
    }

    try {
      setLoadingSubmit(true);
      await axios.put(`/api/blogs/${id}/comments/${commentId}`, {
        content: editingText,
      });

      setEditingId(null);
      setEditingText("");
      await fetchComments();
      await fetchPost();
      setToast("댓글이 수정되었습니다.");
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("댓글 수정 중 오류가 발생했습니다.");
      }
    } finally {
      setLoadingSubmit(false);
    }
  };


  // 댓글 삭제
  const deleteComment = async (commentId: number) => {
    if (!requireLogin()) return;

    if (!confirm("댓글을 삭제할까요?")) return;

    try {
      setLoadingSubmit(true);
      await axios.delete(`/api/blogs/${id}/comments/${commentId}`);
      await fetchComments();
      await fetchPost();
      setToast("댓글이 삭제되었습니다.");
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("댓글 삭제 중 오류가 발생했습니다.");
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  // 게시글 상세 조회
  const fetchPost = async () => {
    const res = await axios.get(`/api/blogs/${id}`);
    setPost(res.data.data);
    setRecommended(res.data.data.recommended);
  };

    // 우측 상단 액션 렌더

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
          px: 0.6,
          py: 0.1,
          borderRadius: "6px",
          backgroundColor: recommended ? "#ffddb8" : "#f5f5f5",
            "&:hover": { backgroundColor: "#ffe0cc" },
        }}
        onClick={handleRecommend}
      >
       {recommended ? "👍 추천됨" : "👍 추천"}
      </Typography>

      <Typography
        sx={{
          cursor: "pointer",
          fontSize: 14,
          px: 0.6,
          py: 0.1,
          borderRadius: "6px",
          backgroundColor: "#f5f5f5",
          "&:hover": { backgroundColor: "#e3f2fd" },
        }}
        onClick={handleShare}
      >
        🔗 공유
      </Typography>

      <Typography
        sx={{
          cursor: "pointer",
          fontSize: 14,
          px: 0.6,
          py: 0.1,
          borderRadius: "6px",
          backgroundColor: "#f5f5f5",
          "&:hover": { backgroundColor: "#fdecea" },
        }}
        onClick={handleReport}
      >
        🚨 신고
      </Typography>
    </Box>
  );

  // 컴포넌트 마운트 시 게시글과 댓글 조회
  useEffect(() => {
    fetchPost();
  }, [id]);

  useEffect(() => {
    fetchComments();
  }, [id, sortType]);

  useEffect(() => {
    if (!post) return;
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const delta = parseContentDelta(post.contentDelta);
    if (delta) {
      const length = editor.getLength();
      if (length > 0) {
        editor.deleteText(0, length, Quill.sources.SILENT);
      }
      editor.updateContents(delta as any, Quill.sources.API);
      return;
    }
    const html = post.contentHtml || post.content || "";
    editor.setContents([]);
    editor.clipboard.dangerouslyPasteHTML(html);
  }, [post]);

  if (!post) {
    return <Box sx={{ textAlign: "center", mt: 10 }}>로딩중...</Box>;
  }

    // 렌더

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 5 }}>
      <Paper sx={{ p: 3, position: "relative" }}>
        {renderActionButtons()}

        {/* 제목 */}
        <Typography sx={{ fontSize: 25, fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <span>
            [{post.boardType === "NOTICE" ? "공지" : "후기"}] {post.title}
          </span>

          <Typography component="span" sx={{ fontSize: 15, color: "#888" }}>
            {post.commentCount > 0 && `[${post.commentCount}]`}
          </Typography>
        </Typography>

        {/* 작성자 / 날짜 / 조회 */}
        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "space-between",
            color: "#666",
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

        <Divider sx={{ my: 1 }} />

        {/* 이미지 */}
        {false && post.imageUrl && (
          <Box sx={{ my: 3, textAlign: "center" }}>
            <img
              src={post.imageUrl}
              alt="첨부"
              style={{ maxWidth: "100%", maxHeight: 400 }}
            />
          </Box>
        )}

        {/* 본문 */}
        <Box
          sx={{
            fontSize: 15,
            lineHeight: 1.7,
            minHeight: 200,
            "& .ql-toolbar.ql-snow": {
              display: "none",
            },
            "& .ql-container.ql-snow": {
              border: "none",
            },
            "& .ql-editor": {
              padding: 0,
            },
            "& .ql-editor img": {
              maxWidth: "100%",
              height: "auto",
            },
            "& .ql-editor iframe, & .ql-editor video": {
              maxWidth: "100%",
            },
            "& .ql-editor table": {
              width: "100%",
              borderCollapse: "collapse",
              margin: "12px 0",
            },
            "& .ql-editor td, & .ql-editor th": {
              border: "1px solid #d9d9d9",
              padding: "8px 10px",
              verticalAlign: "top",
            },
          }}
        >
          <ReactQuill ref={quillRef} theme="bubble" readOnly modules={quillReadOnlyModules} />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 댓글 영역 */}
        <Box sx={{ mt: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography sx={{ fontSize: 13 }}>
              전체 댓글 {post.commentCount ?? 0}개
            </Typography>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Typography
                sx={{
                  fontSize: 13,
                  cursor: "pointer",
                  color: sortType === "created" ? MAIN_COLOR : "#888",
                }}
                onClick={() => setSortType("created")}
              >
                ✓ 등록순
              </Typography>

              <Typography
                sx={{
                  fontSize: 13,
                  cursor: "pointer",
                  color: sortType === "latest" ? MAIN_COLOR : "#888",
                }}
                onClick={() => setSortType("latest")}
              >
                ✓ 최신순
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 1 }} />

          {/* 댓글 작성 */}
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
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
                  submitComment();
                }
              }}
              disabled={loadingSubmit}
              sx={{
                "& textarea": {
                  fontSize: 13,
                },
              }}
            />
            <Button
              variant="contained"
              sx={{
                bgcolor: MAIN_COLOR,
                whiteSpace: "nowrap",
                height: 32,
                fontSize: 12,
                px: 1.5,
              }}
              onClick={submitComment}
              disabled={loadingSubmit}
            >
              {loadingSubmit ? <CircularProgress size={20} color="inherit" /> : "등록"}
            </Button>
          </Box>

          {/* 댓글 목록 */}
          {loadingComments ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : comments.length === 0 ? (
            <Typography sx={{ color: "#888", fontSize: 13 }}>
              아직 댓글이 없습니다.
            </Typography>
          ) : (
            comments.map((c) => (
              <Box key={c.id} sx={{ py: 1.2 }}>
                {/* 부모 댓글 */}
                <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {/* 작성자 */}
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
                              updateComment(c.id);
                            }
                          }}
                          sx={{
                            "& .MuiInputBase-root": { 
                              width: 630,
                              fontSize: 13 
                            },
                          }}
                        />
                        <Button
                          variant="contained"
                          sx={{ bgcolor: MAIN_COLOR, height: 32, fontSize: 12 }}
                          onClick={() => updateComment(c.id)}
                        >
                          저장
                        </Button>
                        <Button
                          variant="outlined"
                          sx={{ height: 32, fontSize: 12, borderColor: "#bbb", color: "#666" }}
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
                        {user && (user.id === c.authorId || user.id === c.userId || user.nickname === c.authorNickname || user.role === 'ROLE_ADMIN') ? (
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
                              onClick={() => deleteComment(c.id)}
                            >
                              삭제
                            </Button>
                          </>
                        ) : null}
                      </Box>

                      {/* 작성시간 */}
                      <Typography sx={{ fontSize: 12, color: "#999" }}>
                        {c.createdAt ? formatDateTime(c.createdAt) : "-"}
                      </Typography>
                    </>
                    )}
                  </Box>
                  

                  {/* 답글 달기 버튼 */}
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: MAIN_COLOR,
                      cursor: "pointer",
                      mt: 0.6,
                      width: "fit-content",
                      ml: 1,
                    }}
                    onClick={() => {
                      if (!requireLogin()) return;
                      setReplyTo(c.id);
                      setReplyText("");
                    }}
                  >
                    답글 달기
                  </Typography>
                  
                  {/* 대댓글 입력창 */}
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
                            submitReply(c.id, replyText);
                          }
                        }}
                        sx={{
                          "& .MuiInputBase-root": {
                            fontSize: 13,
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        sx={{
                          bgcolor: MAIN_COLOR,
                          whiteSpace: "nowrap",
                          height: 32,
                          fontSize: 12,
                        }}
                        onClick={() => submitReply(c.id, replyText)}
                      >
                        등록
                      </Button>
                      <Button
                        variant="text"
                        sx={{ 
                          color: "#666", 
                          whiteSpace: "nowrap", 
                          backgroundColor: "#f3f3f3",
                          height: 32,
                          fontSize: 12, }}
                        onClick={() => setReplyTo(null)}
                      >
                        취소
                      </Button>
                    </Box>
                  )}

                    {/* 대댓글 목록 */}
                  {Array.isArray(c.children) && c.children.length > 0 && (
                    <Box sx={{ mt: 1, ml: 4 }}>
                      {c.children.map((r: any) => (
                        <Box
                          key={r.id}
                          sx={{
                            mt: 1,
                            display: "flex",
                            gap: 1,
                            alignItems: "flex-start",
                          }}
                        >
                          {/* ↳ 표시 */}
                          <Typography sx={{ fontSize: 13, color: "#999", mt: 0.2 }}>
                            ↳
                          </Typography>

                          {/* 답글 박스 */}
                          <Box
                            sx={{
                              flex: 1,
                              p: 1,
                              py: 0.4,
                              borderRadius: 1,
                              backgroundColor: "#fafafa",
                              border: "1px solid #eee",
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
                              {/* 작성자 */}
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
                                        updateComment(c.id);
                                      }
                                    }}
                                    sx={{
                                      "& .MuiInputBase-root": {
                                        width: 500,
                                        fontSize: 13,
                                      },
                                    }}
                                  />
                                  <Button
                                    variant="contained"
                                    sx={{ bgcolor: MAIN_COLOR, height: 32, fontSize: 12 }}
                                    onClick={() => updateComment(r.id)}
                                  >
                                    저장
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    sx={{ height: 32, fontSize: 12 }}
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
                                    {user && (user.id === r.authorId || user.id === r.userId || user.nickname === r.authorNickname || user.role === 'ROLE_ADMIN') ? (
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
                                          onClick={() => deleteComment(r.id)}
                                        >
                                          삭제
                                        </Button>
                                      </>
                                    ) : null}
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

        {/* 게시글 관련 버튼 */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
          {user && (user.id === post.authorId || user.role === 'ROLE_ADMIN') && ( 
            <>
              <Button
                variant="contained"
                sx={{ 
                  height: 32, 
                  fontSize: 12, 
                }}
                onClick={() => navigate(`/blog/edit/${id}`)}
              >
                수정
              </Button>
              <Button
                variant="contained"
                sx={{ 
                  height: 32, 
                  fontSize: 12, 
                }}
                onClick={handleDelete}
              >
                삭제
              </Button>
            </>
          )}

          <Button
            variant="contained"
            sx={{ 
              bgcolor: MAIN_COLOR, 
              height: 32, 
              fontSize: 12, 
            }}
            onClick={() => navigate("/blog")}
          >
            목록으로
          </Button>
        </Box>
      </Paper>

      {/* 추천 토스트 */}
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
