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
  text: string,
  keyword: string,
  style: React.CSSProperties
) {
  if (!keyword || !text) return text;

  const index = text.indexOf(keyword);
  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + keyword.length);
  const after = text.slice(index + keyword.length);

  return (
    <>
      {before}
      <span style={style}>{match}</span>
      {after}
    </>
  );
}

export default function Boardpage() {
  const navigate = useNavigate();
  const location = useLocation();
  const MAIN_COLOR = "#ff6b00";

  const [posts, setPosts] = useState<any[]>([]);
  
  const [category, setCategory] = useState<CategoryType>("ALL");
  const [keyword, setKeyword] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("TITLE_CONTENT");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedSearchType, setAppliedSearchType] =
    useState<SearchType>("TITLE_CONTENT");

    /* ================================
     ✅ 목록 API 연동
  ================================= */
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const typeParam =
          category === "ALL"
            ? ""
            : `?type=${category === "공지" ? "NOTICE" : "REVIEW"}`;

        const res = await fetch(`/api/boards${typeParam}`);
        const json = await res.json();

        if (!json.success) return;

        const mappedPosts = json.data.map((item: any) => ({
          id: item.id,
          type: item.boardType === "NOTICE" ? "공지" : "후기",
          title: item.title,
          content: "",
          author: item.author,
          date: new Date(item.createdAt).toLocaleDateString("ko-KR"),
          views: item.viewCount,
          likes: item.recommendCount,
          comments: [],
        }));

        setPosts(mappedPosts);
      } catch (e) {
        console.error("게시글 목록 조회 실패", e);
      }
    };

    fetchBoards();
  }, [category]);

  /* ================================
     글 작성 후 state 유지 (기존 그대로)
  ================================= */
  useEffect(() => {
    if (location.state?.newPost) {
      setPosts((prev) => {
        const exists = prev.some((p) => p.id === location.state.newPost.id);
        return exists ? prev : [location.state.newPost, ...prev];
      });
    }
  }, [location.state]);

  const handleSearch = () => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      alert("검색어를 입력하세요");
      return;
    }
    setAppliedKeyword(trimmed);
    setAppliedSearchType(searchType);
  };

  const handleCategoryClick = (next: CategoryType) => {
    setCategory(next);
    setKeyword("");
    setAppliedKeyword("");
    setSearchType("TITLE_CONTENT");
    setAppliedSearchType("TITLE_CONTENT");
  };

  useEffect(() => {
    if (location.state?.newPost) {
      setPosts((prev) => {
        const exists = prev.some((p) => p.id === location.state.newPost.id);
        return exists ? prev : [location.state.newPost, ...prev];
      });
    }
  }, [location.state]);

  const filteredPosts = posts.filter((post) => {
    if (category !== "ALL" && post.type !== category) return false;
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

  const noticePosts = filteredPosts.filter((p) => p.type === "공지");
  const normalPosts = filteredPosts.filter((p) => p.type !== "공지");
  const sortedPosts = [...noticePosts, ...normalPosts];

  return (
    <div className="container mt-5">
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

      <div className="d-flex justify-content-center gap-1 mb-3">
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

      <Table
        striped
        bordered
        hover
        responsive={false}
        style={{ tableLayout: "fixed" }}
      >
         <colgroup>
          <col style={{ width: "80px" }} />   {/* 번호 */}
          <col style={{ width: "90px" }} />   {/* 말머리 */}
          <col style={{ width: "360px" }} />  {/* 제목 */}
          <col style={{ width: "120px" }} />  {/* 글쓴이 */}
          <col style={{ width: "120px" }} />  {/* 작성일 */}
          <col style={{ width: "80px" }} />   {/* 조회 */}
          <col style={{ width: "80px" }} />   {/* 추천 */}
        </colgroup>

        <thead className="table-light text-center">
          <tr>
            <th>번호</th>
            <th>말머리</th>
            <th>제목</th>
            <th>글쓴이</th>
            <th>작성일</th>
            <th>조회</th>
            <th>추천</th>
          </tr>
        </thead>

        <tbody className="text-center">
          {sortedPosts.map((post) => {
            const isNotice = post.type === "공지";
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
                      fontWeight: isNotice ? 700 : 400,
                      display: "block",
                      maxWidth: "100%",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    onClick={() =>
                      navigate(`/board/${post.id}`, { state: { post } })
                    }
                  >
                    {(appliedSearchType === "TITLE" ||
                      appliedSearchType === "TITLE_CONTENT") &&
                    appliedKeyword
                      ? highlightTitle(post.title, appliedKeyword, {
                          color: MAIN_COLOR,
                          backgroundColor: "#fff3e6",
                          // padding: "2px 4px", // 하이라이트 시 띄어쓰기 제거 
                          borderRadius: "4px",
                        })
                      : post.title}
                  </div>

                  {appliedSearchType === "COMMENT" &&
                    matchedComments.map((comment, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: "13px",
                          marginLeft: "12px",
                          color: MAIN_COLOR,
                        }}
                      >
                        ㄴ{" "}
                        {highlightTitle(comment, appliedKeyword, {
                          color: MAIN_COLOR,
                          backgroundColor: "#fff3e6",
                          padding: "2px 4px",
                          borderRadius: "4px",
                        })}
                      </div>
                    ))}
                </td>

                <td>
                  {appliedSearchType === "AUTHOR" && appliedKeyword
                    ? highlightTitle(post.author, appliedKeyword, {
                        color: MAIN_COLOR,
                        backgroundColor: "#fff3e6",
                        padding: "2px 4px",
                        borderRadius: "4px",
                      })
                    : post.author}
                </td>

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
