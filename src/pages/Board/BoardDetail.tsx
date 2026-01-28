import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button } from "react-bootstrap";

export default function BoardDetail() {
  const navigate = useNavigate();
  const location = useLocation();

  const post = location.state?.post;

  if (!post) {
    return (
      <div className="container mt-5 text-center">
        <p>게시글을 찾을 수 없습니다.</p>
        <Button onClick={() => navigate("/board")}>
          목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="container mt-5" style={{ maxWidth: "900px" }}>
      <Card>
        <Card.Body>
          <h4 className="mb-2">{post.title}</h4>

          <div className="text-muted mb-3">
            {post.author} · {post.date} · 조회 {post.views}
          </div>

          <hr />

          <div style={{ minHeight: "200px" }}>
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="첨부 이미지"
                style={{
                  maxWidth: "100%",
                  marginBottom: "16px",
                }}
              />
            )}

            <div style={{ whiteSpace: "pre-wrap" }}>
              {post.content || "내용 없음"}
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <Button
              variant="secondary"
              onClick={() => navigate("/board")}
            >
              목록으로
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
