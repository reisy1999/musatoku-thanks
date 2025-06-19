import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';
import ReportCard, { Report } from './ReportCard';

const badgeClass = (status: string) => {
  const base = 'px-2 py-0.5 rounded text-xs';
  switch (status) {
    case 'deleted':
      return `${base} bg-red-100 text-red-800`;
    case 'ignored':
      return `${base} bg-blue-100 text-blue-800`;
    case 'pending':
      return `${base} bg-yellow-100 text-yellow-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
};

interface AdminPost {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
  department_name?: string | null;
  mention_user_ids: number[];
  reports: Report[];
  status: 'pending' | 'deleted' | 'ignored';
}

type Props = {
  showDeleted?: boolean;
};

const PostAdminPanel: React.FC<Props> = ({ showDeleted }) => {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [search, setSearch] = useState('');

  const endpoint = showDeleted ? '/admin/posts/deleted' : '/admin/posts';

  const fetchData = async () => {
    try {
      setLoading(true);
      const postResp = await apiClient.get<AdminPost[]>(endpoint);
      const sorted = postResp.data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setPosts(sorted);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('投稿一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [showDeleted]);

  const updateStatus = async (
    post: AdminPost,
    status: 'pending' | 'deleted' | 'ignored',
  ) => {
    const confirmMsg = `ステータスを ${status} に変更しますか?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      if (post.reports.length === 0) return;
      await apiClient.patch(`/admin/reports/${post.reports[0].id}`, { status });
      setPosts((prev) => {
        return prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                status,
                reports: p.reports.map((r) => ({ ...r, status })),
              }
            : p,
        );
      });
    } catch (err) {
      console.error(err);
      alert('ステータスの更新に失敗しました');
    }
  };

  if (loading) return <div className="p-4 text-gray-500">読み込み中...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  const filteredPosts = posts.filter(
    (p) =>
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.reports.some((r) =>
        (r.reporter_name ?? '').toLowerCase().includes(search.toLowerCase()),
      ),
  );

  return (
    <div className="p-4 space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search posts or reporter"
        className="border rounded p-2 w-full mb-2"
      />
      {filteredPosts.length === 0 ? (
        <p className="text-gray-500">No posts found</p>
      ) : (
        filteredPosts.map((post) => (
          <div key={post.id} className="border rounded p-4">
            <div className="text-sm text-gray-600 flex justify-between mb-2">
              <span>{new Date(post.created_at).toLocaleString()}</span>
              <span className="flex items-center space-x-1">
                <span>
                  {post.author_name}
                  {post.department_name ? ` / ${post.department_name}` : ''}
                </span>
                <span className={badgeClass(post.status)}>{post.status}</span>
                {post.reports.length > 0 && (
                  <select
                    className="ml-2 border text-xs"
                    value={post.status}
                    onChange={(e) =>
                      updateStatus(post, e.target.value as 'pending' | 'deleted' | 'ignored')
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="ignored">ignored</option>
                    <option value="deleted">deleted</option>
                  </select>
                )}
              </span>
            </div>
          <p className="whitespace-pre-wrap mb-2">{post.content}</p>
          {post.reports.length === 0 ? (
            <p className="text-sm text-gray-500">No reports submitted</p>
          ) : (
            <div>
              {(expanded[post.id] ? post.reports : [post.reports[0]]).map((r) => (
                <div className="bg-gray-50 p-2 rounded mb-1" key={r.id}>
                  <ReportCard report={r} />
                </div>
              ))}
              {post.reports.length > 1 && (
                <button
                  className="mt-1 text-xs text-blue-600 hover:underline"
                  onClick={() =>
                    setExpanded((e) => ({ ...e, [post.id]: !e[post.id] }))
                  }
                >
                  {expanded[post.id] ? 'Hide reports' : 'Show all reports'}
                </button>
              )}
            </div>
          )}
        </div>
        ))
      )}
    </div>
  );
};

export default PostAdminPanel;
