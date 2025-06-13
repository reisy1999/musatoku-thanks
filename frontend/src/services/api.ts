import axios from 'axios';

// APIクライアントのインスタンスを作成
const apiClient = axios.create({
  // FastAPIバックエンドのURL
  // 開発環境でフロントエンドのみを起動した場合でも
  // 正しいエンドポイントにリクエストが飛ぶよう、明示的に指定する
  baseURL: 'http://localhost:8000',
  // リクエストヘッダーのデフォルト設定
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * ★★★ トークンをリクエストヘッダーに設定する関数 ★★★
 * ログイン後、この関数を呼び出すことで、以降のAPIリクエストに
 * 自動で認証情報（JWT）が付与されるようになります。
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    // トークンがあれば、すべてのリクエストのAuthorizationヘッダーに設定
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // トークンがなければ、ヘッダーから削除
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
