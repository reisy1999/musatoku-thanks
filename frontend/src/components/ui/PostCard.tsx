import React, { useState } from 'react';

interface Post {
  id: number;
  content: string;
  created_at: string;
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
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;

  const days = Math.floor(hours / 24);
  return `${days}日前`;
};

const PostCard: React.FC<PostCardProps> = ({ post, onReport }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="p-4 border-b border-gray-200 hover:bg-gray-50 relative">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-500">
          {formatRelativeTime(post.created_at)}
        </span>
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
    </div>
  );
};

export default PostCard;
