import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';

interface AdminUser {
  id: number;
  name: string;
  employee_id: string;
  department_name?: string | null;
  is_admin: boolean;
  is_active: boolean;
}

const UserAdminPanel: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const resp = await apiClient.get<AdminUser[]>('/admin/users');
      setUsers(resp.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('ユーザー一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const resp = await apiClient.get<AdminUser>('/users/me');
      setCurrentUserId(resp.data.id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const handleDeactivate = async (id: number) => {
    const ok = window.confirm('このユーザーを無効化しますか?');
    if (!ok) return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: false } : u)),
      );
    } catch (err) {
      console.error(err);
      setError('ユーザーの無効化に失敗しました。');
    }
  };

  return (
    <div className="p-4">
      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">{u.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{u.employee_id}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {u.department_name ?? ''}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {u.is_admin && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {u.is_active ? 'Active' : 'Inactive'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => handleDeactivate(u.id)}
                      disabled={!u.is_active || u.id === currentUserId}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      Deactivate
                    </button>
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

export default UserAdminPanel;
