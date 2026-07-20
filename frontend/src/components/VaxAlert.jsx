import React, { useState, useEffect } from 'react';
import { Shield, Bell, CheckCircle, MapPin, Calendar, HelpCircle, ChevronDown, ChevronUp, BookOpen, Clock } from 'lucide-react';
import { API_BASE } from '../App.jsx';

const defaultVaccines = [
  { 
    id: '1', 
    name: 'Cervavac® (HPV Vaccine)', 
    description: 'Cervical cancer prevention vaccine (Serum Institute of India). Required in 2/3 doses.', 
    status: 'due', 
    due: '2026-08-10', 
    cost: '₹200 (Govt.)',
    details: 'This vaccine helps protect young girls and women against cervical cancer caused by Human Papillomavirus (HPV). It is highly recommended to receive it between ages 9 and 26. In India, it is offered under public immunization programs at subsidized rates.'
  },
  { 
    id: '2', 
    name: 'Tetanus Booster', 
    description: 'Prevents maternal/neonatal tetanus during fertility and pregnancy.', 
    status: 'upcoming', 
    due: '2026-09-15', 
    cost: 'Free (Govt.)',
    details: 'Tetanus is a serious infection caused by bacteria. In women, especially during childbearing years and pregnancy, a tetanus booster ensures that both mother and newborn child are protected from neonatal tetanus infections.'
  },
  { 
    id: '3', 
    name: 'Rubella MMR Vaccine', 
    description: 'Protects against congenital rubella syndrome in childbearing age.', 
    status: 'completed', 
    due: '2025-12-05', 
    cost: 'Free (Govt.)',
    details: 'Rubella (German Measles) can cause serious complications if contracted during early pregnancy. The MMR vaccine protects you and ensures that future children do not contract congenital rubella syndrome (CRS).'
  }
];

const driveNews = [
  { title: "Nationwide Free HPV Immunization Campaign Launches", source: "Ministry of Health", date: "July 10, 2026" },
  { title: "Serum Institute Expands Cervavac Availability in Tier-2 Cities", source: "WHO India Updates", date: "July 08, 2026" }
];

