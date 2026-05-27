import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import peso_logo from '../assets/peso_logo.png';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const isAdmin = !!localStorage.getItem('adminToken');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  return (
    <div className="font-raleway min-h-screen bg-gray-50 flex flex-col">
      {/* Header Container */}
      <header className="bg-white border-b-4 border-red-800 shadow-sm w-full h-auto py-3 px-4 md:px-12 flex flex-wrap items-center justify-between gap-4">

        {/* Branding Section */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-16 md:h-16 shrink-0">
            <img className="w-full h-full object-contain" src={peso_logo} alt="PESO Logo" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[0.65rem] md:text-[0.9rem] font-semibold text-gray-800 uppercase tracking-widest leading-none">
              Philippine Employment
            </span>
            <span className="text-[1.03rem] md:text-[1.42rem] font-bold text-red-800 uppercase tracking-widest leading-tight">
              Service Office
            </span>
          </div>
        </div>

        {/* Admin Controls Section */}
        {isAdmin && (
          <div className="flex items-center gap-4 animate-fadeIn">
            <Link
              to="/admin/dashboard"
              className="text-sm md:text-base font-bold text-blue-900 hover:text-blue-700 transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-800 text-white text-xs md:text-sm font-bold rounded hover:bg-red-900 transition-all shadow-sm"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;