import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import { setAuthToken } from './services/api';

function App() {
  // 認証トークンをstateで管理します。nullの場合は未ログイン状態。
  const [token, setToken] = useState<string | null>(null);

  // --- 認証状態の永続化 ---
  // アプリケーションが読み込まれた時に一度だけ実行されます
  useEffect(() => {
    // ブラウザのローカルストレージに保存されたトークンを探します
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      // トークンがあれば、stateにセットし、APIクライアントにも設定します
      setToken(storedToken);
      setAuthToken(storedToken);
    }
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