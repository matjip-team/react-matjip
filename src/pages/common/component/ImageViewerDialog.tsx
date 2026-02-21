import { useState } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const DEFAULT_AVATAR = "/images/default-avatar.svg";

interface ImageViewerDialogProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | undefined;
  alt?: string;
}

export default function ImageViewerDialog({
  open,
  onClose,
  imageUrl,
  alt = "사진",
}: ImageViewerDialogProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const displayUrl = imageUrl && !loadFailed ? imageUrl : DEFAULT_AVATAR;

  const handleImageError = () => setLoadFailed(true);
  const handleClose = () => {
    setLoadFailed(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          maxWidth: "90vw",
          maxHeight: "90vh",
          bgcolor: "transparent",
          boxShadow: "none",
        },
      }}
      BackdropProps={{ sx: { bgcolor: "rgba(0,0,0,0.85)" } }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          zIndex: 1,
          color: "#fff",
          bgcolor: "rgba(0,0,0,0.5)",
          "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        <img
          src={displayUrl}
          alt={alt}
          onError={handleImageError}
          style={{
            maxWidth: "85vw",
            maxHeight: "85vh",
            objectFit: "contain",
            display: "block",
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
