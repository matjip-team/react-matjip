import { Box, Button, TextField, Typography } from "@mui/material";
import { formatDateTime } from "../../common/utils/helperUtil";

export interface BlogCommentNode {
  id: number;
  authorId?: number;
  authorNickname?: string;
  content: string;
  deleted?: boolean;
  createdAt?: string;
}

interface BlogCommentItemProps {
  comment: BlogCommentNode;
  currentUserId?: number;
  postAuthorId: number;
  editingId: number | null;
  editingText: string;
  MAIN_COLOR: string;
  onEditClick: (id: number, content: string) => void;
  onDeleteClick: (id: number) => void;
  onEditingTextChange: (text: string) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  onReplyClick: (id: number) => void;
  onRenderChildren?: (comment: BlogCommentNode) => React.ReactNode;
}

export const BlogCommentItem = ({
  comment: c,
  currentUserId,
  editingId,
  editingText,
  MAIN_COLOR,
  onEditClick,
  onDeleteClick,
  onEditingTextChange,
  onSaveEdit,
  onCancelEdit,
  onReplyClick,
  onRenderChildren,
}: BlogCommentItemProps) => {
  const isEditing = editingId === c.id;
  const isAuthor = currentUserId === c.authorId;

  return (
    <Box sx={{ py: 1.2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontSize: 13, color: "#666", minWidth: 70 }}>
          {c.authorNickname ?? "익명"}
        </Typography>

        {isEditing ? (
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              multiline
              minRows={2}
              maxRows={6}
              value={editingText}
              onChange={(e) => onEditingTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSaveEdit(c.id);
                }
              }}
              sx={{
                "& .MuiInputBase-root": {
                  width: 630,
                  fontSize: 13,
                },
              }}
            />
            <Button
              variant="contained"
              sx={{ bgcolor: MAIN_COLOR, height: 32, fontSize: 12 }}
              onClick={() => onSaveEdit(c.id)}
            >
              저장
            </Button>
            <Button
              variant="outlined"
              sx={{ height: 32, fontSize: 12, borderColor: "#bbb", color: "#666" }}
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
              color: c.deleted ? "#aaa" : "#000",
              fontStyle: c.deleted ? "italic" : "normal",
            }}
          >
            {c.deleted ? "삭제된 댓글입니다." : c.content}
          </Typography>
        )}

        {!isEditing && !c.deleted && (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
              {isAuthor && (
                <>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ minWidth: 0, fontSize: 12, color: "#666" }}
                    onClick={() => onEditClick(c.id, c.content)}
                  >
                    수정
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ minWidth: 0, fontSize: 12, color: "#d32f2f" }}
                    onClick={() => onDeleteClick(c.id)}
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

      {!c.deleted && (
        <Typography
          sx={{
            fontSize: 12,
            color: MAIN_COLOR,
            cursor: "pointer",
            mt: 0.6,
            width: "fit-content",
            ml: 1,
          }}
          onClick={() => onReplyClick(c.id)}
        >
          답글 달기
        </Typography>
      )}

      {onRenderChildren && onRenderChildren(c)}
    </Box>
  );
};
