import React, { useState, useEffect } from "react";
import apiClient from "../../services/api";
import PostCard from "./PostCard";
import ReportModal from "./ReportModal";

// 投稿データの型を定義
interface Post {
  id: number;
  content: string;
  created_at: string; // ISO 8601形式の文字列
  mention_user_names?: string[];
  mention_department_names?: string[];
  like_count?: number;
  liked_by_me?: boolean;
}

// 親コンポーネントから受け取るPropsの型を定義
type TimelineProps = {
  postSuccessTrigger: boolean;
  endpoint: string;
};

const Timeline: React.FC<TimelineProps> = ({
  postSuccessTrigger,
  endpoint,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportPost, setReportPost] = useState<Post | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<any[]>(endpoint);
        const mapped = response.data.map((p) => ({
          ...p,
          mention_user_names:
            Array.isArray(p.mention_user_names) && p.mention_user_names.length > 0
              ? p.mention_user_names
              : p.mention_users?.map((u: any) => u.name).filter(Boolean) ?? [],
          mention_department_names:
            Array.isArray(p.mention_department_names) &&
            p.mention_department_names.length > 0
              ? p.mention_department_names
              : p.mention_departments?.map((d: any) => d.name).filter(Boolean) ??
                [],
        }));
        setPosts(mapped);
        setError(null);
      } catch (err) {
        setError("投稿の読み込みに失敗しました。");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    // postSuccessTriggerまたはendpointが変更されたら、投稿を再取得します
  }, [postSuccessTrigger, endpoint]);

  if (loading && posts.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        タイムラインを読み込んでいます...
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        まだ投稿がありません。最初の感謝を投稿しましょう！
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onReport={(p) => setReportPost(p)}
        />
      ))}
      {reportPost && (
        <ReportModal post={reportPost} onClose={() => setReportPost(null)} />
      )}
    </div>
  );
};

export default Timeline;
