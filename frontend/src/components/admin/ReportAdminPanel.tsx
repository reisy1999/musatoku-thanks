import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';

interface AdminReport {
  id: number;
  reported_post_id: number;
  reporter_user_id: number;
  reporter_name?: string | null;
  reason: string;
  reported_at: string;
  post_content?: string | null;
  post_author_id?: number | null;
  post_author_name?: string | null;
  post_created_at?: string | null;
}

const ReportAdminPanel: React.FC = () => {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const resp = await apiClient.get<AdminReport[]>('/admin/reports');
      setReports(resp.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('報告一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="p-4">
      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-500">No reports found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-pre-wrap max-w-xs">{r.reason}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {r.reporter_name ?? 'Unknown'} (ID: {r.reporter_user_id})
                  </td>
                  <td className="px-3 py-2 whitespace-pre-wrap">
                    <div className="text-sm text-gray-800">{r.post_content ?? ''}</div>
                    <div className="text-xs text-gray-500">
                      {r.post_author_name ?? 'Unknown'} (ID: {r.post_author_id ?? '?'}) - {r.post_created_at ? new Date(r.post_created_at).toLocaleString() : ''}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportAdminPanel;
