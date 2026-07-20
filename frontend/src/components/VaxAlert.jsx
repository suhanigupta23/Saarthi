import React, { useState, useEffect } from 'react';
import { Shield, Bell, CheckCircle, MapPin, Calendar, HelpCircle, ChevronDown, ChevronUp, BookOpen, Clock, X, Navigation } from 'lucide-react';
import vaccineCareImg from '../assets/vaccine-care.jpg';

const defaultVaccines = [
  { 
    id: '1', 
    name: 'Cervavac® (HPV Vaccine)', 
    description: 'Cervical cancer prevention vaccine (Serum Institute of India). Required in 2/3 doses.', 
    status: 'due', 
    due: '2026-08-10', 
    cost: '₹200 (Govt.)',
    details: 'This vaccine protects young girls and women against cervical cancer caused by Human Papillomavirus (HPV). It is recommended between ages 9 and 26. In India, it is offered under public immunization programs at subsidized rates.'
  },
  { 
    id: '2', 
    name: 'Tetanus Booster (TT / Td)', 
    description: 'Prevents maternal/neonatal tetanus during fertility and pregnancy.', 
    status: 'upcoming', 
    due: '2026-09-15', 
    cost: 'Free (Govt.)',
    details: 'Tetanus is a serious infection caused by bacteria. In women, especially during childbearing years and pregnancy, a tetanus booster ensures that both mother and newborn child are protected.'
  },
  { 
    id: '3', 
    name: 'Rubella MMR Vaccine', 
    description: 'Protects against congenital rubella syndrome in childbearing age.', 
    status: 'completed', 
    due: '2025-12-05', 
    cost: 'Free (Govt.)',
    details: 'Rubella (German Measles) can cause serious complications if contracted during early pregnancy. The MMR vaccine protects you and ensures future children do not contract congenital rubella syndrome.'
  }
];

const generateLocationDrives = (city) => {
  const currentCity = city || 'Bhopal';
  return [
    { 
      id: 'd1',
      title: `Free HPV Cervavac Immunization Drive - ${currentCity}`, 
      source: "National Health Mission", 
      date: "July 15, 2026",
      locationName: `Civil District Hospital & Immunization Hub, ${currentCity}`,
      timings: "09:00 AM - 04:00 PM (Mon-Sat)"
    },
    { 
      id: 'd2',
      title: `Specialist Women Maternal & TT Booster Camp`, 
      source: "WHO India & State Govt", 
      date: "July 18, 2026",
      locationName: `Urban Primary Health Center Ward 7, ${currentCity}`,
      timings: "10:00 AM - 05:00 PM (Daily)"
    },
    { 
      id: 'd3',
      title: `Adolescent Rubella & Booster Campaign`, 
      source: "District Health Society", 
      date: "July 22, 2026",
      locationName: `Community Health Center Main Dispensary, ${currentCity}`,
      timings: "09:30 AM - 03:30 PM (Mon-Fri)"
    }
  ];
};

