import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';

interface Department {
  id: number;
  name: string;
}

const DepartmentAdminPanel: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const resp = await apiClient.get<Department[]>('/admin/departments');
      setDepartments(resp.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('部署一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await apiClient.post('/admin/departments', { name: newName });
      setNewName('');
      fetchDepartments();
    } catch (err) {
      console.error(err);
      setError('部署の作成に失敗しました。');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return;
    try {
      await apiClient.put(`/admin/departments/${id}`, { name: editingName });
      setEditingId(null);
      setEditingName('');
      fetchDepartments();
    } catch (err) {
      console.error(err);
      setError('部署の更新に失敗しました。');
    }
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm('この部署を削除しますか?');
    if (!ok) return;
    try {
      await apiClient.delete(`/admin/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      setError('部署の削除に失敗しました。');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <form onSubmit={handleCreate} className="flex items-center space-x-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border rounded px-2 py-1 flex-grow"
          placeholder="部署名を入力"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          disabled={!newName.trim()}
        >
          追加
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : departments.length === 0 ? (
        <p className="text-gray-500">部署がありません。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">{d.id}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {editingId === d.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                    ) : (
                      d.name
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap space-x-2">
                    {editingId === d.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(d.id)}
                          className="text-blue-600 hover:underline"
                          type="button"
                          disabled={!editingName.trim()}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditingName('');
                          }}
                          className="text-gray-600 hover:underline"
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(d.id);
                            setEditingName(d.name);
                          }}
                          className="text-blue-600 hover:underline"
                          type="button"
                          disabled={d.id === 0}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="text-red-600 hover:underline"
                          type="button"
                          disabled={d.id === 0}
                        >
                          Delete
                        </button>
                      </>
                    )}
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

export default DepartmentAdminPanel;
