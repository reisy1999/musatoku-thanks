import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';

// 投稿データの型を定義
interface Post {
  id: number;
  content: string;
  created_at: string; // ISO 8601形式の文字列
}

// 親コンポーネントから受け取るPropsの型を定義
type TimelineProps = {
  postSuccessTrigger: boolean;
  endpoint: string;
};

// 日付を見やすい形式（例：「5分前」）に変換するヘルパー関数
const formatRelativeTime = (isoString: string): string => {
  const now = new Date();
  const past = new Date(isoString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;

  const days = Math.floor(hours / 24);
  return `${days}日前`;
};


const Timeline: React.FC<TimelineProps> = ({ postSuccessTrigger, endpoint }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<Post[]>(endpoint);
        setPosts(response.data);
        setError(null);
      } catch (err) {
        setError('投稿の読み込みに失敗しました。');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    // postSuccessTriggerまたはendpointが変更されたら、投稿を再取得します
  }, [postSuccessTrigger, endpoint]);

  if (loading && posts.length === 0) {
    return <div className="p-4 text-center text-gray-500">タイムラインを読み込んでいます...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (posts.length === 0) {
    return <div className="p-4 text-center text-gray-500">まだ投稿がありません。最初の感謝を投稿しましょう！</div>;
  }

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        </div>
      ))}
    </div>
  );
};

export default Timeline;