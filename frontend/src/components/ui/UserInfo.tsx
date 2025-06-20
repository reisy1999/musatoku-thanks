import React, { useState, useEffect } from "react";
import apiClient from "../../services/api";

// ユーザー情報の型を定義
interface User {
  name: string;
  display_name: string;
  employee_id: string;
}

const UserInfo: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        // バックエンドに自身のユーザー情報をリクエストします
        const response = await apiClient.get<User>("/users/me");
        setUser(response.data);
      } catch (err) {
        setError("ユーザー情報の取得に失敗しました。");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []); // 空の配列を渡すことで、コンポーネントの初回レンダリング時に一度だけ実行

  if (loading) {
    return <div className="p-4 text-gray-500">読み込み中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {user ? (
        <div>
          <p className="font-bold text-lg text-gray-800">{user.display_name}</p>
          <p className="text-sm text-gray-500">ID: {user.employee_id}</p>
        </div>
      ) : (
        <p>ユーザー情報がありません。</p>
      )}
    </div>
  );
};

export default UserInfo;
