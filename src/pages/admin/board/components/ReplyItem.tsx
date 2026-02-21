import { Box, Button, TextField, Typography } from "@mui/material";
import { formatDateTime } from "../../../common/utils/helperUtil";
import type { AdminCommentNode } from "../api/adminBoardApi";

interface ReplyItemProps {
  reply: AdminCommentNode;
  editingId: number | null;
  editingText: string;
  currentUserId?: number;
  onEditStart: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  onSanction: (authorId?: number) => void;
  onEditTextChange: (value: string) => void;
  onEditSave: (id: number) => void;
  onEditCancel: () => void;
}

export function ReplyItem({
  reply,
  editingId,
  editingText,
  currentUserId,
  onEditStart,
  onDelete,
  onSanction,
  onEditTextChange,
  onEditSave,
  onEditCancel,
}: ReplyItemProps) {
  const isEditing = editingId === reply.id;
  const canEdit =
    currentUserId === reply.authorId ||
    currentUserId === reply.userId ||
    currentUserId === undefined;

  return (
    <Box
      sx={{
        ml: 5,
        mt: 0.8,
        p: 1,
        borderRadius: 1,
        border: "1px solid #f0f0f0",
        bgcolor: "#fafafa",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontSize: 13, color: "#888", minWidth: 66 }}>
          ㄴ {reply.authorNickname ?? "익명"}
        </Typography>

        {isEditing ? (
          <Box sx={{ display: "flex", gap: 1, flex: 1 }}>
            <TextField
              fullWidth
              size="small"
              value={editingText}
              onChange={(event) => onEditTextChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onEditSave(reply.id);
                }
              }}
            />
            <Button variant="contained" size="small" onClick={() => onEditSave(reply.id)}>
              저장
            </Button>
            <Button variant="outlined" size="small" onClick={onEditCancel}>
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
              color: reply.deleted ? "#999" : "#222",
              fontStyle: reply.deleted ? "italic" : "normal",
            }}
          >
            {reply.deleted ? "삭제된 댓글입니다." : reply.content}
          </Typography>
        )}

        {!isEditing && !reply.deleted ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
            {canEdit ? (
              <Button
                variant="text"
                size="small"
                sx={{ minWidth: 0, px: 0.5 }}
                onClick={() => onEditStart(reply.id, reply.content)}
              >
                수정
              </Button>
            ) : null}
            <Button
              variant="text"
              size="small"
              sx={{ minWidth: 0, px: 0.5, color: "#d32f2f" }}
              onClick={() => onDelete(reply.id)}
            >
              삭제
            </Button>
            <Button
              variant="text"
              size="small"
              sx={{ minWidth: 0, px: 0.5, color: "#7b1fa2" }}
              onClick={() => onSanction(reply.authorId)}
            >
              제재
            </Button>
          </Box>
        ) : null}

        <Typography sx={{ fontSize: 12, color: "#999", minWidth: 150, textAlign: "right" }}>
          {reply.createdAt ? formatDateTime(reply.createdAt) : "-"}
        </Typography>
      </Box>
    </Box>
  );
}
