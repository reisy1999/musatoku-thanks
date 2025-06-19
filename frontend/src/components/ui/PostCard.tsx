import React, { useState } from "react";
import apiClient from "../../services/api";

interface Post {
  id: number;
  content: string;
  created_at: string;
  mention_user_names?: string[];
  mention_department_names?: string[];
  like_count?: number;
  liked_by_me?: boolean;
}

type PostCardProps = {
  post: Post;
  onReport: (post: Post) => void;
};

const formatRelativeTime = (isoString: string): string => {
  const now = new Date();
  const past = new Date(isoString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;

  const days = Math.floor(hours / 24);
  return `${days}日前`;
};

const PostCard: React.FC<PostCardProps> = ({ post, onReport }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [liked, setLiked] = useState(post.liked_by_me ?? false);
  const [count, setCount] = useState(post.like_count ?? 0);

  const toggleLike = async () => {
    try {
      if (!liked) {
        setLiked(true);
        setCount((c) => c + 1);
        await apiClient.post(`/posts/${post.id}/like`);
      } else {
        setLiked(false);
        setCount((c) => c - 1);
        await apiClient.delete(`/posts/${post.id}/like`);
      }
    } catch (err) {
      console.error(err);
      setLiked((l) => !l);
      setCount((c) => (liked ? c + 1 : c - 1));
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 hover:bg-gray-50 relative">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{formatRelativeTime(post.created_at)}</span>
          {(post.mention_user_names?.length || 0) +
            (post.mention_department_names?.length || 0) >
            0 && (
            <span className="text-xs text-gray-500">
              {post.mention_user_names?.map((n) => `@${n}`).join(" ")}{" "}
              {post.mention_department_names?.map((n) => `@${n}`).join(" ")}
            </span>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="px-2 text-gray-500 hover:text-gray-700"
          >
            &#8230;
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded shadow-md z-10">
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  setMenuOpen(false);
                  onReport(post);
                }}
              >
                Report this post
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
      <div className="flex justify-end items-center mt-2">
        <button
          onClick={toggleLike}
          title={liked ? "取り消す" : "いいね！"}
          className={`transition-transform ${liked ? "text-red-500" : "text-gray-400"} hover:scale-110`}
        >
          {liked ? "❤" : "♡"}
        </button>
        <span className="ml-1 text-sm text-gray-600">{count}</span>
      </div>
    </div>
  );
};

export default PostCard;
