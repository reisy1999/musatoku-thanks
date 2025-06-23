import React, { useEffect, useRef, useState } from "react";
import apiClient from "../../services/api";

interface AdminUser {
  id: number;
  employee_id: string;
  display_name: string;
  kana_name: string;
  department_name?: string | null;
  is_admin: boolean;
  is_active: boolean;
  is_logged_in: boolean;
}

const UserAdminPanel: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const resp = await apiClient.get<AdminUser[]>("/admin/users");
      setUsers(resp.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("ユーザー一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const resp = await apiClient.get<AdminUser>("/users/me");
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
    const ok = window.confirm("このユーザーを無効化しますか?");
    if (!ok) return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: false } : u)),
      );
    } catch (err) {
      console.error(err);
      setError("ユーザーの無効化に失敗しました。");
    }
  };

  const handleExport = async () => {
    try {
      const resp = await apiClient.get("/admin/users/export", {
        responseType: "blob",
      });
      const blob = new Blob([
        "\uFEFF",
        resp.data,
      ], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "users.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("CSVのダウンロードに失敗しました。");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const resp = await apiClient.post<{
        added: number;
        skipped: number;
        errors?: string[];
      }>("/admin/users/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      let message = `Import finished\nAdded: ${resp.data.added}\nSkipped: ${resp.data.skipped}`;
      if (resp.data.errors && resp.data.errors.length > 0) {
        message += `\nErrors:\n- ${resp.data.errors.join("\n- ")}`;
        setError(resp.data.errors.join(" / "));
      } else {
        setError(null);
      }
      alert(message);
      fetchUsers();
    } catch (err: unknown) {
      console.error(err);
      const status = (err as { response?: { status?: number } }).response
        ?.status;
      const message =
        status === 400
          ? "CSV形式が正しくありません。ヘッダー: user_id,name,display_name,department,email"
          : "CSVのインポートに失敗しました。";
      setError(message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="p-4">
      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div>
          <div className="mb-2 space-x-2">
            <button
              onClick={handleImportClick}
              title="CSV headers: user_id,name,display_name,department,email (UTF-8)"
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Import CSV
            </button>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleExport}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kana Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Login
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">{u.id}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {u.employee_id}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {u.display_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {u.kana_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {u.department_name ?? ""}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {u.is_admin ? "管理者" : "一般"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {u.is_active ? "在職" : "退職"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {u.is_logged_in && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
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
        </div>
      )}
    </div>
  );
};

export default UserAdminPanel;
