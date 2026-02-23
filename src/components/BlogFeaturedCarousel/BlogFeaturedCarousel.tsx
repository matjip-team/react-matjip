import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../pages/common/axios";
import "./BlogFeaturedCarousel.css";

interface BlogItem {
  id: number;
  title: string;
  content?: string;
  contentHtml?: string;
  imageUrl?: string | null;
  mediaUrls?: string[] | null;
}

const getThumbnailUrl = (post: BlogItem): string => {
  if (post.imageUrl?.trim()) return post.imageUrl.trim();
  if (post.mediaUrls?.[0]?.trim()) return post.mediaUrls[0].trim();
  const content = post.contentHtml ?? post.content ?? "";
  const match = content.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  return match?.[1] ?? "";
};

export default function BlogFeaturedCarousel() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await axios.get("/api/spring/blogs", {
          params: { page: 0, size: 12, type: null },
        });
        const data = res.data.data;
        const notices = (data.notices ?? []).filter(Boolean);
        const contents = (data.contents ?? []).filter(Boolean);
        const all = [...notices, ...contents] as BlogItem[];
        const withImage = all.filter((p: BlogItem) => getThumbnailUrl(p));
        setBlogs(withImage);
      } catch {
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (blogs.length < 3) return;
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % blogs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [blogs.length]);

  if (loading || blogs.length === 0) return null;

  const getVisibleBlogs = () => {
    const indices = [0, 1, 2].map((i) => (slideIndex + i) % blogs.length);
    return indices.map((idx) => blogs[idx]);
  };

  const visible = getVisibleBlogs();

  return (
    <section className="blog-featured">
      <div className="blog-featured-inner">
        {visible.map((post) => {
          const thumbnailUrl = getThumbnailUrl(post);
          if (!thumbnailUrl) return null;
          return (
            <article
              key={post.id}
              className="blog-featured-item"
              onClick={() => navigate(`/blog/${post.id}`)}
            >
              <div className="blog-featured-bg" style={{ backgroundImage: `url(${thumbnailUrl})` }} />
              <div className="blog-featured-layer" />
              <h3 className="blog-featured-title">{post.title}</h3>
            </article>
          );
        })}
      </div>
      {blogs.length > 3 && (
        <div className="blog-featured-dots">
          {Array.from({ length: Math.ceil(blogs.length / 3) }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`blog-featured-dot ${Math.floor(slideIndex / 3) === i ? "active" : ""}`}
              onClick={() => setSlideIndex(Math.min(i * 3, blogs.length - 3))}
              aria-label={`슬라이드 ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
