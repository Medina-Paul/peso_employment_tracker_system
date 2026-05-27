import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import peso_logo from '../assets/peso_logo.png'

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


        <div className="bg-white p-6 flex items-center justify-between">


          {/* Branding Section */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-16 md:h-16 shrink-0">
              <img className="w-full h-full object-contain" src={peso_logo} alt="PESO Logo" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[0.543rem] md:text-[0.635rem] font-semibold text-gray-800 uppercase tracking-widest leading-none">
                Philippine Employment
              </span>
              <span className="text-[0.865rem] md:text-[1.01rem] font-bold text-red-800 uppercase tracking-widest leading-tight">
                Service Office
              </span>
              <div className="border-t text-[1.2rem] md:text-[1.4rem]">
                <span>ADMIN LOGIN</span>
              </div>
            </div>
          </div>

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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 bg-gray-50 transition-colors"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 bg-gray-50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
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