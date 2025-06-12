import React, { useState } from 'react';
import UserInfo from '../components/ui/UserInfo';
import Timeline from '../components/ui/Timeline';
import CreatePostModal from '../components/ui/CreatePostModal';

// 親コンポーネント(App.tsx)から受け取る関数の型を定義
type MainPageProps = {
  onLogout: () => void;
};

const MainPage: React.FC<MainPageProps> = ({ onLogout }) => {
  // 投稿作成モーダルの表示状態を管理します
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 投稿が成功したかどうかを管理するstate。
  // これを更新することでタイムラインの再読み込みをトリガーします。
  const [postSuccess, setPostSuccess] = useState(false);

  const handlePostSuccess = () => {
    setIsModalOpen(false); // モーダルを閉じる
    setPostSuccess(!postSuccess); // タイムラインの再読み込みをトリガー
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="grid grid-cols-12 gap-6">

        {/* --- 左カラム (ユーザー情報 & メニュー) --- */}
        <header className="col-span-3 py-6">
          <div className="sticky top-6">
            <h1 className="text-2xl font-bold text-blue-600 mb-6">むさとくサンクス</h1>
            <UserInfo />
            <button
              onClick={onLogout}
              className="mt-6 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
            >
              ログアウト
            </button>
          </div>
        </header>

        {/* --- 中央カラム (メインタイムライン) --- */}
        <main className="col-span-6 border-l border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold">ホーム</h2>
          </div>
          <Timeline postSuccessTrigger={postSuccess} />
        </main>
        
        {/* --- 右カラム (空きスペース) --- */}
        <aside className="col-span-3">
          {/* 今後の機能拡張用スペース */}
        </aside>

      </div>

      {/* --- 投稿作成ボタン --- */}
      <div className="fixed bottom-8 right-8">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* --- 投稿作成モーダル --- */}
      {isModalOpen && (
        <CreatePostModal 
          onClose={() => setIsModalOpen(false)} 
          onPostSuccess={handlePostSuccess}
        />
      )}
    </div>
  );
};

export default MainPage;