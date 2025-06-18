import React, { useState } from 'react';
import apiClient from '../../services/api';

interface Post {
  id: number;
  content: string;
}

type ReportModalProps = {
  post: Post;
  onClose: () => void;
};

const MAX_CHARS = 255;

const ReportModal: React.FC<ReportModalProps> = ({ post, onClose }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_CHARS) {
      setReason(e.target.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('理由を入力してください');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await apiClient.post('/reports', {
        reported_post_id: post.id,
        reason,
      });
      alert('報告を送信しました');
      onClose();
    } catch (err) {
      setError('報告に失敗しました');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold">報告する</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            &times;
          </button>
        </div>
        <div className="mb-4 p-3 bg-gray-100 rounded text-sm whitespace-pre-wrap">
          {post.content}
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            value={reason}
            onChange={handleChange}
            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="報告理由を入力してください"
            autoFocus
          />
          <div className="flex justify-between items-center mt-2">
            <p className={`text-sm ${reason.length === MAX_CHARS ? 'text-red-500' : 'text-gray-500'}`}> {reason.length} / {MAX_CHARS}</p>
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
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? '送信中...' : '送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
