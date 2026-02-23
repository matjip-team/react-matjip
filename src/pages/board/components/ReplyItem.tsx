import { Box, Button, TextField, Typography } from "@mui/material";
import { formatDateTime } from "../../common/utils/helperUtil";

export interface ReplyNode {
  id: number;
  authorId?: number;
  authorNickname?: string;
  content: string;
  deleted?: boolean;
  createdAt?: string;
}

interface ReplyItemProps {
  reply: ReplyNode;
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
      <Typography sx={{ fontSize: 13, color: "#999", mt: 0.2 }}>↳</Typography>

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
