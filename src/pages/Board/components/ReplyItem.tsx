// 대댓글 렌더링 컴포넌트
import { Box, Button, TextField, Typography } from "@mui/material";
import { formatDateTime } from "../../common/utils/helperUtil";

interface ReplyItemProps {
  reply: any; // 대댓글 객체
  currentUserId?: number; // 현재 로그인 사용자 ID
  postAuthorId: number; // 게시글 작성자 ID
  editingId: number | null;
  editingText: string;
  MAIN_COLOR: string;
  
  // 핸들러 함수들
  onEditClick: (id: number, content: string) => void;
  onDeleteClick: (id: number) => void;
  onEditingTextChange: (text: string) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
}

export const ReplyItem = ({
  reply: r,
  currentUserId,
  editingId,
  editingText,
  MAIN_COLOR,
  onEditClick,
  onDeleteClick,
  onEditingTextChange,
  onSaveEdit,
  onCancelEdit,
}: ReplyItemProps) => {
  const isEditing = editingId === r.id;
  const isAuthor = currentUserId === r.authorId;

  return (
    <Box
      key={r.id}
      sx={{
        mt: 1,
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
      }}
    >
      {/* ↳ 표시 (대댓글 시작) */}
      <Typography sx={{ fontSize: 13, color: "#999", mt: 0.2 }}>↳</Typography>

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

          {isEditing ? (
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                multiline
                minRows={2}
                maxRows={6}
                value={editingText}
                onChange={(e) => onEditingTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSaveEdit(r.id);
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
                onClick={() => onSaveEdit(r.id)}
              >
                저장
              </Button>
              <Button
                variant="outlined"
                sx={{ height: 32, fontSize: 12 }}
                onClick={onCancelEdit}
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

          {!isEditing && !r.deleted && (
            <>
              <Box sx={{ display: "flex" }}>
                {isAuthor && (
                  <>
                    <Button
                      variant="text"
                      size="small"
                      sx={{ minWidth: 0, fontSize: 12, color: "#666" }}
                      onClick={() => onEditClick(r.id, r.content)}
                    >
                      수정
                    </Button>

                    <Button
                      variant="text"
                      size="small"
                      sx={{ minWidth: 0, fontSize: 12, color: "#d32f2f" }}
                      onClick={() => onDeleteClick(r.id)}
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
  );
};
