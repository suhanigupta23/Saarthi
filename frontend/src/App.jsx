import React, { useState, useEffect } from 'react';
import { 
  Heart, Calendar, Activity, Shield, FileText, 
  Building2, MessageCircle, Database, LogOut, User,
  Menu, X, ArrowRight, Star, Users, Zap, Award, CheckCircle, ShieldCheck, Mail, Phone, ChevronLeft, ArrowLeft
} from 'lucide-react';
import AuthModal from './components/AuthModal.jsx';
import DashboardHome from './components/DashboardHome.jsx';
import SheCycle from './components/SheCycle.jsx';
import SymptoScan from './components/SymptoScan.jsx';
import GynConnect from './components/GynConnect.jsx';
import VaxAlert from './components/VaxAlert.jsx';
import HealthYojana from './components/HealthYojana.jsx';
import NGOHeal from './components/NGOHeal.jsx';
import CareCircle from './components/CareCircle.jsx';
import MediVault from './components/MediVault.jsx';
import UserProfile from './components/UserProfile.jsx';

import heroWomen from './assets/hero-women.jpg';
import aboutWellnessImg from './assets/about-wellness.jpg';
import aiSupportImg from './assets/ai-support.jpg';

export const API_BASE = '/api';

// Leftmost Medical Heart-Cross SVG Logo Component
const SaarthiLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-teal-800 shrink-0">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" className="stroke-teal-800" />
    <path d="M12 6.5v6M9 9.5h6" className="stroke-teal-400" strokeWidth="2" />
  </svg>
);

