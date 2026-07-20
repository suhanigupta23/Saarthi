import React, { useEffect, useState } from 'react';
import { 
  Calendar, Heart, FileText, Users, TrendingUp, 
  HelpCircle, ExternalLink, Activity, Database, 
  Building2, MessageCircle, Shield, Sparkles 
} from 'lucide-react';
import HelpPopup from './HelpPopup.jsx';

const DashboardHome = ({ user, onTabChange }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [cycleDay, setCycleDay] = useState(0);
  const [cyclePhase, setCyclePhase] = useState('Not Tracked');
  const [daysUntilNext, setDaysUntilNext] = useState(0);

  useEffect(() => {
    // Read cached period details from localstorage to calculate current status
    const savedDate = localStorage.getItem('periodStartDate');
    if (savedDate) {
      const startDate = new Date(savedDate);
      const today = new Date();
      const diffTime = Math.abs(today - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const day = (diffDays % 28) + 1;
      setCycleDay(day);

      if (day >= 1 && day <= 6) setCyclePhase('Menstrual Phase 🩸');
      else if (day >= 7 && day <= 13) setCyclePhase('Follicular Phase 🌿');
      else if (day === 14) setCyclePhase('Ovulation Day 🌸');
      else setCyclePhase('Luteal Phase 🍂');

      setDaysUntilNext(28 - day);
    }
  }, []);

  const personalizedFeatures = [
    {
      id: "cycle",
      icon: Calendar,
      title: "SheCycle+ Tracker",
      description: "Track your period dates, log daily moods, and get natural dietary advice.",
      progress: cycleDay > 0 ? 85 : 0,
      lastUsed: cycleDay > 0 ? "Logged recently" : "Never used",
      bgClass: "bg-rose-50/60 hover:bg-rose-50 border-rose-100/70",
      iconBg: "bg-rose-100 text-rose-700",
      progressColor: "bg-rose-500",
      used: cycleDay > 0
    },
    {
      id: "symptom",
      icon: Activity,
      title: "SymptoScan AI",
      description: "Evaluate your symptoms in simple terms to check for underlying conditions.",
      progress: 70,
      lastUsed: "2 days ago",
      bgClass: "bg-blue-50/60 hover:bg-blue-50 border-blue-100/70",
      iconBg: "bg-blue-100 text-blue-700",
      progressColor: "bg-blue-500",
      used: true
    },
    {
      id: "gynconnect",
      icon: Heart,
      title: "GynConnect Consult",
      description: "Book direct video calls or text chats with verified health doctors.",
      progress: 60,
      lastUsed: "1 week ago",
      bgClass: "bg-emerald-50/60 hover:bg-emerald-50 border-emerald-100/70",
      iconBg: "bg-emerald-100 text-emerald-700",
      progressColor: "bg-emerald-500",
      used: true
    },
    {
      id: "vault",
      icon: Database,
      title: "MediVault Records",
      description: "Store your prescriptions and medical files safely in one place.",
      progress: 90,
      lastUsed: "1 day ago",
      bgClass: "bg-purple-50/60 hover:bg-purple-50 border-purple-100/70",
      iconBg: "bg-purple-100 text-purple-700",
      progressColor: "bg-purple-500",
      used: true
    },
    {
      id: "yojana",
      icon: FileText,
      title: "HealthYojana",
      description: "Find government healthcare benefits and schemes for you.",
      progress: 0,
      lastUsed: "Never used",
      bgClass: "bg-amber-50/60 hover:bg-amber-50 border-amber-100/70",
      iconBg: "bg-amber-100 text-amber-700",
      progressColor: "bg-amber-550",
      used: false
    },
    {
      id: "ngo",
      icon: Building2,
      title: "NGOHeal Network",
      description: "Get assistance from local community support groups.",
      progress: 0,
      lastUsed: "Never used",
      bgClass: "bg-teal-50/60 hover:bg-teal-50 border-teal-100/70",
      iconBg: "bg-teal-100 text-teal-700",
      progressColor: "bg-teal-600",
      used: false
    },
    {
      id: "chat",
      icon: MessageCircle,
      title: "CareCircle Peer",
      description: "Talk privately in safe online groups with other women.",
      progress: 75,
      lastUsed: "3 days ago",
      bgClass: "bg-indigo-50/60 hover:bg-indigo-50 border-indigo-100/70",
      iconBg: "bg-indigo-100 text-indigo-700",
      progressColor: "bg-indigo-500",
      used: true
    },
    {
      id: "vax",
      icon: Shield,
      title: "VaxAlert Hub",
      description: "Get a personal vaccine scheduler with automated reminders.",
      progress: 0,
      lastUsed: "Never used",
      bgClass: "bg-pink-50/60 hover:bg-pink-50 border-pink-100/70",
      iconBg: "bg-pink-100 text-pink-700",
      progressColor: "bg-pink-500",
      used: false
    }
  ];

  const recentActivity = [
    { 
      type: "period",
      message: cycleDay > 0 ? `Period tracking updated - Day ${cycleDay} of cycle` : "SheCycle tracking not initialized",
      time: "2 hours ago",
      icon: Calendar
    },
    {
      type: "consultation", 
      message: "Dr. Sharma consultation completed successfully",
      time: "1 day ago",
      icon: Heart
    },
    {
      type: "community",
      message: "New message in PCOS Support Group",
      time: "2 days ago", 
      icon: Users
    },
    {
      type: "health",
      message: "Health records updated in MediVault",
      time: "3 days ago",
      icon: Database
    }
  ];

  const healthInsights = [
    {
      title: "Next Period Prediction",
      value: cycleDay > 0 ? `In ${daysUntilNext} days` : "Not Tracked",
      trend: cycleDay > 0 ? "On track" : "Log starting date",
      positive: cycleDay > 0
    },
    {
      title: "Health Scan History",
      value: "85/100",
      trend: "Excellent vitals match",
      positive: true
    },
    {
      title: "Account Status",
      value: "Verified",
      trend: "Saarthi Partner User",
      positive: true
    }
  ];

  return (
    <>
      <div className="space-y-10 animate-in fade-in duration-300">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100/70 text-teal-955 rounded-2xl p-6 md:p-10 shadow-soft relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-teal-100/20 rounded-full blur-2xl"></div>
          <div className="relative space-y-3 text-left">
            <div className="inline-flex items-center gap-1.5 bg-teal-100/60 rounded-full px-3.5 py-1.5 text-xs font-bold text-teal-900">
              <Sparkles className="w-3.5 h-3.5 text-teal-800" />
              <span>Saarthi Health Hub</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-teal-950">
              Welcome back, {user?.name || 'Saarthi User'}! 👋
            </h1>
            <p className="text-teal-900 text-base max-w-2xl font-bold leading-relaxed">
              Here is your personalized women's health dashboard. Click on any module below to access integrated diagnostic and wellness features directly.
            </p>
          </div>
        </div>

        {/* Health Insights */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-teal-950 text-left font-outfit">Health Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {healthInsights.map((insight, index) => (
              <div key={index} className="card-elegant p-6 border rounded-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-muted-foreground text-xs mb-1 uppercase tracking-wider text-left">
                    {insight.title}
                  </h3>
                  <div className="text-3xl font-black text-foreground mb-1 text-left">
                    {insight.value}
                  </div>
                </div>
                <div className={`text-xs font-black mt-2 text-left ${insight.positive ? 'text-emerald-700' : 'text-orange-700'}`}>
                  {insight.trend}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Personalized Feature Directory */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-teal-950 text-left font-outfit">Your Feature Directory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {personalizedFeatures.map((feature, index) => (
              <div 
                key={index} 
                className={`border rounded-2xl p-7 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between min-h-[270px] text-left ${feature.bgClass}`}
                onClick={() => onTabChange(feature.id)}
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.iconBg}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-teal-955 mb-2 text-left text-base">{feature.title}</h3>
                  <p className="text-sm text-teal-900 font-semibold mb-4 text-left leading-relaxed">{feature.description}</p>
                  

                </div>
                
                <div>
                  <div className="border-t border-black/5 pt-3 flex justify-between items-center text-xs text-teal-900 font-bold">
                    <span>Activity: {feature.lastUsed}</span>
                    <span className="flex items-center gap-1 text-teal-700">
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Patient Success Stories */}
        <section className="bg-white border border-teal-100 rounded-2xl p-6 md:p-10 shadow-soft space-y-6 text-left">
          <div>
            <h2 className="text-2xl font-black text-teal-950 font-outfit">Patient Success Stories</h2>
            <p className="text-sm text-warm-500 mt-1">Real reviews from women using Saarthi to navigate their clinical journeys.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Anjali Sharma", location: "Delhi", quote: "Consulting Dr. Sharma via GynConnect was so simple and secure. Having Stripe checkout in Indian Rupees made the payment seamless!", rating: 5, avatar: "AS", color: "bg-rose-100 text-rose-800" },
              { name: "Priya Patel", location: "Mumbai", quote: "The 4-stage menstrual calendar on SheCycle+ helped me map my follicular phase and regulate my diet. The interface is calming.", rating: 5, avatar: "PP", color: "bg-emerald-100 text-emerald-800" },
              { name: "Meera Nair", location: "Bangalore", quote: "MediVault record locker keeps my ultrasound and blood test reports sorted. I don't carry physical folders to clinics anymore.", rating: 5, avatar: "MN", color: "bg-blue-100 text-blue-800" }
            ].map((review, idx) => (
              <div key={idx} className="p-5 border border-warm-150 rounded-xl bg-warm-50/30 flex flex-col justify-between space-y-4 hover:shadow-elegant transition-all">
                <p className="text-sm italic text-warm-700 leading-relaxed">"{review.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${review.color}`}>
                    {review.avatar}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-teal-950">{review.name}</h4>
                    <p className="text-[11px] text-warm-450 font-semibold">{review.location} • ⭐⭐⭐⭐⭐</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity & Help Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <section className="flex flex-col space-y-4">
            <h2 className="text-2xl font-black text-teal-950 text-left font-outfit">Recent Activity Logs</h2>
            <div className="card-elegant p-6 border rounded-xl flex-1 space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 text-xs leading-relaxed border-b border-border/30 pb-3 last:border-b-0 last:pb-0 text-left">
                  <div className="w-8 h-8 rounded-full bg-accent/25 flex items-center justify-center shrink-0">
                    <activity.icon className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">{activity.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Help & Support */}
          <section className="flex flex-col space-y-4">
            <h2 className="text-2xl font-black text-teal-950 text-left font-outfit">Support & Resource Hub</h2>
            <div className="card-elegant p-6 border rounded-xl flex-1 space-y-4 text-left">
              <div className="border border-border/50 rounded-xl p-4 bg-warm-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-sm text-foreground">Need Urgent Assistance?</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Stuck with cycle logging or doctor appointments? Reach our certified agents 24/7.
                </p>
                <button 
                  onClick={() => setIsHelpOpen(true)}
                  className="btn-feature px-4 py-2 text-xs font-bold rounded-lg"
                >
                  Contact Support
                </button>
              </div>
              
              <div className="border border-border/50 rounded-xl p-4 bg-warm-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-indigo-700" />
                  <h3 className="font-bold text-sm text-foreground">Peer Group Support</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Join completely anonymous support channels with active mental health mentors.
                </p>
                <button 
                  onClick={() => onTabChange('chat')}
                  className="btn-feature px-4 py-2 text-xs font-bold rounded-lg"
                >
                  Join Community
                </button>
              </div>
            </div>
          </section>
        </div>

      </div>

      <HelpPopup isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};

export default DashboardHome;
