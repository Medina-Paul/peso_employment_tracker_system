import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        // Save the token
        localStorage.setItem('adminToken', data.token);
        
        // Redirect back to the public website 
        // (The Layout will detect the token and show the Dashboard link)
        navigate('/');
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-raleway p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        
        {/* Header - Matches the main layout theme */}
        <div className="bg-blue-900 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide">Admin Portal</h2>
            <p className="text-blue-200 text-sm mt-1">Authorized personnel only</p>
          </div>
          {/* Decorative Red Accent */}
          <div className="h-10 w-2 bg-red-600 rounded-full"></div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
              <input 
                type="text" 
                name="username" 
                value={credentials.username} 
                onChange={handleChange} 
                required 
                placeholder="Enter admin username"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-700 bg-gray-50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                name="password" 
                value={credentials.password} 
                onChange={handleChange} 
                required 
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-700 bg-gray-50 transition-colors"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Authenticating...' : 'Secure Sign In'}
            </button>
          </form>

          {/* Optional back button in case they navigated here by mistake */}
          <div className="mt-8 text-center">
             <button 
                type="button" 
                onClick={() => navigate('/')} 
                className="text-sm font-medium text-gray-500 hover:text-blue-700 transition-colors"
             >
                ← Return to Public Site
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}