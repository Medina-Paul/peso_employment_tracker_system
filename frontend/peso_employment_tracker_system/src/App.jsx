// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";

// 1. Import your pages
import ApplicationForm from './pages/ApplicationForm';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// 2. Import your Layout (The Navbar / Frame)
import AdminLayout from './components/AdminLayout'; 

// =========================================
// THE SECURITY GUARD COMPONENT
// =========================================
const ProtectedRoute = () => {
  // Check if the JWT exists in localStorage
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    // If no token, redirect them to the login page
    return <Navigate to="/admin/login" replace />;
  }

  // If token exists, render the child routes (Outlet)
  return <Outlet />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* ========================================= */}
        {/* 1. PUBLIC ROUTES (No Navbar)              */}
        {/* ========================================= */}
        <Route path="/" element={<ApplicationForm />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ========================================= */}
        {/* 2. PROTECTED ROUTES (Requires Login)      */}
        {/* ========================================= */}
        {/* Step 1: The user must pass the ProtectedRoute check */}
        <Route element={<ProtectedRoute />}>
          
          {/* Step 2: If they pass, apply the AdminLayout (Navbar) */}
          <Route element={<AdminLayout />}>
            
            {/* Step 3: Render the actual page */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            {/* You can easily add more protected pages here later! */}
            {/* <Route path="/admin/settings" element={<AdminSettings />} /> */}
            
          </Route>
          
        </Route>

        {/* ========================================= */}
        {/* 3. CATCH-ALL ROUTE                        */}
        {/* ========================================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;