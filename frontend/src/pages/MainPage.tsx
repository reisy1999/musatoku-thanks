import React, { useState } from 'react';
import UserInfo from '../components/ui/UserInfo';
import Timeline from '../components/ui/Timeline';
import CreatePostModal from '../components/ui/CreatePostModal';

// 親コンポーネント(App.tsx)から受け取る関数の型を定義
type MainPageProps = {
  onLogout: () => void;
  isAdmin: boolean;
};

import { useNavigate } from 'react-router-dom';

const MainPage: React.FC<MainPageProps> = ({ onLogout, isAdmin }) => {
  const navigate = useNavigate();
  // 投稿作成モーダルの表示状態を管理します
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 投稿が成功したかどうかを管理するstate。
  // これを更新することでタイムラインの再読み込みをトリガーします。
  const [postSuccess, setPostSuccess] = useState(false);

  // 現在選択されているタイムラインタブ
  const [activeTab, setActiveTab] = useState<'all' | 'mentioned'>('all');

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
            <h1 className="text-2xl font-bold text-blue-600 mb-6">Thanks Share</h1>
            <UserInfo />
            <button
              onClick={onLogout}
              className="mt-6 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
            >
              Logout
            </button>
          </div>
        </header>

        {/* --- 中央カラム (メインタイムライン) --- */}
        <main className="col-span-6 border-l border-r border-gray-200 relative flex flex-col h-screen">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                className={`flex-1 p-4 text-center font-semibold focus:outline-none ${
                  activeTab === 'all'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('all')}
              >
                All Posts
              </button>
              <button
                className={`flex-1 p-4 text-center font-semibold focus:outline-none ${
                  activeTab === 'mentioned'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('mentioned')}
              >
                Mentioned Posts
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pb-20">
            <Timeline
              postSuccessTrigger={postSuccess}
              endpoint={activeTab === 'all' ? '/posts/' : '/posts/mentioned'}
            />
          </div>

          {/* --- 投稿作成ボタン --- */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute bottom-4 right-4 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </main>
        
        {/* --- 右カラム (空きスペース) --- */}
        <aside className="col-span-3">
          {/* 今後の機能拡張用スペース */}
        </aside>

      </div>


      {isAdmin && (
        <div className="fixed bottom-20 right-8">
          <button
            onClick={() => navigate('/admin')}
            className="bg-gray-700 text-white rounded-full p-3 shadow-lg hover:bg-gray-800 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 9.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"
              />
            </svg>
          </button>
        </div>
      )}

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
