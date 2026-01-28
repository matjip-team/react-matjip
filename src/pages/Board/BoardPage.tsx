import { useEffect, useState } from "react";
import { Table, Form, Button, Pagination } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";

type SearchType =
  | "TITLE_CONTENT"
  | "TITLE"
  | "CONTENT"
  | "AUTHOR"
  | "COMMENT";

type CategoryType = "ALL" | "공지" | "후기";

function highlightTitle(
  title: string,
  keyword: string,
  style: React.CSSProperties
) {
  if (!keyword || !title.includes(keyword)) return title;

  const parts = title.split(keyword);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span style={style}>{keyword}</span>}
        </span>
      ))}
    </>
  );
}

export default function Boardpage() {
  const navigate = useNavigate();
  const location = useLocation();
  const MAIN_COLOR = "#ff6b00";

  const initialPosts = [
    {
      id: 34562,
      type: "공지",
      title: "맛집 이용 가이드 안내",
      content: "게시판 이용 방법 안내",
      author: "관리자",
      date: "25.09.29",
      views: 9995,
      likes: 6,
      comments: ["확인했습니다", "공지 감사합니다"],
    },
    {
      id: 35629,
      type: "후기",
      title: "강남역 파스타 맛집 추천",
      content: "분위기 좋은 파스타집",
      author: "맛집헌터",
      date: "25.10.16",
      views: 253,
      likes: 2,
      comments: ["여기 맛있어요"],
    },
    {
      id: 37949,
      type: "후기",
      title: "ㅎㅎ 혼밥하기 좋은 곳",
      content: "조용해서 혼밥하기 좋아요",
      author: "혼밥러",
      date: "25.12.14",
      views: 8701,
      likes: 7,
      comments: ["공감합니다", "혼밥 최고"],
    },
  ];

  const [posts, setPosts] = useState(initialPosts);

  /** ✅ 카테고리 필터 상태 */
  const [category, setCategory] = useState<CategoryType>("ALL");

  /** 검색 입력/옵션 */
  const [keyword, setKeyword] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("TITLE_CONTENT");

  /** ✅ 실제 적용되는 검색 조건 (버튼/엔터 눌렀을 때만) */
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedSearchType, setAppliedSearchType] =
    useState<SearchType>("TITLE_CONTENT");

  /** 🔍 검색 실행 */
  const handleSearch = () => {
    const trimmed = keyword.trim();

    if (!trimmed) {
      alert("검색어를 입력하세요");
      return;
    }

    setAppliedKeyword(trimmed);
    setAppliedSearchType(searchType);
  };

  /** ✅ 카테고리 버튼: 언제라도 해당 목록이 뜨도록 */
  const handleCategoryClick = (next: CategoryType) => {
    setCategory(next);

    // ✅ 버튼 누르면 “그 카테고리 목록”이 확실히 보이게 검색은 초기화
    setKeyword("");
    setAppliedKeyword("");
    setSearchType("TITLE_CONTENT");
    setAppliedSearchType("TITLE_CONTENT");
  };

  /** 새 글 추가 */
  useEffect(() => {
    if (location.state?.newPost) {
      setPosts((prev) => {
        const exists = prev.some((p) => p.id === location.state.newPost.id);
        return exists ? prev : [location.state.newPost, ...prev];
      });
    }
  }, [location.state]);

  /** ✅ 카테고리 + 검색 필터링 */
  const filteredPosts = posts.filter((post) => {
    // 1) 카테고리 필터
    if (category !== "ALL" && post.type !== category) return false;

    // 2) 검색 필터 (적용된 키워드 없으면 통과)
    if (!appliedKeyword) return true;

    const kw = appliedKeyword;
    const titleMatch = post.title.includes(kw);
    const contentMatch = post.content.includes(kw);
    const authorMatch = post.author.includes(kw);
    const commentMatch = post.comments.some((c) => c.includes(kw));

    switch (appliedSearchType) {
      case "TITLE":
        return titleMatch;
      case "CONTENT":
        return contentMatch;
      case "AUTHOR":
        return authorMatch;
      case "COMMENT":
        return commentMatch;
      case "TITLE_CONTENT":
      default:
        return titleMatch || contentMatch;
    }
  });

  /** 공지 상단 고정 */
  const noticePosts = filteredPosts.filter((p) => p.type === "공지");
  const normalPosts = filteredPosts.filter((p) => p.type !== "공지");
  const sortedPosts = [...noticePosts, ...normalPosts];

  return (
    <div className="container mt-5">
      {/* 제목 + 새글쓰기 */}
      <div className="text-center mb-4">
        <h2 style={{ color: MAIN_COLOR, fontWeight: 700 }}>자유게시판</h2>
        <div className="d-flex justify-content-end">
          <Button
            style={{ backgroundColor: MAIN_COLOR, borderColor: MAIN_COLOR }}
            onClick={() => navigate("/board/write")}
          >
            새글쓰기
          </Button>
        </div>
      </div>

      {/* 검색 */}
      <div className="d-flex justify-content-center gap-2 mb-3">
        <Form.Select
          style={{ maxWidth: "140px" }}
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as SearchType)}
        >
          <option value="TITLE_CONTENT">제목+내용</option>
          <option value="TITLE">제목</option>
          <option value="CONTENT">내용</option>
          <option value="AUTHOR">글쓴이</option>
          <option value="COMMENT">댓글</option>
        </Form.Select>

        <Form.Control
          style={{ maxWidth: "320px" }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="검색어 입력"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />

        <Button
          style={{ backgroundColor: MAIN_COLOR, borderColor: MAIN_COLOR }}
          onClick={handleSearch}
        >
          🔍
        </Button>
      </div>

      {/* ✅ 카테고리 버튼 (gap=1) */}
      <div className="d-flex gap-1 mb-3">
        {[
          { key: "ALL" as CategoryType, label: "전체글" },
          { key: "공지" as CategoryType, label: "공지" },
          { key: "후기" as CategoryType, label: "후기" },
        ].map((b) => {
          const active = category === b.key;
          return (
            <Button
              key={b.key}
              size="sm"
              style={
                active
                  ? { backgroundColor: MAIN_COLOR, borderColor: MAIN_COLOR }
                  : {
                      backgroundColor: "#fff",
                      color: MAIN_COLOR,
                      borderColor: MAIN_COLOR,
                    }
              }
              onClick={() => handleCategoryClick(b.key)}
            >
              {b.label}
            </Button>
          );
        })}
      </div>

      {/* 테이블 */}
      <Table striped bordered hover responsive>
        <thead className="table-light text-center">
          <tr>
            <th>번호</th>
            <th>말머리</th>
            <th>제목</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>조회</th>
            <th>추천</th>
          </tr>
        </thead>

        <tbody className="text-center">
          {sortedPosts.map((post) => {
            const isNotice = post.type === "공지";
            const isTitleMatched =
              appliedKeyword && post.title.includes(appliedKeyword);

            const matchedComments =
              appliedSearchType === "COMMENT"
                ? post.comments.filter((c) => c.includes(appliedKeyword))
                : [];

            return (
              <tr key={post.id}>
                <td>{post.id}</td>

                <td>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: isNotice ? MAIN_COLOR : "#adb5bd",
                    }}
                  >
                    {post.type}
                  </span>
                </td>

                <td className="text-start">
                  <div
                    style={{
                      cursor: "pointer",
                      color: isNotice ? MAIN_COLOR : "#212529",
                      fontWeight: isNotice || isTitleMatched ? 700 : 400,
                    }}
                    onClick={() =>
                      navigate(`/board/${post.id}`, { state: { post } })
                    }
                  >
                    {highlightTitle(post.title, appliedKeyword, {
                      color: MAIN_COLOR,
                      backgroundColor: "#fff3e6",
                      padding: "2px 4px",
                      borderRadius: "4px",
                    })}
                  </div>

                  {matchedComments.length > 0 && (
                    <div className="mt-1">
                      {matchedComments.map((comment, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: "13px",
                            marginLeft: "12px",
                            color: MAIN_COLOR,
                          }}
                        >
                          ㄴ {comment}
                        </div>
                      ))}
                    </div>
                  )}
                </td>

                <td>{post.author}</td>
                <td>{post.date}</td>
                <td>{post.views}</td>
                <td>{post.likes}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <div className="d-flex justify-content-center mt-4">
        <Pagination>
          <Pagination.Prev />
          <Pagination.Item active>1</Pagination.Item>
          <Pagination.Next />
        </Pagination>
      </div>
    </div>
  );
}
