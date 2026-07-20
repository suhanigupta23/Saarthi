import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, MapPin, Sparkles } from 'lucide-react';
import { API_BASE } from '../App.jsx';

function AuthModal({ mode, onClose, onSuccess, setMode }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [pregnancyStatus, setPregnancyStatus] = useState('not_pregnant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const response = await fetch(`${API_BASE}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, name, age, location, pregnancyStatus })
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Signup failed');
        }
        
        setMode('login');
        setUsername(username);
        setPassword('');
        setError('Signup successful! Please log in to your dashboard.');
      } else {
        const response = await fetch(`${API_BASE}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Invalid username or password');
        }
        
        onSuccess(data.token, {
          username: data.username,
          name: data.name,
          age: data.age,
          location: data.location,
          pregnancyStatus: data.pregnancyStatus
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-teal-100 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Card - Premium Teal Gradient */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-700 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-teal-200 animate-pulse" />
            <span className="font-outfit text-sm font-semibold uppercase tracking-wider text-teal-200">Welcome to Saarthi</span>
          </div>
          <h3 className="font-outfit text-2xl font-bold">
            {mode === 'login' ? 'Namaste, Sign In' : 'Create Your Free Account'}
          </h3>
          <p className="text-teal-100/90 text-xs mt-1">
            {mode === 'login' ? 'Enter your details below to access your health dashboard.' : 'Sign up to track cycles, query AI symptom checks, and connect with doctors.'}
          </p>
        </div>

        {/* Form Details */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              error.includes('successful') 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-teal-900">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-800 text-sm bg-teal-50/20 text-teal-950"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-teal-900">Email or Username</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                required
                placeholder="username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-800 text-sm bg-teal-50/20 text-teal-950"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-teal-900">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="password" 
                required
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-800 text-sm bg-teal-50/20 text-teal-950"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-teal-900">Age</label>
                <input 
                  type="number" 
                  placeholder="e.g. 24"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-800 text-sm bg-teal-50/20 text-teal-950"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-teal-900">Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="e.g. Gwalior"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-800 text-sm bg-teal-50/20 text-teal-950"
                  />
                </div>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-teal-900">Pregnancy Status</label>
              <select 
                value={pregnancyStatus}
                onChange={(e) => setPregnancyStatus(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-800 text-sm bg-white text-teal-950"
              >
                <option value="not_pregnant">Not Pregnant</option>
                <option value="pregnant">Pregnant</option>
                <option value="postpartum">Postpartum (Recently Delivered)</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In to Saarthi' : 'Create Account'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-xs font-bold text-teal-800 hover:text-teal-950 hover:underline"
            >
              {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
