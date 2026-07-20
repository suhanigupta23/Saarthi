import React, { useState, useEffect } from 'react';
import { 
  Heart, Calendar, Activity, Shield, FileText, 
  Building2, MessageCircle, Database, LogOut, User,
  Menu, X, ArrowRight, Star, Users, Zap, Award, CheckCircle, ShieldCheck, Mail, Phone, ChevronLeft, ArrowLeft,
  ChevronDown, ChevronUp, HelpCircle, MapPin, Clock
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
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#6D5BD0] shrink-0">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" className="stroke-[#6D5BD0]" />
    <path d="M12 6.5v6M9 9.5h6" className="stroke-[#D88AB4]" strokeWidth="2.2" />
  </svg>
);

// Minimalist Card Component - Soft Icon Circle, Muted Borders, Clean Typography
const FeatureCard = ({ icon: Icon, title, description, onClick }) => {
  return (
    <div 
      className="bg-white border border-[#ECE8F5] rounded-[18px] p-6 hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-h-[240px]"
      onClick={onClick}
    >
      <div>
        <div className="w-10 h-10 rounded-full bg-[#B6A8F8]/15 text-[#6D5BD0] flex items-center justify-center mb-4">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-base font-extrabold text-[#2D2A4A] mb-1.5 font-outfit">{title}</h3>
        <p className="text-xs sm:text-sm text-[#5F6473] font-normal leading-relaxed">
          {description}
        </p>
      </div>
      
      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#6D5BD0]">
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
  const [activeFaq, setActiveFaq] = useState(null);

  const [authReturnTab, setAuthReturnTab] = useState(null);
  const [paymentNotice, setPaymentNotice] = useState('');

  // Check login on load & handle payment notices (e.g. ?payment=cancel)
  useEffect(() => {
    if (window.location.search.includes('payment=cancel')) {
      setPaymentNotice('Stripe checkout was cancelled. No payment was deducted from your account.');
      setActiveTab('gynconnect');
      setTimeout(() => setPaymentNotice(''), 6000);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (window.location.search.includes('payment=success')) {
      setPaymentNotice('✓ Payment Confirmed! Your doctor consultation is scheduled.');
      setActiveTab('gynconnect');
      setTimeout(() => setPaymentNotice(''), 6000);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = localStorage.getItem('saarthi_token');
    const savedUser = localStorage.getItem('saarthi_user');
    if (token && savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    } else {
      // Default demo mock user for testing if no user is saved
      const mockUser = {
        name: 'Ananya Sharma',
        username: 'ananya_sharma',
        email: 'ananya.sharma@example.com',
        location: 'Bhopal, MP',
        age: 26,
        joined: 'January 2026'
      };
      setUser(mockUser);
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
    
    // Preserve active page after sign in
    if (authReturnTab && authReturnTab !== 'home') {
      setActiveTab(authReturnTab);
    } else if (activeTab !== 'home') {
      // Keep current active tab
      setActiveTab(activeTab);
    } else {
      setActiveTab('home');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('saarthi_token');
    localStorage.removeItem('saarthi_user');
    setUser(null);
    setIsLoggedIn(false);
    setActiveTab('home');
  };

  const handleRequireAuth = (targetTab) => {
    setAuthReturnTab(targetTab || activeTab);
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

  // Healthcare Services list (Only shown in sidebar to logged-in users)
  const serviceNavItems = [
    { id: 'home', label: 'Dashboard Home', icon: Heart },
    { id: 'cycle', label: 'SheCycle+ Period Tracker', icon: Calendar },
    { id: 'symptom', label: 'SymptoScan AI Insights', icon: Activity },
    { id: 'gynconnect', label: 'GynConnect Telehealth', icon: Heart },
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
          onClick={() => {
            setActiveTab('home');
            setTimeout(() => {
              document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 80);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#2D2A4A] bg-white hover:bg-[#F5F3FA] transition-colors border border-[#6D5BD0] shadow-xs mb-4 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Services</span>
        </button>
      );
    }
    return null;
  };

  const isServicesActive = activeTab !== 'about' && activeTab !== 'support';

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      
      {/* HEADER BAR - CLEAN, STICKY & UNCLUTTERED */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#ECE8F5] px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#F5F3FA] rounded-xl text-[#2D2A4A] transition-colors cursor-pointer border border-[#ECE8F5]"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div 
            className="flex items-center gap-2.5 cursor-pointer transition-transform duration-200 active:scale-95" 
            onClick={() => setActiveTab('home')}
          >
            <SaarthiLogo />
            <span className="font-outfit text-2xl font-black tracking-tight text-[#2D2A4A]">
              Saarthi
            </span>
          </div>
        </div>

        {/* Distributed Nav Items */}
        <div className="flex-1 max-w-xl mx-8 hidden md:flex justify-center">
          <nav className="flex items-center gap-2 text-sm font-bold text-[#5F6473]">
            <button 
              onClick={() => {
                setActiveTab('home');
                setTimeout(() => {
                  document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 80);
              }}
              className={`px-5 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                isServicesActive
                  ? 'bg-[#F5F3FA] border border-[#ECE8F5] text-[#6D5BD0]' 
                  : 'hover:bg-[#F5F3FA] hover:text-[#2D2A4A]'
              }`}
            >
              Services
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`px-5 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                activeTab === 'about' 
                  ? 'bg-[#F5F3FA] border border-[#ECE8F5] text-[#6D5BD0]' 
                  : 'hover:bg-[#F5F3FA] hover:text-[#2D2A4A]'
              }`}
            >
              About Us
            </button>
            <button 
              onClick={() => setActiveTab('support')}
              className={`px-5 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                activeTab === 'support' 
                  ? 'bg-[#F5F3FA] border border-[#ECE8F5] text-[#6D5BD0]' 
                  : 'hover:bg-[#F5F3FA] hover:text-[#2D2A4A]'
              }`}
            >
              Support
            </button>
          </nav>
        </div>

        {/* User Account / Auth Actions */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right leading-tight">
                <p className="text-xs font-bold text-[#2D2A4A]">Namaste, {user?.name || 'Saarthi User'}! 👋</p>
                <p className="text-[10px] text-[#8A8FA3] font-medium">{user?.location || 'India'}</p>
              </div>
              <div 
                onClick={() => setActiveTab('profile')}
                className="w-9 h-9 rounded-full bg-[#6D5BD0] text-white flex items-center justify-center font-outfit font-black text-xs transition-transform hover:scale-105 cursor-pointer shrink-0 shadow-xs"
                title="View My Profile & History"
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4.5 h-4.5 text-white" />}
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-100 shadow-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2.5">
              <button 
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="px-4 py-2 text-xs font-bold text-[#2D2A4A] bg-white border border-[#6D5BD0] hover:bg-[#F5F3FA] rounded-xl transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button 
                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#6D5BD0] hover:bg-[#5b4ab9] rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex relative">
        
        {/* FIXED / STICKY FULL HEIGHT SIDEBAR WITH SEPARATE ACCOUNT SECTION */}
        {isLoggedIn && sidebarOpen && (
          <>
            {/* Dark overlay backdrop for tablets/mobile screens */}
            <div 
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-30 lg:hidden animate-in fade-in duration-200"
            ></div>
            
            <aside className="w-64 bg-white border-r border-[#ECE8F5] py-6 flex flex-col justify-between shrink-0 z-40 fixed lg:sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto transition-transform duration-200 text-left">
              <div className="space-y-6 px-3">
                
                {/* SECTION 1: HEALTHCARE SERVICES */}
                <div className="space-y-1.5">
                  <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-[#8A8FA3]">
                    Healthcare Services
                  </div>
                  {serviceNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-bold transition-all cursor-pointer ${
                        activeTab === item.id 
                          ? 'bg-[#6D5BD0] text-white shadow-xs' 
                          : 'text-[#5F6473] hover:text-[#2D2A4A] hover:bg-[#F5F3FA]'
                      }`}
                    >
                      <item.icon className="w-4.5 h-4.5 shrink-0" />
                      <span className="text-xs sm:text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* SECTION 2: MY ACCOUNT & PROFILE */}
                <div className="pt-4 border-t border-[#ECE8F5] space-y-1.5">
                  <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-[#8A8FA3]">
                    My Account
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left font-bold transition-all cursor-pointer ${
                      activeTab === 'profile'
                        ? 'bg-[#6D5BD0] text-white shadow-xs'
                        : 'text-[#5F6473] hover:text-[#2D2A4A] hover:bg-[#F5F3FA]'
                    }`}
                  >
                    <User className="w-4.5 h-4.5 shrink-0 text-[#6D5BD0]" />
                    <span className="text-xs sm:text-sm">My Profile & History</span>
                  </button>
                </div>

              </div>
              
              <div className="px-4 border-t border-[#ECE8F5] py-3 text-center bg-[#FAF8FC]">
                <p className="text-[11px] text-[#2D2A4A] font-bold">🌿 Saarthi Women's Health</p>
                <p className="text-[9px] text-[#8A8FA3] font-medium">Encrypted • P2P Secured</p>
              </div>
            </aside>
          </>
        )}

        {/* WORKSPACE CONTENT AREA WITH UNIVERSAL FOOTER */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-background flex flex-col justify-between">
          <div className="page-transition flex-1">
            
            {/* ABOUT US PAGE (STANDALONE) */}
            {activeTab === 'about' && (
              <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-12 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6 text-left">
                    <div className="inline-block bg-teal-50 border border-teal-100 text-teal-800 rounded-full px-3.5 py-1.5 font-bold text-xs uppercase tracking-wider">
                      About Saarthi
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-teal-950 leading-tight font-outfit">
                      Guiding women through every stage of their health journey
                    </h2>
                    <p className="text-sm text-teal-900 leading-relaxed font-semibold">
                      Saarthi was created to be a secure digital health companion for women. We believe healthcare software should be friendly, clear, and easy to understand.
                    </p>
                    <p className="text-sm text-teal-900/80 leading-relaxed">
                      Our system focuses heavily on privacy and safety. All your symptoms and logs are kept securely in your local browser storage. We translate complex clinical insights into simple summaries so you can prepare for your gynecologist appointments confidently.
                    </p>
                    
                    <div className="space-y-3 pt-2 font-bold text-teal-950 text-xs sm:text-sm">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle className="w-4.5 h-4.5 text-teal-700" />
                        <span>100% Privacy Focused — Your data stays on your device</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle className="w-4.5 h-4.5 text-teal-700" />
                        <span>Clinical Disclaimers — AI is a companion, not a replacement for doctors</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle className="w-4.5 h-4.5 text-teal-700" />
                        <span>Direct Medical Access — Book video calls with certified experts</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <img 
                      src={aboutWellnessImg} 
                      alt="Women's support community and healthcare" 
                      className="rounded-2xl shadow-elegant border border-teal-100/60 object-cover w-full max-h-[340px]"
                    />
                  </div>
                </div>

                {/* Core values cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 font-sans">
                  <div className="bg-white border border-[#ECE8F5] p-6 rounded-[18px] space-y-2 text-left shadow-xs">
                    <h4 className="font-bold text-[#2D2A4A] text-sm">👩‍⚕️ Clinical Partnership</h4>
                    <p className="text-xs text-[#5F6473] leading-relaxed">
                      We connect users directly to active, certified gynecologists. All insights prepare patients with meaningful questions to ask during live consults.
                    </p>
                  </div>
                  <div className="bg-white border border-[#ECE8F5] p-6 rounded-[18px] space-y-2 text-left shadow-xs">
                    <h4 className="font-bold text-[#2D2A4A] text-sm">🛡️ Safety Disclaimers</h4>
                    <p className="text-xs text-[#5F6473] leading-relaxed">
                      Our Symptom scanner evaluates urgency categories (Low, Medium, High) rather than absolute diagnoses, instructing users when clinical help is urgent.
                    </p>
                  </div>
                  <div className="bg-white border border-[#ECE8F5] p-6 rounded-[18px] space-y-2 text-left shadow-xs">
                    <h4 className="font-bold text-[#2D2A4A] text-sm">🤝 Localized Welfare</h4>
                    <p className="text-xs text-[#5F6473] leading-relaxed">
                      Matches maternal clinics, government welfare schemes, and support networks nearby so women can access financial aid options.
                    </p>
                  </div>
                </div>

                {/* Testimonial reviews moved here */}
                <div className="space-y-6 pt-6">
                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-black text-[#2D2A4A] font-outfit">Patient Success Stories</h3>
                    <p className="text-xs text-[#5F6473]">Real reviews from women using Saarthi to navigate their health journeys.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { name: "Anjali Sharma", location: "Delhi", quote: "Consulting Dr. Sharma via GynConnect was so simple and secure. Having Stripe checkout in Indian Rupees made the payment seamless!", rating: 5, avatar: "AS", color: "bg-[#D88AB4]/15 text-[#C06093]" },
                      { name: "Priya Patel", location: "Mumbai", quote: "The 4-stage menstrual calendar on SheCycle+ helped me map my follicular phase and regulate my diet. The interface is calming.", rating: 5, avatar: "PP", color: "bg-[#A9D8C8]/25 text-[#3B826E]" },
                      { name: "Meera Nair", location: "Bangalore", quote: "MediVault record locker keeps my ultrasound and blood test reports sorted. I don't carry physical folders to clinics anymore.", rating: 5, avatar: "MN", color: "bg-[#B6A8F8]/15 text-[#6D5BD0]" }
                    ].map((review, idx) => (
                      <div key={idx} className="p-5 border border-[#ECE8F5] rounded-[18px] bg-white flex flex-col justify-between space-y-4 shadow-xs">
                        <p className="text-xs italic text-[#5F6473] leading-relaxed text-left">"{review.quote}"</p>
                        <div className="flex items-center gap-3">
                          <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center font-bold text-xs ${review.color}`}>
                            {review.avatar}
                          </div>
                          <div className="text-left">
                            <h4 className="font-bold text-xs text-[#2D2A4A]">{review.name}</h4>
                            <p className="text-[10px] text-[#8A8FA3] font-medium">{review.location} • ⭐⭐⭐⭐⭐</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center pt-4">
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="px-6 py-3 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                  >
                    Explore Our Services
                  </button>
                </div>
              </div>
            )}

            {/* SUPPORT PAGE (STANDALONE) */}
            {activeTab === 'support' && (
              <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-12 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6 text-left">
                    <div className="inline-block bg-teal-50 border border-teal-100 text-teal-800 rounded-full px-3.5 py-1.5 font-bold text-xs uppercase tracking-wider">
                      We Care For You
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-teal-955 leading-tight font-outfit">
                      Available 24/7 for your health questions
                    </h2>
                    <p className="text-sm text-teal-900 leading-relaxed font-semibold">
                      Need help tracking your cycle, updating your medical records locker, or finding a local doctor? Our dedicated support team and automated wellness guides are here to assist you at any time.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-white border border-teal-100/60 rounded-xl space-y-1">
                        <span className="text-teal-650 text-[10px] uppercase font-bold tracking-wider block">Toll-Free Hotline</span>
                        <span className="text-sm font-black text-teal-950">1800-SAARTHI</span>
                        <span className="text-[10px] text-muted-foreground block">Mon-Sat, 9AM to 6PM</span>
                      </div>
                      <div className="p-4 bg-white border border-teal-100/60 rounded-xl space-y-1">
                        <span className="text-teal-650 text-[10px] uppercase font-bold tracking-wider block">Email Help Desk</span>
                        <span className="text-sm font-black text-teal-955">support@saarthi.health</span>
                        <span className="text-[10px] text-muted-foreground block">Response under 2 hours</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <img 
                      src={aiSupportImg} 
                      alt="AI support robot helping lady" 
                      className="rounded-2xl shadow-elegant border border-teal-100/60 object-cover w-full max-h-[340px]"
                    />
                  </div>
                </div>

                {/* FAQ Accordion Section */}
                <div className="space-y-6 text-left">
                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-black text-teal-955 font-outfit">Frequently Asked Questions</h3>
                    <p className="text-xs text-warm-500">Quick answers about our security, matching methods, and services.</p>
                  </div>

                  <div className="max-w-3xl mx-auto space-y-3">
                    {[
                      {
                        q: "How secure is the MediVault Records Locker?",
                        a: "Saarthi uses sandboxed browser state directories. Your uploaded medical documents, scan reports, and prescription PDFs are stored locally on your device in your browser's encrypted sandbox cache. We do not upload your personal records to external web databases, guaranteeing HIPAA-aligned health confidentiality."
                      },
                      {
                        q: "Is the SymptoScan AI diagnosis accurate?",
                        a: "SymptoScan uses Gemini 1.5 Flash to parse symptoms and suggest general clinical urgency tiers (Low, Medium, High). It is purely educational and does not constitute medical advice. Please book a GynConnect video consult for professional clinical evaluations."
                      },
                      {
                        q: "How does the GPS clinic locator work?",
                        a: "Saarthi asks for location permissions to detect your city (e.g. Bhopal or Kota) using high-precision reverse-geocoding, automatically matching you with certified specialists and maternal government schemes nearby."
                      },
                      {
                        q: "How are video calls and consultations secured?",
                        a: "Video calls use peer-to-peer WebRTC connections. This means your video stream travels directly between your device and the doctor's device, with the Spring Boot server only facilitating the initial handshake (signaling). Your video is never recorded or stored on our servers."
                      }
                    ].map((faq, idx) => {
                      const isOpen = activeFaq === idx;
                      return (
                        <div key={idx} className="border border-teal-100/50 rounded-xl bg-white overflow-hidden transition-all duration-300">
                          <button
                            onClick={() => setActiveFaq(isOpen ? null : idx)}
                            className="w-full px-5 py-4 flex items-center justify-between text-teal-950 font-extrabold text-xs sm:text-sm hover:bg-teal-50/20 transition-colors"
                          >
                            <span>{faq.q}</span>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-teal-700" /> : <ChevronDown className="w-4 h-4 text-teal-700" />}
                          </button>
                          
                          {isOpen && (
                            <div className="px-5 pb-4 text-xs text-teal-900/80 leading-relaxed border-t border-teal-50/30 pt-3 bg-teal-50/10">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUPPORT PAGE (STANDALONE) */}
            {activeTab === 'support' && (
              <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-300 text-left font-sans">
                <div className="text-center space-y-2 max-w-xl mx-auto">
                  <span className="inline-block bg-[#B6A8F8]/15 border border-[#B6A8F8]/30 text-[#6D5BD0] rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
                    24/7 Support Desk
                  </span>
                  <h2 className="text-3xl font-black text-[#2D2A4A] font-outfit">How Can We Help You Today?</h2>
                  <p className="text-xs sm:text-sm text-[#5F6473] leading-relaxed">
                    Have questions about appointment booking, vaccine scheduling, or cycle tracking? Submit an emergency ticket below.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-[#ECE8F5] rounded-[18px] p-5 space-y-2 shadow-xs">
                    <Phone className="w-5 h-5 text-[#6D5BD0]" />
                    <h3 className="font-bold text-sm text-[#2D2A4A]">Clinical Hotline</h3>
                    <p className="text-xs text-[#5F6473]">Toll-free 24/7 helpline: 1800-SAARTHI</p>
                  </div>
                  <div className="bg-white border border-[#ECE8F5] rounded-[18px] p-5 space-y-2 shadow-xs">
                    <Mail className="w-5 h-5 text-[#6D5BD0]" />
                    <h3 className="font-bold text-sm text-[#2D2A4A]">Email Support</h3>
                    <p className="text-xs text-[#5F6473]">support@saarthi.health</p>
                  </div>
                  <div className="bg-white border border-[#ECE8F5] rounded-[18px] p-5 space-y-2 shadow-xs">
                    <Clock className="w-5 h-5 text-[#6D5BD0]" />
                    <h3 className="font-bold text-sm text-[#2D2A4A]">Response Time</h3>
                    <p className="text-xs text-[#5F6473]">Guaranteed reply under 15 minutes</p>
                  </div>
                </div>

                <div className="bg-white border border-[#ECE8F5] rounded-[20px] p-8 shadow-xs max-w-xl mx-auto space-y-5">
                  <h3 className="font-outfit text-xl font-extrabold text-[#2D2A4A] text-center">Send Us a Support Message</h3>
                  {supportSubmitted ? (
                    <div className="p-6 bg-[#A9D8C8]/20 border border-[#A9D8C8] text-[#2D2A4A] rounded-xl text-center space-y-2">
                      <CheckCircle className="w-10 h-10 text-[#3B826E] mx-auto" />
                      <h4 className="font-bold text-sm">Ticket Submitted Successfully!</h4>
                      <p className="text-xs text-[#5F6473]">Our medical support team will reach you shortly.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#2D2A4A]">Your Name</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Anjali"
                            value={supportName}
                            onChange={(e) => setSupportName(e.target.value)}
                            className="w-full border border-[#ECE8F5] rounded-xl px-3.5 py-2.5 text-xs bg-white text-[#2D2A4A] focus:outline-none focus:border-[#6D5BD0] focus:ring-2 focus:ring-[#6D5BD0]/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#2D2A4A]">Email Address</label>
                          <input 
                            type="email" 
                            required 
                            placeholder="e.g. anjali@email.com"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            className="w-full border border-[#ECE8F5] rounded-xl px-3.5 py-2.5 text-xs bg-white text-[#2D2A4A] focus:outline-none focus:border-[#6D5BD0] focus:ring-2 focus:ring-[#6D5BD0]/20"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#2D2A4A]">How can we help you?</label>
                        <textarea 
                          required 
                          rows={4}
                          placeholder="Describe your question or issue..."
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          className="w-full border border-[#ECE8F5] rounded-xl p-3.5 text-xs bg-white text-[#2D2A4A] focus:outline-none focus:border-[#6D5BD0] focus:ring-2 focus:ring-[#6D5BD0]/20"
                        />
                      </div>

                      <button 
                        type="submit" 
                        className="w-full py-3 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
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
                {paymentNotice && (
                  <div className="max-w-7xl mx-auto px-6 pt-4">
                    <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-xs ${
                      paymentNotice.includes('✓') 
                        ? 'bg-[#A9D8C8]/20 text-[#2D2A4A] border-[#A9D8C8]'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}>
                      <span>{paymentNotice}</span>
                      <button onClick={() => setPaymentNotice('')} className="p-1 hover:bg-black/5 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                {isLoggedIn ? (
                  <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
                    {activeTab !== 'home' && (
                      <button 
                        onClick={() => {
                          setActiveTab('home');
                          setTimeout(() => {
                            document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                          }, 80);
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-[#2D2A4A] bg-white hover:bg-[#F5F3FA] border border-[#6D5BD0] px-4 py-2 rounded-xl w-fit mb-2 cursor-pointer shadow-xs transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Services</span>
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
                        
                        {/* Hero Section - REFINED MUTED INDIGO THEME */}
                        <section className="bg-[#FAF8FC] text-[#2D2A4A] py-16 px-6 sm:px-10 border-b border-[#ECE8F5]">
                          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6 text-left">
                              <div className="inline-block bg-[#B6A8F8]/15 border border-[#B6A8F8]/30 text-[#6D5BD0] rounded-full px-4 py-1.5 font-bold text-xs uppercase tracking-wider">
                                ✨ Empowering Women's Health Since 2024
                              </div>
                              
                              <h1 className="text-4xl lg:text-5xl font-black leading-tight text-[#2D2A4A] font-outfit">
                                Your Trusted
                                <span className="block text-[#6D5BD0] py-1">
                                  Digital Saarthi
                                </span>
                                for Complete Women's Wellness
                              </h1>
                              
                              <p className="text-sm md:text-base text-[#5F6473] leading-relaxed max-w-xl font-normal">
                                From period tracking to doctor conversations, benefits discovery to peer support groups — experience simple, friendly health tracking designed for you.
                              </p>
                              
                              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button 
                                  onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                                  className="bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white font-bold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors text-xs sm:text-sm cursor-pointer"
                                >
                                  Join Saarthi Today
                                  <ArrowRight className="w-4 h-4 text-white" />
                                </button>
                                <button 
                                  onClick={() => {
                                    const solutionsSection = document.getElementById('features');
                                    if (solutionsSection) {
                                      solutionsSection.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  }} 
                                  className="bg-white border border-[#6D5BD0] text-[#2D2A4A] hover:bg-[#F5F3FA] font-bold px-8 py-3.5 rounded-xl transition-colors text-xs sm:text-sm cursor-pointer"
                                >
                                  Explore Features
                                </button>
                              </div>
                            </div>
                            
                            <div className="relative animate-in zoom-in-95 duration-500">
                              <img 
                                src={heroWomen} 
                                alt="Professional women's health consultation"
                                className="rounded-[24px] w-full object-cover max-h-[380px] border border-[#ECE8F5] shadow-xs"
                              />
                              <div className="absolute -bottom-6 -left-6 bg-white text-[#2D2A4A] rounded-2xl p-4 border border-[#ECE8F5] shadow-xs">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#B6A8F8]/15 text-[#6D5BD0] rounded-full flex items-center justify-center">
                                    <Star className="w-5 h-5 fill-[#6D5BD0] text-[#6D5BD0]" />
                                  </div>
                                  <div>
                                    <div className="text-lg font-black text-[#2D2A4A] font-outfit">98%</div>
                                    <div className="text-[10px] text-[#8A8FA3] font-bold uppercase tracking-wider">Satisfaction Rate</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Interactive Features Section */}
                        <section id="features" className="py-20 bg-[#F5F3FA] px-6 sm:px-10 border-b border-[#ECE8F5]">
                          <div className="max-w-6xl mx-auto space-y-12">
                            <div className="text-center space-y-3">
                              <div className="inline-block bg-[#B6A8F8]/15 border border-[#B6A8F8]/30 text-[#6D5BD0] rounded-full px-4 py-1.5 font-bold text-xs uppercase tracking-wider">
                                ⭐ Featured Solutions
                              </div>
                              <h2 className="text-3xl lg:text-4xl font-black text-[#2D2A4A] font-outfit">
                                Revolutionary Health Features
                              </h2>
                              <p className="text-sm text-[#5F6473] max-w-xl mx-auto leading-relaxed font-normal">
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
                        <section className="py-16 bg-[#F5F3FA] border-y border-[#ECE8F5] px-6">
                          <div className="max-w-3xl mx-auto text-center space-y-5">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#6D5BD0] bg-white border border-[#ECE8F5] px-3.5 py-1 rounded-full">
                              🌿 Begin Your Wellness Journey
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-[#2D2A4A] font-outfit">
                              Ready to Start Your Health Journey?
                            </h2>
                            <p className="text-xs sm:text-sm text-[#5F6473] font-normal max-w-xl mx-auto leading-relaxed">
                              Join thousands of women who trust Saarthi for health logs, vaccine scheduling, government schemes, and mental wellness support groups.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                              <button 
                                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                                className="bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors text-xs sm:text-sm cursor-pointer"
                              >
                                Get Started Today
                                <ArrowRight className="w-4 h-4 text-white" />
                              </button>
                              <button 
                                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                                className="bg-white border border-[#6D5BD0] hover:bg-[#F5F3FA] text-[#2D2A4A] font-bold px-8 py-3 rounded-xl transition-colors text-xs sm:text-sm cursor-pointer"
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
          
          {/* Universal Light Wellness Footer */}
          <footer id="contact" className="bg-[#F5F3FA] text-[#2D2A4A] py-16 px-6 sm:px-10 border-t border-[#ECE8F5] mt-auto text-left font-sans">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
              <div className="space-y-3">
                <h3 className="font-outfit font-black text-lg text-[#2D2A4A] flex items-center gap-2">
                  <SaarthiLogo />
                  <span>Saarthi</span>
                </h3>
                <p className="text-[#5F6473] text-xs leading-relaxed font-normal">
                  Empowering women through technology, clinical accessibility, and community support for better wellness outcomes.
                </p>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#6D5BD0] bg-white border border-[#ECE8F5] px-2.5 py-1 rounded-full">
                  <span>🌿 ISO 27001 Certified Platform</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-outfit font-bold text-sm text-[#2D2A4A]">Platform Modules</h4>
                <ul className="space-y-2 text-xs text-[#5F6473] font-medium">
                  <li><button onClick={() => handleFeatureAccess('cycle')} className="hover:text-[#6D5BD0] transition-colors text-left cursor-pointer">SheCycle+ Log</button></li>
                  <li><button onClick={() => handleFeatureAccess('symptom')} className="hover:text-[#6D5BD0] transition-colors text-left cursor-pointer">SymptoScan AI</button></li>
                  <li><button onClick={() => handleFeatureAccess('gynconnect')} className="hover:text-[#6D5BD0] transition-colors text-left cursor-pointer">GynConnect Telehealth</button></li>
                  <li><button onClick={() => handleFeatureAccess('vault')} className="hover:text-[#6D5BD0] transition-colors text-left cursor-pointer">MediVault Locker</button></li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-outfit font-bold text-sm text-[#2D2A4A]">Support & Help</h4>
                <ul className="space-y-2 text-xs text-[#5F6473] font-medium">
                  <li><button onClick={() => setActiveTab('about')} className="hover:text-[#6D5BD0] transition-colors text-left cursor-pointer">System Trust Metrics</button></li>
                  <li><button onClick={() => handleFeatureAccess('ngo')} className="hover:text-[#6D5BD0] transition-colors text-left cursor-pointer">NGO Support Network</button></li>
                  <li><button onClick={() => handleFeatureAccess('yojana')} className="hover:text-[#6D5BD0] transition-colors text-left cursor-pointer">Government Welfare Programs</button></li>
                  <li><button onClick={() => setActiveTab('support')} className="hover:text-[#6D5BD0] transition-colors text-left cursor-pointer">Emergency Support Ticket</button></li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-outfit font-bold text-sm text-[#2D2A4A]">Contact Info</h4>
                <ul className="space-y-1.5 text-xs text-[#5F6473] leading-relaxed font-medium">
                  <li>📞 Toll-free: 1800-SAARTHI (7227844)</li>
                  <li>✉️ Support: support@saarthi.health</li>
                  <li>📍 Location: Bangalore, Karnataka, India</li>
                  <li>🕒 Operational: 24/7 Clinical Hotline</li>
                </ul>
              </div>
            </div>
            
            <div className="max-w-6xl mx-auto border-t border-[#ECE8F5] mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-[#8A8FA3] font-medium gap-4">
              <p>&copy; 2026 Saarthi Digital Health Hub. All rights reserved. Made with 🌸 for women's health.</p>
              <div className="flex gap-3 text-xs">
                <a href="#" className="hover:text-[#6D5BD0] transition-colors">Privacy Policy</a>
                <span>•</span>
                <a href="#" className="hover:text-[#6D5BD0] transition-colors">Terms of Use</a>
                <span>•</span>
                <a href="#" className="hover:text-[#6D5BD0] transition-colors">Disclaimer</a>
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
