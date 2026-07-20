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

  const [activityMap, setActivityMap] = useState({
    cycle: "Logged 2h ago",
    symptom: "Checked today",
    gynconnect: "1 slot booked",
    vault: "2 documents secured",
    vax: "1 vaccine completed",
    yojana: "Active scheme search",
    ngo: "1 inquiry submitted",
    chat: "Active now"
  });

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

      if (day >= 1 && day <= 6) setCyclePhase('Menstrual Phase');
      else if (day >= 7 && day <= 13) setCyclePhase('Follicular Phase');
      else if (day === 14) setCyclePhase('Ovulation Day');
      else setCyclePhase('Luteal Phase');

      setDaysUntilNext(28 - day);
    }

    const apptsSaved = localStorage.getItem('saarthi_appointments');
    const vaxSaved = localStorage.getItem('saarthi_completed_vaccines');
    const ngoSaved = localStorage.getItem('saarthi_ngo_inquiries');

    setActivityMap(prev => {
      const updated = { ...prev };
      if (apptsSaved) {
        const parsed = JSON.parse(apptsSaved);
        if (parsed.length > 0) updated.gynconnect = `${parsed.length} slot(s) booked`;
      }
      if (vaxSaved) {
        const parsed = JSON.parse(vaxSaved);
        const done = parsed.filter(v => v.status === 'completed').length;
        updated.vax = `${done} vaccine(s) completed`;
      }
      if (ngoSaved) {
        const parsed = JSON.parse(ngoSaved);
        if (parsed.length > 0) updated.ngo = `${parsed.length} inquiry submitted`;
      }
      return updated;
    });
  }, []);

  const personalizedFeatures = [
    {
      id: "cycle",
      icon: Calendar,
      title: "SheCycle+ Tracker",
      description: "Track your period dates, log daily moods, and get natural dietary advice.",
      progress: cycleDay > 0 ? 85 : 90,
      lastUsed: activityMap.cycle,
      bgClass: "bg-white border-[#ECE8F5]",
      iconBg: "bg-[#D88AB4]/15 text-[#C06093]",
      progressColor: "bg-[#D88AB4]",
      used: true
    },
    {
      id: "symptom",
      icon: Activity,
      title: "SymptoScan AI",
      description: "Evaluate your symptoms in simple terms to check for underlying conditions.",
      progress: 75,
      lastUsed: activityMap.symptom,
      bgClass: "bg-white border-[#ECE8F5]",
      iconBg: "bg-[#B6A8F8]/15 text-[#6D5BD0]",
      progressColor: "bg-[#6D5BD0]",
      used: true
    },
    {
      id: "gynconnect",
      icon: Heart,
      title: "GynConnect Consult",
      description: "Book direct video calls or text chats with verified health doctors.",
      progress: 80,
      lastUsed: activityMap.gynconnect,
      bgClass: "bg-white border-[#ECE8F5]",
      iconBg: "bg-[#A9D8C8]/25 text-[#3B826E]",
      progressColor: "bg-[#3B826E]",
      used: true
    },
    {
      id: "vault",
      icon: Database,
      title: "MediVault Records",
      description: "Store your prescriptions and medical files safely in one place.",
      progress: 90,
      lastUsed: activityMap.vault,
      bgClass: "bg-white border-[#ECE8F5]",
      iconBg: "bg-[#6D5BD0]/15 text-[#6D5BD0]",
      progressColor: "bg-[#6D5BD0]",
      used: true
    },
    {
      id: "yojana",
      icon: FileText,
      title: "HealthYojana",
      description: "Find government healthcare benefits and schemes for you.",
      progress: 65,
      lastUsed: activityMap.yojana,
      bgClass: "bg-white border-[#ECE8F5]",
      iconBg: "bg-[#F3E8D6]/50 text-[#8B6B38]",
      progressColor: "bg-[#8B6B38]",
      used: true
    },
    {
      id: "ngo",
      icon: Building2,
      title: "NGOHeal Network",
      description: "Get assistance from local community support groups.",
      progress: 70,
      lastUsed: activityMap.ngo,
      bgClass: "bg-white border-[#ECE8F5]",
      iconBg: "bg-[#A9D8C8]/25 text-[#3B826E]",
      progressColor: "bg-[#3B826E]",
      used: true
    },
    {
      id: "chat",
      icon: MessageCircle,
      title: "CareCircle Peer",
      description: "Talk privately in safe online groups with other women.",
      progress: 75,
      lastUsed: "3 days ago",
      bgClass: "bg-white border-[#ECE8F5]",
      iconBg: "bg-[#B6A8F8]/15 text-[#6D5BD0]",
      progressColor: "bg-[#6D5BD0]",
      used: true
    },
    {
      id: "vax",
      icon: Shield,
      title: "VaxAlert Hub",
      description: "Get a personal vaccine scheduler with automated reminders.",
      progress: 0,
      lastUsed: "Never used",
      bgClass: "bg-white border-[#ECE8F5]",
      iconBg: "bg-[#D88AB4]/15 text-[#C06093]",
      progressColor: "bg-[#D88AB4]",
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
        <div className="bg-gradient-to-r from-[#6D5BD0] to-[#8B78E6] text-white border border-[#ECE8F5] rounded-[20px] p-6 md:p-10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative space-y-3 text-left">
            <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3.5 py-1 text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Saarthi Health Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-outfit text-white">
              Welcome back, {user?.name || 'Saarthi User'}! 👋
            </h1>
            <p className="text-white/90 text-sm sm:text-base max-w-2xl font-normal leading-relaxed">
              Here is your personalized women's health dashboard. Access diagnostic and wellness features directly.
            </p>
          </div>
        </div>

        {/* Health Insights */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-[#2D2A4A] text-left font-outfit">Health Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {healthInsights.map((insight, index) => (
              <div key={index} className="bg-white border border-[#ECE8F5] rounded-[18px] p-6 flex flex-col justify-between shadow-xs text-left">
                <div>
                  <h3 className="font-bold text-[#8A8FA3] text-xs mb-1 uppercase tracking-wider">
                    {insight.title}
                  </h3>
                  <div className="text-2xl font-black text-[#2D2A4A] mb-1 font-outfit">
                    {insight.value}
                  </div>
                </div>
                <div className={`text-xs font-bold mt-2 ${insight.positive ? 'text-[#3B826E]' : 'text-amber-700'}`}>
                  {insight.trend}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Personalized Feature Directory */}
        <section id="services-section" className="space-y-4">
          <h2 className="text-2xl font-black text-[#2D2A4A] text-left font-outfit">Your Feature Directory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalizedFeatures.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white border border-[#ECE8F5] rounded-[18px] p-6 hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-h-[250px] text-left"
                onClick={() => onTabChange(feature.id)}
              >
                <div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${feature.iconBg}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-[#2D2A4A] mb-1.5 text-left text-base font-outfit">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-[#5F6473] font-normal mb-4 text-left leading-relaxed">{feature.description}</p>
                </div>
                
                <div>
                  <div className="border-t border-[#ECE8F5] pt-3 flex justify-between items-center text-xs text-[#5F6473] font-medium">
                    <span>Activity: {feature.lastUsed}</span>
                    <span className="flex items-center gap-1 text-[#6D5BD0] font-bold">
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
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
            <h2 className="text-2xl font-black text-[#2D2A4A] text-left font-outfit">Recent Activity Logs</h2>
            <div className="bg-white border border-[#ECE8F5] rounded-[18px] p-6 flex-1 space-y-4 shadow-xs">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 text-xs leading-relaxed border-b border-[#ECE8F5] pb-3 last:border-b-0 last:pb-0 text-left">
                  <div className="w-8 h-8 rounded-full bg-[#B6A8F8]/15 text-[#6D5BD0] flex items-center justify-center shrink-0">
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-[#2D2A4A]">{activity.message}</p>
                    <p className="text-[11px] text-[#8A8FA3] mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Help & Support */}
          <section className="flex flex-col space-y-4">
            <h2 className="text-2xl font-black text-[#2D2A4A] text-left font-outfit">Support & Resource Hub</h2>
            <div className="bg-white border border-[#ECE8F5] rounded-[18px] p-6 flex-1 space-y-4 text-left shadow-xs">
              <div className="border border-[#ECE8F5] rounded-[14px] p-4 bg-[#FAF8FC]">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-[#6D5BD0]" />
                  <h3 className="font-bold text-sm text-[#2D2A4A]">Need Urgent Assistance?</h3>
                </div>
                <p className="text-xs text-[#5F6473] mb-3 leading-relaxed">
                  Stuck with cycle logging or doctor appointments? Reach our support team 24/7.
                </p>
                <button 
                  onClick={() => setIsHelpOpen(true)}
                  className="bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Contact Support
                </button>
              </div>
              
              <div className="border border-[#ECE8F5] rounded-[14px] p-4 bg-[#FAF8FC]">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-[#6D5BD0]" />
                  <h3 className="font-bold text-sm text-[#2D2A4A]">Peer Group Support</h3>
                </div>
                <p className="text-xs text-[#5F6473] mb-3 leading-relaxed">
                  Join completely anonymous support channels with active mental health mentors.
                </p>
                <button 
                  onClick={() => onTabChange('chat')}
                  className="bg-white border border-[#6D5BD0] text-[#2D2A4A] hover:bg-[#F5F3FA] px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer"
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
