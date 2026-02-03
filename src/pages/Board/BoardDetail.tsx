import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../common/axios";
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
} from "@mui/material";

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    axios.get(`/api/boards/${id}`).then((res) => {
      setPost(res.data.data);
    });
  }, [id]);

  if (!post) {
    return <div>로딩중...</div>;
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 5 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {post.title}
        </Typography>

        <Typography sx={{ mt: 1, color: "#666", fontSize: 14 }}>
          {post.authorNickname} · {new Date(post.createdAt).toLocaleDateString()}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ whiteSpace: "pre-wrap", minHeight: 200 }}>
          {post.content}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={() => navigate("/board")}>
            목록으로
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
