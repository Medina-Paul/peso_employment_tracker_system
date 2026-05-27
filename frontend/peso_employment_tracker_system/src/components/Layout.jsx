import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  // Check if the admin token exists in local storage
  const isAdmin = !!localStorage.getItem('adminToken');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    // Force a re-render by navigating to the home route
    navigate('/');
  };

  return (
    <div className="font-raleway min-h-screen bg-gray-100 flex flex-col">
      {/* Header - Quezon City Theme Colors */}
      <div className="bg-blue-900 p-6 flex items-center justify-between shadow-md z-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Official Job Application</h1>
          <p className="text-blue-200 text-sm mt-1">Complete the form below to apply</p>
        </div>

        <div className="flex items-center space-x-6">
          {/* Conditionally render admin controls if logged in */}
          {isAdmin && (
            <div className="flex items-center space-x-4 animate-fadeIn">
              <Link
                to="/admin/dashboard"
                className="text-white font-semibold hover:text-blue-200 transition-colors"
              >
                Admin Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700 shadow transition-all transform hover:-translate-y-0.5"
              >
                Logout
              </button>
            </div>
          )}

          {/* Decorative Red Accent */}
          <div className="h-10 w-2 bg-red-600 rounded-full hidden sm:block"></div>
        </div>
      </div>

      <main className="flex-grow">{children}</main>
    </div>
  );
};

export default Layout;