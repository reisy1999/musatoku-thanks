import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import AdminDashboard from './pages/AdminDashboard';
import apiClient, { setAuthToken } from './services/api';

interface UserInfo {
  is_admin: boolean;
}

function App() {
  // 認証トークンをstateで管理します。nullの場合は未ログイン状態。
  const [token, setToken] = useState<string | null>(null);
  // 認証チェック中かどうか
  const [checking, setChecking] = useState(true);
  // ログイン中のユーザー情報
  const [user, setUser] = useState<UserInfo | null>(null);

  // --- 認証状態の確認 ---
  // アプリケーションが読み込まれた時に一度だけ実行されます
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        setChecking(false);
        return;
      }

      setAuthToken(storedToken);
      try {
        const res = await apiClient.get<UserInfo>('/users/me');
        setToken(storedToken);
        setUser(res.data);
      } catch {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setChecking(false);
      }
    };

    verifyToken();
  }, []); // 空の配列を渡すことで、初回レンダリング時のみ実行される

  // --- ログイン処理 ---
  const handleLogin = async (newToken: string) => {
    // ローカルストレージにトークンを保存
    localStorage.setItem('authToken', newToken);
    // APIクライアントにトークンを設定
    setAuthToken(newToken);
    // stateを更新して再レンダリングをトリガー
    setToken(newToken);
    try {
      const res = await apiClient.get<UserInfo>('/users/me');
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  // --- ログアウト処理 ---
  const handleLogout = () => {
    // ローカルストレージからトークンを削除
    localStorage.removeItem('authToken');
    // APIクライアントのトークンを削除
    setAuthToken(null);
    // stateを更新
    setToken(null);
    setUser(null);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Checking login...
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <Routes>
        <Route
          path="/"
          element={
            token ? (
              <MainPage onLogout={handleLogout} isAdmin={!!user?.is_admin} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            token ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
          }
        />
        <Route
          path="/admin"
          element={
            token && user?.is_admin ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
