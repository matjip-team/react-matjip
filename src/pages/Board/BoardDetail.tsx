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
        <Button onClick={() => navigate("/board")}>목록으로</Button>
      </div>
    );
  }

  // 더미 댓글
  const comments = post.comments || [];

  return (
    <div className="container mt-5" style={{ maxWidth: "900px" }}>
      <Card>
        <Card.Body>
          {/* ===== 상단 영역 ===== */}
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h4 className="mt-1 mb-2">[일반]{post.title}</h4>
              <div style={{ fontSize: "13px", color: "#666" }}>
                {post.author} (계정 ID) · {post.date}
              </div>
            </div>

            {/* 우측 통계 */}
            <div style={{ fontSize: "13px", color: "#555" }}>
              조회 {post.views} &nbsp;
              추천 {post.likes} &nbsp;
              댓글 {comments.length}
            </div>
          </div>

          <hr />

          {/* ===== 본문 ===== */}
          <div style={{ minHeight: "200px" }}>
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="첨부 이미지"
                style={{ maxWidth: "100%", marginBottom: "16px" }}
              />
            )}

            <div style={{ whiteSpace: "pre-wrap" }}>
              {post.content || "내용 없음"}
            </div>
          </div>

          {/* ===== 우측 액션 버튼 ===== */}
          <div
            style={{
              position: "absolute",
              right: "-80px",
              top: "200px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <Button size="sm" variant="outline-secondary">
              ⭐ 추천
            </Button>
            <Button size="sm" variant="outline-secondary">
              🔗 공유
            </Button>
          </div>

          <hr />

          {/* ===== 댓글 영역 ===== */}
          <div>
            <div
              className="d-flex justify-content-between mb-2"
              style={{ fontSize: "14px" }}
            >
              <div>전체 댓글 {comments.length}개</div>
              <div style={{ color: "#666" }}>
                ✔ 등록순 &nbsp; | &nbsp; 최신순 &nbsp; | &nbsp; 답글순
              </div>
            </div>

            {/* 댓글 리스트 */}
            <div>
              {comments.length === 0 ? (
                <div style={{ fontSize: "14px", color: "#888" }}>
                  댓글이 없습니다.
                </div>
              ) : (
                comments.map((c: string, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: "12px 0",
                      borderTop: "1px solid #eee",
                      fontSize: "14px",
                    }}
                  >
                    <div style={{ fontSize: "13px", color: "#555" }}>
                      {post.author}
                    </div>
                    <div style={{ marginTop: "4px" }}>{c}</div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999",
                        marginTop: "4px",
                      }}
                    >
                      {post.date}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ===== 하단 버튼 ===== */}
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
