import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';

interface AdminUser {
  id: number;
  display_name: string;
  appreciated_count: number;
  expressed_count: number;
  likes_received: number;
}

const TopUsersPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appreciated, setAppreciated] = useState<AdminUser[]>([]);
  const [expressed, setExpressed] = useState<AdminUser[]>([]);
  const [liked, setLiked] = useState<AdminUser[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [a, e, l] = await Promise.all([
        apiClient.get<AdminUser[]>('/admin/users/top/appreciated'),
        apiClient.get<AdminUser[]>('/admin/users/top/expressed'),
        apiClient.get<AdminUser[]>('/admin/users/top/likes'),
      ]);
      setAppreciated(a.data);
      setExpressed(e.data);
      setLiked(l.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('ランキングの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderList = (
    list: AdminUser[],
    field: 'appreciated_count' | 'expressed_count' | 'likes_received',
  ) => (
    <ol className="list-decimal pl-5 space-y-1">
      {list.map((u) => (
        <li key={u.id} className="flex justify-between">
          <span>{u.display_name}</span>
          <span>{u[field]}</span>
        </li>
      ))}
    </ol>
  );

  if (loading) return <p className="text-gray-500">読み込み中...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Most appreciated</h3>
        {renderList(appreciated, 'appreciated_count')}
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Most expressive</h3>
        {renderList(expressed, 'expressed_count')}
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Most liked</h3>
        {renderList(liked, 'likes_received')}
      </div>
    </div>
  );
};

export default TopUsersPanel;
