import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import jaconv from 'jaconv';

interface Mention {
  id: number;
  name: string;
  type: 'user' | 'department';
}

// 親コンポーネントから受け取るPropsの型を定義
type CreatePostModalProps = {
  onClose: () => void;
  onPostSuccess: () => void;
};

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostSuccess }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [normalizedQuery, setNormalizedQuery] = useState('');
  const [mentionError, setMentionError] = useState('');
  const [mentionType, setMentionType] = useState<'user' | 'department'>('user');
  type UserSearchResult = {
    id: number;
    name: string;
    department_id?: number | null;
    department_name?: string | null;
  };
  type Department = { id: number; name: string };

  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedMentions, setSelectedMentions] = useState<Mention[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const MAX_CHARS = 140;

  const normalizeKana = (input: string) =>
    jaconv.toHanKana(jaconv.toKatakana(input));

  const handleMentionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMentionQuery(value);

    if (isComposing && e.type !== 'compositionend') return;

    if (!value.trim()) {
      setMentionError('');
      setNormalizedQuery('');
      setSearchResults([]);
      return;
    }

    setMentionError('');
    const halfKana = normalizeKana(value);
    setNormalizedQuery(halfKana);
  };

  const handleMentionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter' && mentionQuery.trim()) {
      setMentionError('⚠️ メンションは候補から選択してください');
      e.preventDefault();
    }
  };

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>,
  ) => {
    setIsComposing(false);
    handleMentionChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
  };


  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_CHARS) {
      setContent(e.target.value);
    }
  };

  useEffect(() => {
    if (mentionType === 'department') {
      setMentionQuery('');
      setNormalizedQuery('');
      setSearchResults([]);
      setMentionError('');
      const fetchDepts = async () => {
        try {
          const resp = await apiClient.get<Department[]>('/departments');
          setDepartments(resp.data);
        } catch (err) {
          console.error(err);
        }
      };

      fetchDepts();
    }
  }, [mentionType]);

  useEffect(() => {
    if (mentionType !== 'user') {
      setSearchResults([]);
      return;
    }
    const fetchUsers = async () => {
      if (normalizedQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const resp = await apiClient.get<UserSearchResult[]>(
          '/users/search',
          { params: { query: normalizedQuery } },
        );
        setSearchResults(resp.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, [normalizedQuery, mentionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('メッセージを入力してください。');
      return;
    }

    if (mentionQuery.trim()) {
      setMentionError('⚠️ メンションは候補から選択してください');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const mention_user_ids = selectedMentions
        .filter((m) => m.type === 'user')
        .map((m) => m.id);

      const mention_department_ids = selectedMentions
        .filter((m) => m.type === 'department')
        .map((m) => m.id);

      await apiClient.post('/posts/', {
        content,
        mention_user_ids,
        mention_department_ids,
      });
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
          <h2 className="text-xl font-bold">投稿する</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              value={content}
              onChange={handleContentChange}
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share Thanks"
              autoFocus
            />
            <p
              className={`absolute bottom-2 right-2 text-sm ${content.length === MAX_CHARS ? 'text-red-500' : 'text-gray-500'}`}
            >
              {content.length} / {MAX_CHARS}
            </p>
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <div className="mt-2 flex items-start gap-2">
            <select
              value={mentionType}
              onChange={(e) => setMentionType(e.target.value as 'user' | 'department')}
              className="border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="user">User</option>
              <option value="department">Department</option>
            </select>
            <div className="relative flex-1">
              {mentionType === 'user' ? (
                <input
                  type="text"
                  value={mentionQuery}
                  onChange={handleMentionChange}
                  onKeyDown={handleMentionKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={handleCompositionEnd}
                  placeholder="名前で検索してください"
                  className={`w-full p-2 rounded-md text-sm border ${mentionError ? 'border-red-500' : 'border-gray-300'}`}
                />
              ) : (
                <select
                  value=""
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (!id) return;
                    const dept = departments.find((d) => d.id === id);
                    if (!dept) return;
                    if (
                      selectedMentions.some(
                        (m) => m.id === id && m.type === 'department',
                      )
                    )
                      return;
                    setSelectedMentions([
                      ...selectedMentions,
                      { id, name: dept.name, type: 'department' },
                    ]);
                    (e.target as HTMLSelectElement).value = '';
                  }}
                  className="w-full p-2 rounded-md text-sm border border-gray-300"
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            {mentionError && (
              <p className="text-red-500 text-sm mt-1">{mentionError}</p>
            )}
            {mentionType === 'user' && searchResults.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto">
                {searchResults.map((u) => (
                  <li
                    key={`user-${u.id}`}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      if (
                        selectedMentions.some(
                          (m) => m.id === u.id && m.type === 'user',
                        ) ||
                        selectedMentions.length >= 3
                      )
                        return;
                      setSelectedMentions([...selectedMentions, { id: u.id, name: u.name, type: 'user' }]);
                      setMentionQuery('');
                      setNormalizedQuery('');
                      setMentionError('');
                      setSearchResults([]);
                    }}
                  >
                  {u.name}
                  {u.department_name ? ` (${u.department_name})` : ''}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedMentions.map((u) => (
                <span
                  key={`${u.type}-${u.id}`}
                  className="bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center"
                >
                  {u.name}
                  <button
                    type="button"
                    className="ml-1"
                  onClick={() =>
                      setSelectedMentions(
                        selectedMentions.filter(
                          (m) => !(m.id === u.id && m.type === u.type),
                        ),
                      )
                  }
                >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            </div>
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
