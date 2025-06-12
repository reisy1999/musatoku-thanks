import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import apiClient, { setAuthToken } from './services/api';

function App() {
  // 認証トークンをstateで管理します。nullの場合は未ログイン状態。
  const [token, setToken] = useState<string | null>(null);
  // 認証チェック中かどうか
  const [checking, setChecking] = useState(true);

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
        await apiClient.get('/users/me');
        setToken(storedToken);
      } catch {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setToken(null);
      } finally {
        setChecking(false);
      }
    };

    verifyToken();
  }, []); // 空の配列を渡すことで、初回レンダリング時のみ実行される

  // --- ログイン処理 ---
  const handleLogin = (newToken: string) => {
    // ローカルストレージにトークンを保存
    localStorage.setItem('authToken', newToken);
    // APIクライアントにトークンを設定
    setAuthToken(newToken);
    // stateを更新して再レンダリングをトリガー
    setToken(newToken);
  };

  // --- ログアウト処理 ---
  const handleLogout = () => {
    // ローカルストレージからトークンを削除
    localStorage.removeItem('authToken');
    // APIクライアントのトークンを削除
    setAuthToken(null);
    // stateを更新
    setToken(null);
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
      {token ? (
        // トークンがあればメインページを表示
        <MainPage onLogout={handleLogout} />
      ) : (
        // トークンがなければログインページを表示
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
