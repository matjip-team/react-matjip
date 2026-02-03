import * as React from "react";
import { Avatar, IconButton } from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";

interface Props {
  imageUrl?: string;
  onChange: (file: File) => void;
  size?: number;
}

export default function AvatarUpload({
  imageUrl,
  onChange,
  size = 100,
}: Props) {
  const [preview, setPreview] = React.useState(imageUrl);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onChange(file);
    }
  };

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <Avatar
        src={preview}
        sx={{ width: size, height: size, fontSize: size / 2 }}
      />
      <IconButton
        component="label"
        sx={{
          position: "absolute",
          bottom: 0,
          right: 0,
          bgcolor: "background.paper",
        }}
      >
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={handleFileChange}
        />
        <PhotoCamera fontSize="small" />
      </IconButton>
    </div>
  );
}
