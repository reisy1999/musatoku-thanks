import React, { useState } from 'react';
import apiClient from '../../services/api';

// 親コンポーネントから受け取るPropsの型を定義
type CreatePostModalProps = {
  onClose: () => void;
  onPostSuccess: () => void;
};

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostSuccess }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MAX_CHARS = 140;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_CHARS) {
      setContent(e.target.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('メッセージを入力してください。');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post('/posts/', { content });
      // 投稿成功時、親に通知してモーダルを閉じ＆タイムラインを更新
      onPostSuccess();
    } catch (err) {
      setError('投稿に失敗しました。時間をおいて再試行してください。');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // --- モーダルの背景 ---
    <div 
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose} // 背景クリックでモーダルを閉じる
    >
      {/* --- モーダル本体 --- */}
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()} // モーダル内のクリックは伝播させない
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold">感謝を投稿する</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={handleContentChange}
            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="感謝のメッセージを伝えよう"
            autoFocus
          />
          <div className="flex justify-between items-center mt-2">
            <p className={`text-sm ${content.length === MAX_CHARS ? 'text-red-500' : 'text-gray-500'}`}>
              {content.length} / {MAX_CHARS}
            </p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          <div className="flex justify-end mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;