import axios from 'axios';

// APIクライアントのインスタンスを作成
const apiClient = axios.create({
  // No.14のvite.config.tsで設定したプロキシのパスに合わせます
  baseURL: '/api',
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