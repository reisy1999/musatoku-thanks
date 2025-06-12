import React, { useState } from 'react';
import apiClient from '../services/api';

// 親コンポーネント(App.tsx)から受け取る関数の型を定義
type LoginPageProps = {
  onLogin: (token: string) => void;
};

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // フォームのデフォルトの送信動作をキャンセル
    setError(''); // エラーメッセージをリセット

    // FastAPIのOAuth2PasswordRequestFormは'x-www-form-urlencoded'形式を期待するため、
    // データをその形式に変換します。
    const params = new URLSearchParams();
    params.append('username', employeeId);
    params.append('password', password);

    try {
      const response = await apiClient.post('/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      // ログイン成功時、返ってきたトークンを親コンポーネント(App.tsx)の関数に渡します
      onLogin(response.data.access_token);
    } catch (err) {
      console.error('Login failed:', err);
      setError('社員IDまたはパスワードが正しくありません。');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">
          Musatoku Thanks Share
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="employeeId"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              職員ID
            </label>
            <input
              type="text"
              id="employeeId"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