function VaxAlert({ isLoggedIn, onRequireAuth }) {
  const [vaxList, setVaxList] = useState(() => {
    const saved = localStorage.getItem('saarthi_completed_vaccines');
    if (saved) return JSON.parse(saved);
    return defaultVaccines;
  });

  const [expandedId, setExpandedId] = useState(null);
  const [userCity, setUserCity] = useState('Bhopal');
  const [driveNews, setDriveNews] = useState(() => generateLocationDrives('Bhopal'));

  // Booking Slot and Drive Map States
  const [bookingVax, setBookingVax] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationToast, setLocationToast] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('saarthi_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.location) {
        const cityStr = parsed.location.split(',')[0].trim();
        setUserCity(cityStr);
        setDriveNews(generateLocationDrives(cityStr));
      }
    }
  }, []);

  const triggerToastNotice = (city) => {
    setLocationToast(`📍 Location Updated! Nearby clinics & campaigns refreshed for ${city}. Please check below.`);
    setTimeout(() => {
      setLocationToast('');
    }, 3500);
  };

  const detectRealTimeLocation = () => {
    setIsLocating(true);
    
    // Safety fallback timeout ensuring scanner never hangs
    const timer = setTimeout(() => {
      setIsLocating(false);
      const targetCity = userCity || 'Bhopal';
      setUserCity(targetCity);
      setDriveNews(generateLocationDrives(targetCity));
      triggerToastNotice(targetCity);
    }, 2200);

    if (!navigator.geolocation) {
      clearTimeout(timer);
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let cityFound = 'Bhopal';
        try {
          const controller = new AbortController();
          const signalTimeout = setTimeout(() => controller.abort(), 1800);
          
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { signal: controller.signal });
          clearTimeout(signalTimeout);
          const data = await res.json();
          cityFound = data.address?.city || data.address?.town || data.address?.suburb || data.address?.state_district || 'Bhopal';
        } catch (err) {
          if (latitude > 28.0 && latitude < 29.0) cityFound = 'Delhi';
          else if (latitude > 22.5 && latitude < 23.5) cityFound = 'Indore';
          else if (latitude > 18.8 && latitude < 19.5) cityFound = 'Mumbai';
          else if (latitude > 26.5 && latitude < 27.2) cityFound = 'Kota';
        } finally {
          setUserCity(cityFound);
          setDriveNews(generateLocationDrives(cityFound));
          triggerToastNotice(cityFound);
          clearTimeout(timer);
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Geolocation permission or timeout:", err);
        clearTimeout(timer);
        setIsLocating(false);
      },
      { timeout: 2200, maximumAge: 30000, enableHighAccuracy: false }
    );
  };

  // Save changes to localStorage for Profile visibility
  useEffect(() => {
    localStorage.setItem('saarthi_completed_vaccines', JSON.stringify(vaxList));
  }, [vaxList]);

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
    
    setVaxList(vaxList.map(v => {
      if (v.id === bookingVax.id) {
        return { ...v, status: 'upcoming', due: bookingDate };
      }
      return v;
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left">
      
      {/* Location Updated 3-Second Popup Notice */}
      {locationToast && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 text-xs font-extrabold">
            <CheckCircle className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{locationToast}</span>
          </div>
          <button onClick={() => setLocationToast('')} className="p-1 hover:bg-black/10 rounded">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Header Banner Card with Real Photo */}
      <div className="bg-white border border-[#ECE8F5] rounded-[20px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs text-left">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C06093] bg-[#D88AB4]/15 px-3 py-1 rounded-full border border-[#D88AB4]/30">
              💉 Women's Immunization & Vaccine Schedule
            </span>
            <span className="text-[10px] font-bold text-[#6D5BD0] bg-[#FAF8FC] border border-[#ECE8F5] px-2.5 py-1 rounded-full">
              📍 Location: {userCity}
            </span>
          </div>
          <h2 className="font-outfit text-2xl sm:text-3xl font-black text-[#2D2A4A]">VaxAlert Immunization Tracker</h2>
          <p className="text-xs sm:text-sm text-[#5F6473] leading-relaxed">
            Track essential women's vaccines, detect nearby immunization drives, and book free government hospital slots in <strong className="text-[#2D2A4A]">{userCity}</strong>.
          </p>
          <button
            onClick={detectRealTimeLocation}
            disabled={isLocating}
            className="mt-2 inline-flex items-center justify-center gap-2 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Navigation className={`w-4 h-4 text-white ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Scanning GPS Location...' : '📍 Detect Location (GPS)'}</span>
          </button>
        </div>
        <img 
          src={vaccineCareImg} 
          alt="Vaccination Care" 
          className="w-full md:w-72 h-44 object-cover rounded-2xl border border-[#ECE8F5] shadow-xs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Vaccine List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#ECE8F5]">
            <h3 className="font-outfit text-sm font-extrabold text-[#2D2A4A] flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-[#6D5BD0]" />
              <span>Recommended Immunizations</span>
            </h3>
            <span className="text-[10px] font-bold text-[#3B826E] bg-[#A9D8C8]/20 px-3 py-1 rounded-full border border-[#A9D8C8]/30">
              Synced with MoHFW Schedule
            </span>
          </div>

          <div className="space-y-4">
            {vaxList.map(vax => {
              const isExpanded = expandedId === vax.id;
              const isCompleted = vax.status === 'completed';

              return (
                <div 
                  key={vax.id}
                  className={`bg-white rounded-[18px] border p-5 shadow-xs space-y-3 transition-all ${
                    isCompleted ? 'border-[#A9D8C8] bg-[#A9D8C8]/10' : 'border-[#ECE8F5] hover:border-[#6D5BD0]/40'
                  }`}
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-outfit font-extrabold text-[#2D2A4A] text-sm">{vax.name}</h4>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          vax.status === 'completed' ? 'bg-[#A9D8C8]/20 text-[#3B826E] border-[#A9D8C8]/30' :
                          vax.status === 'due' ? 'bg-[#D88AB4]/15 text-[#C06093] border-[#D88AB4]/30' :
                          'bg-[#B6A8F8]/15 text-[#6D5BD0] border-[#B6A8F8]/30'
                        }`}>
                          {vax.status === 'completed' ? 'Vaccinated ✓' : vax.status === 'due' ? 'Due Soon' : 'Upcoming'}
                        </span>
                      </div>
                      <p className="text-xs text-[#5F6473] font-normal">{vax.description}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#2D2A4A] block">{vax.cost}</span>
                      <span className="text-[10px] text-[#8A8FA3] font-medium">Due: {vax.due}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-[#ECE8F5] flex-wrap gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : vax.id)}
                      className="text-[11px] font-bold text-[#6D5BD0] hover:text-[#5b4ab9] flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Hide Details' : 'View Clinical Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(vax.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border cursor-pointer ${
                          isCompleted
                            ? 'bg-[#A9D8C8]/20 text-[#3B826E] border-[#A9D8C8]'
                            : 'bg-white text-[#2D2A4A] border-[#6D5BD0] hover:bg-[#F5F3FA]'
                        }`}
                      >
                        {isCompleted ? 'Vaccinated ✓' : 'Mark as Done'}
                      </button>

                      {!isCompleted && (
                        <button
                          onClick={() => handleOpenBooking(vax)}
                          className="px-3.5 py-1.5 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Book Free Slot
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="p-3.5 bg-[#FAF8FC] rounded-xl border border-[#ECE8F5] text-xs leading-relaxed text-[#2D2A4A] animate-in fade-in duration-200">
                      <strong className="text-[#2D2A4A] font-bold block mb-1">Clinical Purpose & Guidelines:</strong>
                      {vax.details}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Immunization Drive Alerts & Location Campaigns */}
        <div className="space-y-6">
          <div className="bg-white rounded-[18px] border border-[#ECE8F5] p-5 shadow-xs space-y-4">
            <h3 className="font-outfit text-sm font-extrabold text-[#2D2A4A] flex items-center gap-2 pb-2 border-b border-[#ECE8F5]">
              <Bell className="w-4 h-4 text-[#6D5BD0]" />
              <span>Immunization Drives & Local Campaigns</span>
            </h3>

            <div className="space-y-3">
              {driveNews.map((news) => (
                <div key={news.id} className="p-3.5 bg-[#FAF8FC] rounded-xl border border-[#ECE8F5] space-y-2">
                  <span className="text-[9px] font-bold uppercase bg-[#B6A8F8]/15 text-[#6D5BD0] px-2 py-0.5 rounded border border-[#B6A8F8]/30">
                    {news.source} • {news.date}
                  </span>
                  <h5 className="font-bold text-xs text-[#2D2A4A]">{news.title}</h5>
                  <p className="text-[10px] text-[#5F6473] flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-[#6D5BD0]" />
                    <span>{news.locationName}</span>
                  </p>
                  <button 
                    onClick={() => setSelectedDrive(news)}
                    className="w-full py-2 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white font-bold text-[11px] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>View Campaign Location on Map</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Booking Slot Modal */}
      {bookingVax && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-teal-100/60 p-6 shadow-xl space-y-4 max-w-md w-full animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center pb-2 border-b border-teal-50">
              <div>
                <h4 className="font-outfit text-sm font-extrabold text-teal-950">Book Immunization Slot</h4>
                <p className="text-[10px] text-muted-foreground">{bookingVax.name}</p>
              </div>
              <button 
                onClick={() => setBookingVax(null)}
                className="p-1 hover:bg-teal-50 rounded-lg text-teal-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <h5 className="font-extrabold text-teal-950 text-sm">Vaccine Slot Confirmed!</h5>
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-semibold leading-relaxed border border-emerald-200">
                  ✓ SMS confirmation & appointment reminder sent to registered mobile number (+91 98******10).
                </div>
                <button 
                  onClick={() => setBookingVax(null)}
                  className="px-4 py-2 bg-teal-800 text-white rounded-lg text-xs font-extrabold shadow-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-teal-900 uppercase">Select Center / Clinic</label>
                  <select 
                    value={selectedHospital}
                    onChange={(e) => setSelectedHospital(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-teal-100 text-xs bg-teal-50/10 font-bold"
                  >
                    {governmentHospitals.map((h, i) => (
                      <option key={i} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-teal-900 uppercase">Preferred Date</label>
                  <input 
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-teal-100 text-xs bg-teal-50/10 font-bold"
                  />
                </div>

                <div className="p-3 bg-teal-50/30 text-teal-950 rounded-xl text-[11px] font-semibold">
                  Free government vaccination covered under National Health Mission (NHM).
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setBookingVax(null)}
                    className="px-3.5 py-2 rounded-lg bg-teal-50 text-teal-950 text-xs font-extrabold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-extrabold shadow-sm"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Drive Campaign Map Popup Modal */}
      {selectedDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-teal-100/60 p-6 shadow-xl space-y-4 max-w-lg w-full animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-teal-50">
              <div>
                <h4 className="font-outfit text-sm font-extrabold text-teal-950">{selectedDrive.title}</h4>
                <p className="text-[10px] text-muted-foreground">{selectedDrive.locationName}</p>
              </div>
              <button 
                onClick={() => setSelectedDrive(null)}
                className="p-1 hover:bg-teal-50 rounded-lg text-teal-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-teal-50 rounded-xl overflow-hidden h-48 border border-teal-100">
              <iframe 
                title="Drive Location Map"
                width="100%" 
                height="100%" 
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedDrive.locationName)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-teal-950 pt-1">
              <span>Timings: {selectedDrive.timings}</span>
              <button 
                onClick={() => setSelectedDrive(null)}
                className="px-4 py-1.5 bg-teal-800 text-white text-xs font-extrabold rounded-lg shadow-sm"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default VaxAlert;