function VaxAlert({ isLoggedIn, onRequireAuth }) {
  const [vaxList, setVaxList] = useState(defaultVaccines);
  const [expandedId, setExpandedId] = useState(null);
  
  // Booking Slot states
  const [bookingVax, setBookingVax] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [userCity, setUserCity] = useState('Bhopal');

  useEffect(() => {
    // Read local city if user is logged in
    const savedUser = localStorage.getItem('saarthi_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.location) {
        setUserCity(parsed.location.split(',')[0]);
      }
    }
  }, []);

  const governmentHospitals = [
    `Sanjeevini Government Clinic, ${userCity}`,
    `Sanjay Gandhi District Hospital, ${userCity}`,
    `Primary Health Centre (PHC), ${userCity} Ward 12`,
    `Civil Hospital Dispensary, ${userCity}`
  ];

  const toggleStatus = (id) => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    setVaxList(vaxList.map(v => {
      if (v.id === id) {
        const nextStatus = v.status === 'due' ? 'completed' : v.status === 'completed' ? 'upcoming' : 'due';
        return { ...v, status: nextStatus };
      }
      return v;
    }));
  };

  const handleOpenBooking = (vax) => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    setBookingVax(vax);
    setSelectedHospital(governmentHospitals[0]);
    setBookingDate(new Date(vax.due).toISOString().split('T')[0]);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    setBookingSuccess(true);
    
    // Simulate updating list status and due hospital
    setVaxList(vaxList.map(v => {
      if (v.id === bookingVax.id) {
        return { ...v, status: 'upcoming', due: bookingDate, cost: `Scheduled at ${selectedHospital.split(',')[0]}` };
      }
      return v;
    }));

    setTimeout(() => {
      setBookingVax(null);
      setBookingSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="font-outfit text-3xl font-black text-warm-850">VaxAlert Vaccine Hub</h2>
        <p className="text-sm text-warm-500 mt-1">Schedule vaccine slots, check guidelines, and track local immunization drives.</p>
      </div>

      {/* 1. BOOKING SLOTS MODAL OVERLAY */}
      {bookingVax && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-teal-100 p-6 space-y-6 text-left relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setBookingVax(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-teal-950 p-1 bg-teal-50 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] text-teal-700 font-extrabold uppercase tracking-wider block">Sanjeevini Booking Portal</span>
              <h3 className="text-lg font-black text-teal-950">Book Immunization Slot</h3>
              <p className="text-xs text-muted-foreground">Schedule a free or highly subsidized slot for <strong>{bookingVax.name}</strong>.</p>
            </div>

            {bookingSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-11 h-11 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-sm font-bold animate-bounce">✓</div>
                <h4 className="font-bold text-teal-955 text-sm">Slot Reserved Successfully!</h4>
                <p className="text-xs text-muted-foreground">Your booking details have been registered with the Sanjeevini portal.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-teal-900">Select Government Facility</label>
                  <select 
                    value={selectedHospital}
                    onChange={(e) => setSelectedHospital(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-teal-100 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-800 text-teal-950 font-semibold"
                  >
                    {governmentHospitals.map((hosp, idx) => (
                      <option key={idx} value={hosp}>{hosp}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-teal-900">Appointment Date</label>
                  <input 
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-teal-100 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-800 text-teal-950"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors"
                >
                  Confirm Appointment Slot
                </button>

              </form>
            )}

          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Schedule List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-outfit text-lg font-bold text-warm-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-pink-500" />
            <span>Immunization Timeline</span>
          </h3>

          <div className="space-y-4">
            {vaxList.map(vax => (
              <div 
                key={vax.id} 
                className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-warm-800 text-sm">{vax.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        vax.status === 'due' 
                          ? 'bg-rose-50 border-rose-200 text-rose-800' 
                          : vax.status === 'completed' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : 'bg-warm-100 border-warm-200 text-warm-700'
                      }`}>
                        {vax.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-warm-500 leading-relaxed">{vax.description}</p>
                    
                    <div className="flex items-center gap-3 text-[10px] text-warm-400 font-bold pt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due: {vax.due}</span>
                      </span>
                      <span>Cost: {vax.cost}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === vax.id ? null : vax.id)}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl border border-teal-200 text-teal-850 hover:bg-teal-50 transition-all flex items-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{expandedId === vax.id ? 'Close info' : 'Info'}</span>
                    </button>

                    {vax.status !== 'completed' && (
                      <button
                        onClick={() => handleOpenBooking(vax)}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white transition-all shadow-sm flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Book Slot</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleStatus(vax.id)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all ${
                        vax.status === 'completed'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-warm-50 border-warm-200 text-warm-700 hover:bg-warm-100'
                      }`}
                    >
                      {vax.status === 'completed' ? '✓ Completed' : 'Mark Completed'}
                    </button>
                  </div>
                </div>

                {/* Collapsible Info details */}
                {expandedId === vax.id && (
                  <div className="p-4 bg-teal-50/40 rounded-xl border border-teal-100 text-left text-xs text-teal-950 space-y-1.5 animate-in slide-in-from-top duration-200 leading-relaxed font-semibold">
                    <h5 className="font-extrabold text-teal-900 text-xs">More About This Vaccine:</h5>
                    <p>{vax.details}</p>
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>

        {/* Health Campaigns / News */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-sm space-y-4 text-left">
            <h3 className="font-outfit text-lg font-bold text-warm-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-pink-500 animate-bounce" />
              <span>Immunization Drives</span>
            </h3>

            <div className="space-y-4">
              {driveNews.map((news, idx) => (
                <div key={idx} className="p-4 bg-warm-50 rounded-xl border border-warm-200/50 space-y-2">
                  <h4 className="font-bold text-warm-800 text-xs leading-relaxed">{news.title}</h4>
                  <div className="flex justify-between items-center text-[10px] text-warm-400 font-bold">
                    <span>{news.source}</span>
                    <span>{news.date}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => { if(!isLoggedIn) onRequireAuth(); else alert("Mapping nearby immunization campaign sites on map..."); }}
              className="w-full mt-2 py-2 text-xs font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors text-center flex items-center justify-center gap-1"
            >
              <span>View Local Camp Sites</span>
              <MapPin className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

// Simple helper local X close icon
const X = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default VaxAlert;
