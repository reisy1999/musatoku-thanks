import React, { useState } from 'react';
import UserAdminPanel from '../components/admin/UserAdminPanel';
import DepartmentAdminPanel from '../components/admin/DepartmentAdminPanel';
import PostAdminPanel from '../components/admin/PostAdminPanel';
import TopUsersPanel from '../components/admin/TopUsersPanel';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'users' | 'departments' | 'deletedPosts' | 'reports'
  >('users');

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'departments':
        return <DepartmentAdminPanel />;
      case 'deletedPosts':
        return <PostAdminPanel showDeleted />;
      case 'reports':
        return <PostAdminPanel />;
      case 'users':
      default:
        return <UserAdminPanel />;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <div className="mb-6">
        <TopUsersPanel />
      </div>
      <div className="mb-4 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-4 font-semibold focus:outline-none ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`py-2 px-4 font-semibold focus:outline-none ${
              activeTab === 'departments'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setActiveTab('deletedPosts')}
            className={`py-2 px-4 font-semibold focus:outline-none ${
              activeTab === 'deletedPosts'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            Deleted Posts
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-4 font-semibold focus:outline-none ${
              activeTab === 'reports'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            Reports
          </button>
        </div>
      </div>
      {renderActivePanel()}
    </div>
  );
};

export default AdminDashboard;
