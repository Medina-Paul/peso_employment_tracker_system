import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear the token and kick them back to login
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">

      {/* A simple top navigation bar for the Admin area */}
      <header className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-xl tracking-wide">ATS Admin Portal</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6">

        {/* THIS IS THE CRITICAL PART: 
            This Outlet is the "hole" where React Router will inject your AdminDashboard.jsx */}
        <Outlet />

      </main>
    </div>
  );
}