import { Box, Button, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { formatDateTime } from "../../../common/utils/helperUtil";
import type { AdminCommentNode } from "../api/adminBoardApi";

interface CommentItemProps {
  comment: AdminCommentNode;
  editingId: number | null;
  editingText: string;
  currentUserId?: number;
  onEditStart: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  onSanction: (authorId?: number) => void;
  onEditTextChange: (value: string) => void;
  onEditSave: (id: number) => void;
  onEditCancel: () => void;
  onReplyStart: (id: number) => void;
  children?: ReactNode;
}

export function CommentItem({
  comment,
  editingId,
  editingText,
  currentUserId,
  onEditStart,
  onDelete,
  onSanction,
  onEditTextChange,
  onEditSave,
  onEditCancel,
  onReplyStart,
  children,
}: CommentItemProps) {
  const isEditing = editingId === comment.id;
  const canEdit =
    currentUserId === comment.authorId ||
    currentUserId === comment.userId ||
    currentUserId === undefined;

  return (
    <Box sx={{ py: 1.1, borderBottom: "1px solid #f3f3f3" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontSize: 13, color: "#666", minWidth: 74 }}>
          {comment.authorNickname ?? "익명"}
        </Typography>

        {isEditing ? (
          <Box sx={{ display: "flex", gap: 1, flex: 1, alignItems: "center" }}>
            <TextField
              fullWidth
              size="small"
              value={editingText}
              onChange={(event) => onEditTextChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onEditSave(comment.id);
                }
              }}
            />
            <Button variant="contained" size="small" onClick={() => onEditSave(comment.id)}>
              저장
            </Button>
            <Button variant="outlined" size="small" onClick={onEditCancel}>
              취소
            </Button>
          </Box>
        ) : (
          <Typography
            sx={{
              fontSize: 14,
              flex: 1,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: comment.deleted ? "#999" : "#222",
              fontStyle: comment.deleted ? "italic" : "normal",
            }}
          >
            {comment.deleted ? "삭제된 댓글입니다." : comment.content}
          </Typography>
        )}

        {!isEditing && !comment.deleted ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
            {canEdit ? (
              <Button
                variant="text"
                size="small"
                sx={{ minWidth: 0, px: 0.6 }}
                onClick={() => onEditStart(comment.id, comment.content)}
              >
                수정
              </Button>
            ) : null}
            <Button
              variant="text"
              size="small"
              sx={{ minWidth: 0, px: 0.6, color: "#d32f2f" }}
              onClick={() => onDelete(comment.id)}
            >
              삭제
            </Button>
            <Button
              variant="text"
              size="small"
              sx={{ minWidth: 0, px: 0.6, color: "#7b1fa2" }}
              onClick={() => onSanction(comment.authorId)}
            >
              제재
            </Button>
          </Box>
        ) : null}

        <Typography sx={{ fontSize: 12, color: "#999", minWidth: 150, textAlign: "right" }}>
          {comment.createdAt ? formatDateTime(comment.createdAt) : "-"}
        </Typography>
      </Box>

      {!comment.deleted ? (
        <Button
          variant="text"
          size="small"
          sx={{ ml: 8.5, mt: 0.3, minWidth: 0, px: 0.4, color: "#ff6b00" }}
          onClick={() => onReplyStart(comment.id)}
        >
          답글 달기
        </Button>
      ) : null}

      {children}
    </Box>
  );
}