// Minimalist Card Component - Unified Teal Icons, Spacious padding, and larger sizes
const FeatureCard = ({ icon: Icon, title, description, onClick }) => {
  return (
    <div 
      className="bg-white border border-teal-100/90 rounded-2xl p-7 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[250px]"
      onClick={onClick}
    >
      <div>
        <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
          <Icon className="w-5.5 h-5.5" />
        </div>
        <h3 className="text-base font-extrabold text-teal-950 mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-teal-800 font-semibold leading-relaxed">
          {description}
        </p>
      </div>
      
      <div className="mt-3 flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-teal-850 hover:text-teal-955">
        <span>Explore Page</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'about', 'support', or feature IDs
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Help support form states
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  // Check login on load
  useEffect(() => {
    const token = localStorage.getItem('saarthi_token');
    const savedUser = localStorage.getItem('saarthi_user');
    if (token && savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Smooth scroll to top on all tab transitions immediately
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }, [activeTab]);

  const handleLoginSuccess = (token, userData) => {
    localStorage.setItem('saarthi_token', token);
    localStorage.setItem('saarthi_user', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
    setShowAuthModal(false);
    setActiveTab('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('saarthi_token');
    localStorage.removeItem('saarthi_user');
    setUser(null);
    setIsLoggedIn(false);
    setActiveTab('home');
  };

  const handleRequireAuth = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  // Support form handler
  const handleSupportSubmit = (e) => {
    e.preventDefault();
    setSupportSubmitted(true);
    setTimeout(() => {
      setSupportSubmitted(false);
      setSupportName('');
      setSupportEmail('');
      setSupportMessage('');
    }, 4000);
  };

  // Nav items list (Only shown in sidebar to logged-in users)
  const navItems = [
    { id: 'home', label: 'Dashboard Home', icon: Heart },
    { id: 'cycle', label: 'SheCycle+ Period Tracker', icon: Calendar },
    { id: 'symptom', label: 'SymptoScan AI Insights', icon: Activity },
    { id: 'gynconnect', label: 'GynConnect Telehealth', icon: Heart },
    { id: 'profile', label: 'My Profile & History', icon: User },
    { id: 'vault', label: 'MediVault Records Locker', icon: Database },
    { id: 'yojana', label: 'HealthYojana Scheme Finder', icon: FileText },
    { id: 'ngo', label: 'NGOHeal Support Aid', icon: Building2 },
    { id: 'chat', label: 'CareCircle Peer Support', icon: MessageCircle },
    { id: 'vax', label: 'VaxAlert Vaccine Hub', icon: Shield },
  ];

  // Simplified copies for non-technical users
  const features = [
    {
      id: 'cycle',
      icon: Calendar,
      title: "SheCycle+",
      description: "Keep track of your cycle dates, log daily moods, and receive gentle, natural dietary tips tailored for your body."
    },
    {
      id: 'symptom',
      icon: Activity,
      title: "SymptoScan",
      description: "Answer simple questions about how you feel to get helpful suggestions on whether you should see a doctor."
    },
    {
      id: 'gynconnect',
      icon: Heart,
      title: "GynConnect",
      description: "Book direct video calls or text chats with verified women's health doctors in your area."
    },
    {
      id: 'vault',
      icon: Database,
      title: "MediVault",
      description: "Store your doctor prescriptions and medical files safely in one place so you never lose them."
    },
    {
      id: 'yojana',
      icon: FileText,
      title: "HealthYojana",
      description: "Find government healthcare benefits, financial help, and medical schemes matching your background."
    },
    {
      id: 'ngo',
      icon: Building2,
      title: "NGOHeal",
      description: "Get assistance from local community support groups offering medical aid, advice, and shelter."
    },
    {
      id: 'chat',
      icon: MessageCircle,
      title: "CareCircle",
      description: "Talk privately in safe online groups with other women who are going through the same health journeys."
    },
    {
      id: 'vax',
      icon: Shield,
      title: "VaxAlert",
      description: "Set up a personal vaccine calendar with automated SMS reminders for you and your daughters."
    }
  ];

  const handleFeatureAccess = (id) => {
    setActiveTab(id);
  };

  // Helper back button on features for guest exploration
  const renderBackButton = () => {
    if (!isLoggedIn && activeTab !== 'home' && activeTab !== 'about' && activeTab !== 'support') {
      return (
        <button 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-200/50 mb-4"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
          <span>Back to Services</span>
        </button>
      );
    }
    return null;
  };

  const isServicesActive = activeTab !== 'about' && activeTab !== 'support';

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-teal-100/70 px-6 py-4 flex items-center justify-between shadow-soft">
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-teal-50 rounded-lg text-teal-855 transition-colors"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
          )}
          <div 
            className="flex items-center gap-2.5 cursor-pointer" 
            onClick={() => setActiveTab('home')}
          >
            <SaarthiLogo />
            <span className="font-outfit text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-900 to-teal-700 bg-clip-text text-transparent">
              Saarthi
            </span>
          </div>
        </div>

        {/* Services highlighted first in capsule list */}
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-2 text-sm font-extrabold text-teal-800 mr-2 sm:mr-4">
            <button 
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-full transition-all ${
                isServicesActive
                  ? 'bg-teal-100 border border-teal-200/50 text-teal-900 shadow-sm' 
                  : 'hover:text-teal-955'
              }`}
            >
              Services
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 rounded-full transition-all ${
                activeTab === 'about' 
                  ? 'bg-teal-100 border border-teal-200/50 text-teal-900 shadow-sm' 
                  : 'hover:text-teal-955'
              }`}
            >
              About Us
            </button>
            <button 
              onClick={() => setActiveTab('support')}
              className={`px-4 py-2 rounded-full transition-all ${
                activeTab === 'support' 
                  ? 'bg-teal-100 border border-teal-200/50 text-teal-900 shadow-sm' 
                  : 'hover:text-teal-955'
              }`}
            >
              Support
            </button>
          </nav>

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-teal-950">Namaste, {user?.name || 'Saarthi User'}! 👋</p>
                <p className="text-xs text-teal-650 font-semibold">{user?.location || 'India'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-teal-800 text-white flex items-center justify-center font-outfit font-bold border border-teal-200 shadow-sm text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-200/50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="px-4 py-2 text-xs font-bold text-teal-955 hover:bg-teal-50 border border-teal-200 rounded-lg transition-all"
              >
                Sign In
              </button>
              <button 
                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-all shadow-md"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* SIDEBAR FOR LOGGED IN USERS */}
        {isLoggedIn && sidebarOpen && (
          <>
            {/* Dark overlay backdrop for tablets/mobile screens */}
            <div 
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-30 lg:hidden animate-in fade-in duration-200"
            ></div>
            
            <aside className="w-64 bg-white border-r border-teal-100 py-6 flex flex-col justify-between shrink-0 shadow-soft z-40 absolute lg:relative h-full transition-transform duration-300">
              <div className="space-y-1 px-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-bold transition-all ${
                      activeTab === item.id 
                        ? 'bg-teal-800 text-white shadow-md hover:bg-teal-900' 
                        : 'text-teal-800/80 hover:text-teal-955 hover:bg-teal-50/50'
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="px-4 border-t border-teal-100 pt-4 text-center">
                <p className="text-xs text-teal-800/60 font-bold">🌿 Saarthi v2.0</p>
              </div>
            </aside>
          </>
        )}

        {/* WORKSPACE CONTENT AREA WITH UNIVERSAL FOOTER */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-background flex flex-col justify-between">
          <div className="page-transition flex-1">
            
            {/* ABOUT US PAGE (STANDALONE) */}
            {activeTab === 'about' && (
              <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-12 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6 text-left">
                    <div className="inline-block bg-teal-100 text-teal-800 rounded-full px-4 py-1.5 font-bold text-xs uppercase tracking-wider">
                      About Saarthi
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-teal-955 leading-tight">
                      Guiding women through every stage of their health journey
                    </h2>
                    <p className="text-sm md:text-base text-teal-900 leading-relaxed font-semibold">
                      Saarthi was created to be a secure digital health companion for women. We believe healthcare software should be friendly, clear, and easy to understand.
                    </p>
                    <p className="text-sm md:text-base text-teal-900/85 leading-relaxed">
                      Our system focuses heavily on privacy and safety. All your symptoms and logs are kept securely in your local browser storage. We translate clinical medical insights into simple summaries so you can prepare for your gynecologist appointments confidently.
                    </p>
                    
                    <div className="space-y-3 pt-2 font-bold text-teal-950 text-xs sm:text-sm">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle className="w-5 h-5 text-teal-600" />
                        <span>100% Privacy Focused — Your data stays on your device</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle className="w-5 h-5 text-teal-600" />
                        <span>Clinical Disclaimers — AI is a companion, not a replacement for doctors</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle className="w-5 h-5 text-teal-600" />
                        <span>Direct Medical Access — Book video calls with certified experts</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <img 
                      src={aboutWellnessImg} 
                      alt="Women's support community and healthcare" 
                      className="rounded-3xl shadow-elegant border border-teal-100 object-cover w-full max-h-[380px]"
                    />
                  </div>
                </div>

                {/* Core values cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="bg-white border border-teal-100/70 p-7 rounded-2xl space-y-2 text-left">
                    <h4 className="font-extrabold text-teal-955 text-base">👩‍⚕️ Clinical Partnership</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      We connect users directly to active, certified gynecologists. All insights prepare patients with meaningful questions to ask during live consults.
                    </p>
                  </div>
                  <div className="bg-white border border-teal-100/70 p-7 rounded-2xl space-y-2 text-left">
                    <h4 className="font-extrabold text-teal-955 text-base">🛡️ Safety Disclaimers</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Our Symptom scanner evaluates urgency categories (Low, Medium, High) rather than absolute diagnoses, instructing users when clinical help is urgent.
                    </p>
                  </div>
                  <div className="bg-white border border-teal-100/70 p-7 rounded-2xl space-y-2 text-left">
                    <h4 className="font-extrabold text-teal-955 text-base">🤝 Localized Welfare</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Matches maternal clinics, government welfare schemes, and support networks nearby so women can access financial aid options.
                    </p>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="px-8 py-3.5 bg-teal-800 text-white font-extrabold rounded-xl text-sm shadow-md hover:bg-teal-900 transition-colors"
                  >
                    Explore Our Services
                  </button>
                </div>
              </div>
            )}

            {/* SUPPORT PAGE (STANDALONE) */}
            {activeTab === 'support' && (
              <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-12 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6 text-left">
                    <div className="inline-block bg-teal-100 text-teal-800 rounded-full px-4 py-1.5 font-bold text-xs uppercase tracking-wider">
                      We Care For You
                    </div>
                    <h2 className="text-3xl font-black text-teal-955 leading-tight">
                      Available 24/7 for your health questions
                    </h2>
                    <p className="text-sm md:text-base text-teal-900 leading-relaxed font-semibold">
                      Need help tracking your cycle, updating your medical records locker, or finding a local doctor? Our dedicated support team and automated wellness guides are here to assist you at any time.
                    </p>

                    <div className="border border-teal-100 bg-teal-50/20 rounded-2xl p-5 space-y-3">
                      <h4 className="font-extrabold text-teal-950 text-xs sm:text-sm uppercase tracking-wider">📞 Emergency Helplines</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-bold text-teal-900">
                        <div className="p-3.5 bg-white border border-teal-100 rounded-xl">
                          <span className="block text-muted-foreground text-[10px] uppercase font-bold">Toll-Free Hotline</span>
                          <span className="text-sm font-black mt-0.5 block text-teal-950">1800-SAARTHI</span>
                        </div>
                        <div className="p-3.5 bg-white border border-teal-100 rounded-xl">
                          <span className="block text-muted-foreground text-[10px] uppercase font-bold">Email Help Desk</span>
                          <span className="text-sm font-black mt-0.5 block text-teal-950">support@saarthi.health</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <img 
                      src={aiSupportImg} 
                      alt="AI support robot helping lady" 
                      className="rounded-3xl shadow-elegant border border-teal-100 object-cover w-full max-h-[380px]"
                    />
                  </div>
                </div>

                {/* Support Form */}
                <div className="bg-white border border-teal-100/70 rounded-3xl p-6 md:p-8 max-w-xl mx-auto shadow-soft">
                  <h3 className="text-lg md:text-xl font-black text-teal-955 mb-3 text-center">Send Us a Support Message</h3>
                  
                  {supportSubmitted ? (
                    <div className="text-center py-6 space-y-2">
                      <div className="w-11 h-11 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-sm font-bold">✓</div>
                      <h4 className="font-bold text-teal-955 text-sm">Message Sent Successfully!</h4>
                      <p className="text-xs text-muted-foreground">Our support counselors will get back to you within 24 hours.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                        <div className="space-y-1">
                          <label className="text-[11px] sm:text-xs font-bold text-teal-900">Your Name</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Anjali" 
                            value={supportName}
                            onChange={(e) => setSupportName(e.target.value)}
                            className="w-full border border-teal-100 rounded-xl px-4 py-2.5 text-xs sm:text-sm bg-teal-50/10 focus:outline-none focus:ring-2 focus:ring-teal-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] sm:text-xs font-bold text-teal-900">Email Address</label>
                          <input 
                            type="email" 
                            required 
                            placeholder="e.g. anjali@email.com" 
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            className="w-full border border-teal-100 rounded-xl px-4 py-2.5 text-xs sm:text-sm bg-teal-50/10 focus:outline-none focus:ring-2 focus:ring-teal-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[11px] sm:text-xs font-bold text-teal-900">How can we help you?</label>
                        <textarea 
                          required 
                          rows={3} 
                          placeholder="Describe your question or issue..." 
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          className="w-full border border-teal-100 rounded-xl px-4 py-2 text-xs sm:text-sm bg-teal-50/10 focus:outline-none focus:ring-2 focus:ring-teal-800"
                        />
                      </div>

                      <button 
                        type="submit" 
                        className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-colors"
                      >
                        Submit Request
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* HOMEPAGE & USER FEATURE VIEWS */}
            {activeTab !== 'about' && activeTab !== 'support' && (
              <div>
                {isLoggedIn ? (
                  <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
                    {activeTab !== 'home' && (
                      <button 
                        onClick={() => setActiveTab('home')}
                        className="flex items-center gap-2 text-base font-black text-teal-850 hover:text-teal-950 transition-colors bg-teal-50 hover:bg-teal-100/80 px-5 py-2.5 rounded-xl border border-teal-100/80 w-fit mb-2"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Dashboard Home</span>
                      </button>
                    )}
                    {activeTab === 'home' && <DashboardHome user={user} onTabChange={setActiveTab} />}
                    {activeTab === 'cycle' && <SheCycle isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                    {activeTab === 'symptom' && <SymptoScan isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} onTabChange={setActiveTab} />}
                    {activeTab === 'gynconnect' && <GynConnect isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                    {activeTab === 'profile' && <UserProfile user={user} onUpdateUser={setUser} />}
                    {activeTab === 'vault' && <MediVault isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                    {activeTab === 'yojana' && <HealthYojana isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                    {activeTab === 'ngo' && <NGOHeal isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                    {activeTab === 'chat' && <CareCircle isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                    {activeTab === 'vax' && <VaxAlert isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                  </div>
                ) : (
                  /* HERO LANDING PAGE FOR NON-LOGGED IN GUEST USERS */
                  <div>
                    
                    {/* Render specific feature if opened by guest without login */}
                    {activeTab !== 'home' ? (
                      <div className="max-w-7xl mx-auto p-6 md:p-10">
                        {renderBackButton()}
                        {activeTab === 'cycle' && <SheCycle isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                        {activeTab === 'symptom' && <SymptoScan isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} onTabChange={setActiveTab} />}
                        {activeTab === 'gynconnect' && <GynConnect isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                        {activeTab === 'vault' && <MediVault isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                        {activeTab === 'yojana' && <HealthYojana isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                        {activeTab === 'ngo' && <NGOHeal isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                        {activeTab === 'chat' && <CareCircle isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                        {activeTab === 'vax' && <VaxAlert isLoggedIn={isLoggedIn} onRequireAuth={handleRequireAuth} />}
                      </div>
                    ) : (
                      /* MAIN LANDING VIEW FOR GUEST */
                      <div>
                        
                        {/* Hero Section - LIGHT TEAL MINIMALIST BACKGROUND */}
                        <section className="bg-gradient-to-br from-teal-50 via-teal-50/70 to-emerald-50 text-teal-955 py-20 px-6 border-b border-teal-100/70">
                          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6 text-left">
                              <div className="inline-block bg-teal-100/60 text-teal-900 rounded-full px-4 py-1.5 font-bold text-xs sm:text-sm uppercase tracking-wider">
                                Empowering Women's Health Since 2024
                              </div>
                              
                              <h1 className="text-4xl lg:text-5xl font-black leading-tight text-teal-950">
                                Your Trusted
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-600 py-1">
                                  Digital Saarthi
                                </span>
                                for Complete Women's Wellness
                              </h1>
                              
                              <p className="text-sm md:text-base text-teal-900 leading-relaxed max-w-xl font-bold">
                                From period tracking to doctor conversations, benefits discovery to peer support groups — experience simple, friendly health tracking designed for you.
                              </p>
                              
                              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button 
                                  onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                                  className="bg-teal-800 hover:bg-teal-900 text-white font-extrabold px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all text-xs sm:text-sm"
                                >
                                  Join Saarthi Today
                                  <ArrowRight className="w-4.5 h-4.5 text-white" />
                                </button>
                                <button 
                                  onClick={() => {
                                    const solutionsSection = document.getElementById('features');
                                    if (solutionsSection) {
                                      solutionsSection.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  }} 
                                  className="bg-white hover:bg-teal-50 border border-teal-200 text-teal-855 font-extrabold px-8 py-3.5 rounded-lg shadow-sm transition-all text-xs sm:text-sm"
                                >
                                  Explore Features
                                </button>
                              </div>
                            </div>
                            
                            <div className="relative animate-in zoom-in-95 duration-500">
                              <img 
                                src={heroWomen} 
                                alt="Professional women's health consultation"
                                className="rounded-3xl shadow-elegant w-full object-cover max-h-[380px] border border-teal-100"
                              />
                              <div className="absolute -bottom-6 -left-6 bg-white text-teal-955 rounded-xl p-4 shadow-elegant border border-teal-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center">
                                    <Star className="w-5 h-5 fill-teal-650 text-teal-650" />
                                  </div>
                                  <div>
                                    <div className="text-lg font-black text-teal-955">98%</div>
                                    <div className="text-xs text-teal-800 font-bold uppercase tracking-wider">Satisfaction Rate</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Interactive Features Section */}
                        <section id="features" className="py-20 bg-gradient-warm px-6 border-b border-teal-100/50">
                          <div className="max-w-6xl mx-auto space-y-12">
                            <div className="text-center space-y-3">
                              <div className="inline-block bg-teal-100 text-teal-800 rounded-full px-4 py-1.5 font-bold text-xs uppercase tracking-wider">
                                ⭐ Featured Solutions
                              </div>
                              <h2 className="text-3xl lg:text-4xl font-black text-teal-955">
                                Revolutionary Health Features
                              </h2>
                              <p className="text-sm text-teal-800/90 max-w-xl mx-auto leading-relaxed font-bold">
                                Experience cutting-edge women's healthcare technology designed by top medical experts. 
                                Click any card below to open and interact with the service directly.
                              </p>
                            </div>

                            {/* Minimal and Clean Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                              {features.map((feature, index) => (
                                <FeatureCard 
                                  key={index} 
                                  icon={feature.icon}
                                  title={feature.title}
                                  description={feature.description}
                                  onClick={() => handleFeatureAccess(feature.id)}
                                />
                              ))}
                            </div>
                          </div>
                        </section>

                        {/* CTA Section - LIGHT TEAL READABLE TEXT */}
                        <section className="py-20 bg-teal-50/50 border-b border-teal-100/70 px-6">
                          <div className="max-w-3xl mx-auto text-center space-y-5">
                            <h2 className="text-2xl sm:text-3xl font-black text-teal-955">
                              Ready to Start Your Health Journey?
                            </h2>
                            <p className="text-xs sm:text-sm text-teal-900/90 font-bold max-w-xl mx-auto leading-relaxed">
                              Join thousands of women who trust Saarthi for their health logs, vaccine scheduling, government schemes, and mental wellness support groups.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                              <button 
                                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                                className="bg-teal-800 hover:bg-teal-900 text-white font-extrabold px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all text-xs sm:text-sm"
                              >
                                Get Started Today
                                <ArrowRight className="w-4.5 h-4.5 text-white" />
                              </button>
                              <button 
                                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                                className="bg-white hover:bg-teal-50 border border-teal-200 text-teal-855 font-extrabold px-8 py-3.5 rounded-lg shadow-sm transition-all text-xs sm:text-sm"
                              >
                                Login to Account
                              </button>
                            </div>
                          </div>
                        </section>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Restored Normal Detailed Footer - DARK TEAL medical backdrop, rendered universally */}
          <footer id="contact" className="bg-teal-950 text-teal-100 py-16 px-6 border-t border-teal-900 mt-auto">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
              <div className="space-y-4">
                <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                  <SaarthiLogo />
                  <span>Saarthi Digital Hub</span>
                </h3>
                <p className="text-teal-200/80 text-xs sm:text-sm leading-relaxed font-semibold">
                  Empowering women through technology, clinical accessibility, and community support for better wellness outcomes.
                </p>
                <p className="text-xs text-teal-350 font-bold">ISO 27001 Certified Platform</p>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-white">Platform Modules</h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-teal-200/80 font-bold">
                  <li><button onClick={() => handleFeatureAccess('cycle')} className="hover:text-white text-left">SheCycle+ Log</button></li>
                  <li><button onClick={() => handleFeatureAccess('symptom')} className="hover:text-white text-left">SymptoScan AI</button></li>
                  <li><button onClick={() => handleFeatureAccess('gynconnect')} className="hover:text-white text-left">GynConnect Telehealth</button></li>
                  <li><button onClick={() => handleFeatureAccess('vault')} className="hover:text-white text-left">MediVault Locker</button></li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-white">Support & Help</h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-teal-200/80 font-bold">
                  <li><button onClick={() => setActiveTab('about')} className="hover:text-white text-left">System Trust Metrics</button></li>
                  <li><button onClick={() => handleFeatureAccess('ngo')} className="hover:text-white text-left">NGO Support network</button></li>
                  <li><button onClick={() => handleFeatureAccess('yojana')} className="hover:text-white text-left">Government welfare Programs</button></li>
                  <li><button onClick={() => setActiveTab('support')} className="hover:text-white text-left">Emergency support ticket</button></li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-white">Contact Info</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-teal-200/80 leading-relaxed font-bold">
                  <li>📞 Toll-free: 1800-SAARTHI (7227844)</li>
                  <li>✉️ Support: support@saarthi.health</li>
                  <li>📍 Location: Bangalore, Karnataka, India</li>
                  <li>🕒 Operational: 24/7 Clinical Hotline</li>
                </ul>
              </div>
            </div>
            
            <div className="max-w-6xl mx-auto border-t border-teal-900 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs text-teal-350/80 font-bold gap-4">
              <p>&copy; 2026 Saarthi Digital Health Hub. All rights reserved. Made with ❤️ for women's health.</p>
              <div className="flex gap-4">
                <a href="#" className="hover:underline">Privacy Policy</a>
                <span>•</span>
                <a href="#" className="hover:underline">Clinical Terms of Use</a>
                <span>•</span>
                <a href="#" className="hover:underline">Disclaimer Policy</a>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <AuthModal 
          mode={authMode} 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={handleLoginSuccess}
          setMode={setAuthMode}
        />
      )}
    </div>
  );
}

export default App;
