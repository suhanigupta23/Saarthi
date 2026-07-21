import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, MapPin, Sparkles, Calendar } from 'lucide-react';
import { API_BASE } from '../App.jsx';

function AuthModal({ mode, onClose, onSuccess, setMode }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [pregnancyStatus, setPregnancyStatus] = useState('not_pregnant');
  
  // Custom period setup states for new users
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodDuration, setPeriodDuration] = useState('5');

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
        
        // Store real period start date & cycle length for new user
        if (lastPeriodDate) {
          localStorage.setItem('periodStartDate', lastPeriodDate);
          localStorage.setItem('periodCycleLength', cycleLength || '28');
          localStorage.setItem('periodDuration', periodDuration || '5');
          const newLog = [{ id: Date.now(), startDate: lastPeriodDate, mood: 'Logged', flow: 'Medium', symptoms: 'None' }];
          localStorage.setItem('periodLogs', JSON.stringify(newLog));
        }

        setMode('login');
        setUsername(username);
        setPassword('');
        setError('Account created successfully with your custom cycle profile! Please log in below.');
      } else {
        const response = await fetch(`${API_BASE}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const text = await response.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          data = {};
        }

        if (!response.ok) {
          if (response.status === 401 || response.status === 403 || response.status === 400) {
            throw new Error(data.message || 'Incorrect password or account does not exist. Please check your credentials or Sign Up.');
          } else if (response.status === 404) {
            throw new Error('Account does not exist. Please click Sign Up below to create your free account.');
          }
          throw new Error(data.message || 'Unable to sign in. Please verify your credentials or Sign Up.');
        }
        
        onSuccess(data.token || 'mock_jwt_token_saarthi', {
          username: data.username || username || 'ananya_sharma',
          name: data.name || 'Ananya Sharma',
          age: data.age || 26,
          location: data.location || 'Bhopal, MP',
          pregnancyStatus: data.pregnancyStatus || 'not_pregnant'
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed. Please check credentials or Sign Up.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    onSuccess('google_mock_jwt_token', {
      name: 'Ananya Sharma',
      username: 'ananya.sharma@gmail.com',
      email: 'ananya.sharma@gmail.com',
      location: 'Bhopal, MP',
      age: 26,
      pregnancyStatus: 'not_pregnant'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-[24px] w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden shadow-xl border border-[#ECE8F5] relative animate-in fade-in zoom-in-95 duration-200 text-left font-sans">
        
        {/* Top Header Card - Muted Indigo Gradient */}
        <div className="bg-gradient-to-r from-[#6D5BD0] to-[#8B78E6] p-4 sm:p-5 text-white relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-white/80" />
            <span className="font-outfit text-[10px] font-bold uppercase tracking-wider text-white/90">Welcome to Saarthi</span>
          </div>
          <h3 className="font-outfit text-xl font-black text-white">
            {mode === 'login' ? 'Namaste, Sign In' : 'Create Your Free Account'}
          </h3>
          <p className="text-white/85 text-[11px] mt-0.5 leading-tight">
            {mode === 'login' ? 'Enter your details below to access your health dashboard.' : 'Sign up to track cycles, query AI symptom checks, and connect with doctors.'}
          </p>
        </div>

        {/* Form Details */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
          {error && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              error.includes('successful') 
                ? 'bg-[#A9D8C8]/20 border border-[#A9D8C8] text-[#2D2A4A]' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-0.5">
              <label className="text-[11px] font-bold text-[#2D2A4A]">Full Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#8A8FA3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] focus:ring-2 focus:ring-[#6D5BD0]/20 text-xs bg-white text-[#2D2A4A]"
                />
              </div>
            </div>
          )}

          <div className="space-y-0.5">
            <label className="text-[11px] font-bold text-[#2D2A4A]">Email or Username</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-[#8A8FA3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                required
                placeholder="username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] focus:ring-2 focus:ring-[#6D5BD0]/20 text-xs bg-white text-[#2D2A4A]"
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[11px] font-bold text-[#2D2A4A]">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-[#8A8FA3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="password" 
                required
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] focus:ring-2 focus:ring-[#6D5BD0]/20 text-xs bg-white text-[#2D2A4A]"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <label className="text-[11px] font-bold text-[#2D2A4A]">Age</label>
                <input 
                  type="number" 
                  placeholder="e.g. 24"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] focus:ring-2 focus:ring-[#6D5BD0]/20 text-xs bg-white text-[#2D2A4A]"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[11px] font-bold text-[#2D2A4A]">Location</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-[#8A8FA3] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="e.g. Gwalior"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] focus:ring-2 focus:ring-[#6D5BD0]/20 text-xs bg-white text-[#2D2A4A]"
                  />
                </div>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div className="space-y-0.5">
                <label className="text-[11px] font-bold text-[#2D2A4A]">Pregnancy Status</label>
                <select 
                  value={pregnancyStatus}
                  onChange={(e) => setPregnancyStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] focus:ring-2 focus:ring-[#6D5BD0]/20 text-xs bg-white text-[#2D2A4A] cursor-pointer"
                >
                  <option value="not_pregnant">Not Pregnant</option>
                  <option value="pregnant">Pregnant</option>
                  <option value="postpartum">Postpartum (Recently Delivered)</option>
                </select>
              </div>

              {/* Dynamic Period Tracking Setup for New User */}
              <div className="space-y-3 p-3.5 bg-[#FAF8FC] rounded-2xl border border-[#ECE8F5] text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#6D5BD0]">
                  <Calendar className="w-4 h-4 text-[#6D5BD0]" />
                  <span>Cycle & Period Setup (AI Predictions)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2D2A4A]">Last Period Start Date *</label>
                  <input 
                    type="date" 
                    required={mode === 'signup'}
                    value={lastPeriodDate}
                    onChange={(e) => setLastPeriodDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-sm bg-white text-[#2D2A4A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2D2A4A]">Avg Cycle (Days)</label>
                    <input 
                      type="number" 
                      required={mode === 'signup'}
                      min="20"
                      max="45"
                      value={cycleLength}
                      onChange={(e) => setCycleLength(e.target.value)}
                      placeholder="28"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-sm bg-white text-[#2D2A4A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2D2A4A]">Period Length (Days)</label>
                    <input 
                      type="number" 
                      required={mode === 'signup'}
                      min="2"
                      max="10"
                      value={periodDuration}
                      onChange={(e) => setPeriodDuration(e.target.value)}
                      placeholder="5"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-sm bg-white text-[#2D2A4A]"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl font-bold transition-all shadow-xs disabled:opacity-50 text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In to Saarthi' : 'Create Account'}
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#ECE8F5]"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-[#8A8FA3]">Or continue with</span>
            <div className="flex-grow border-t border-[#ECE8F5]"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 bg-white border border-[#ECE8F5] hover:bg-[#F5F3FA] text-[#2D2A4A] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="text-center pt-2">
            {mode === 'login' ? (
              <p className="text-xs text-[#5F6473] font-medium">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => { setError(''); setMode('signup'); }}
                  className="font-bold underline text-[#6D5BD0] hover:text-[#5b4ab9] cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p className="text-xs text-[#5F6473] font-medium">
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => { setError(''); setMode('login'); }}
                  className="font-bold underline text-[#6D5BD0] hover:text-[#5b4ab9] cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
