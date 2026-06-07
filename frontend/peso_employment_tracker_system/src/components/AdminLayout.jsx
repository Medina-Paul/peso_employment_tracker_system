import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import peso_logo from '../assets/peso_logo.png'; // Assuming you have the logo in assets

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="font-raleway min-h-screen bg-[#F8FAFC] flex flex-col">

      {/* Header - Matching Application Layout */}
      <header className="bg-white border-b-4 border-red-800 shadow-sm w-full h-auto py-3 px-4 md:px-12 flex flex-wrap items-center justify-between gap-4">

        {/* Branding Section */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-16 md:h-16 shrink-0">
            <img className="w-full h-full object-contain" src={peso_logo} alt="PESO Logo" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[0.648rem] md:text-[0.733rem] font-semibold text-gray-800 uppercase tracking-widest leading-none">
              Philippine Employment
            </span>
            <span className="text-[1.03rem] md:text-[1.16rem] font-bold text-red-800 uppercase tracking-widest leading-tight">
              Service Office
            </span>
            <div className="border-t text-[0.97rem] md:text-[1.1rem]">
              <span>ADMIN DASHBOARD</span>
            </div>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="flex items-center gap-4 animate-fadeIn">
          <Link
            to="/"
            className="text-sm md:text-base font-bold text-blue-900 hover:text-blue-700 transition-colors"
          >
            Public Site
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-800 text-white text-xs md:text-sm font-bold rounded hover:bg-red-900 transition-all shadow-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-8">
        {/* This is the "hole" where your AdminDashboard.jsx will inject */}
        <Outlet />
      </main>
    </div>
  );
}