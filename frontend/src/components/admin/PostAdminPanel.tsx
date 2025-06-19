import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';
import ReportCard, { Report } from './ReportCard';

interface AdminPost {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
  department_name?: string | null;
  mention_user_ids: number[];
  reports: Report[];
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
      const [postResp, reportResp] = await Promise.all([
        apiClient.get<AdminPost[]>(endpoint),
        apiClient.get<any[]>('/admin/reports'),
      ]);
      const reportsByPost: Record<number, Report[]> = {};
      reportResp.data.forEach((r: any) => {
        if (!reportsByPost[r.reported_post_id]) reportsByPost[r.reported_post_id] = [];
        reportsByPost[r.reported_post_id].push({
          id: r.id,
          reporter_name: r.reporter_name,
          reason: r.reason,
          status: r.status,
        });
      });
      const combined = postResp.data.map((p: any) => ({
        ...p,
        reports: reportsByPost[p.id] || [],
      })).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setPosts(combined);
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
    reportId: number,
    status: 'deleted' | 'ignored',
    postId: number,
  ) => {
    const confirmMsg =
      status === 'deleted' ? 'この投稿を削除しますか?' : 'この報告を無視しますか?';
    if (!window.confirm(confirmMsg)) return;
    try {
      await apiClient.patch(`/admin/reports/${reportId}`, { status });
      setPosts((prev) => {
        let next = prev.map((p) => {
          if (p.id !== postId) return p;
          const updatedReports = p.reports.map((r) =>
            r.id === reportId ? { ...r, status } : r,
          );
          return { ...p, reports: updatedReports };
        });
        if (status === 'deleted' && !showDeleted) {
          next = next.filter((p) => p.id !== postId);
        }
        return next;
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
              {post.reports.length > 0 ? (
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs">Reported</span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">Unreported</span>
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
                  <ReportCard
                    report={r}
                    readOnly={showDeleted}
                    onDelete={() => updateStatus(r.id, 'deleted', post.id)}
                    onIgnore={() => updateStatus(r.id, 'ignored', post.id)}
                  />
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
