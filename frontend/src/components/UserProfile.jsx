import React, { useState, useEffect } from 'react';
import { User, Calendar, Award, CheckCircle, Database, ShieldCheck, Heart, Trash2 } from 'lucide-react';

function UserProfile({ user, onUpdateUser }) {
  const [logs, setLogs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState(user?.pregnancyStatus || 'not_pregnant');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load logs and appointments from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('periodLogs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }

    const savedAppts = localStorage.getItem('saarthi_appointments');
    if (savedAppts) {
      setAppointments(JSON.parse(savedAppts));
    } else {
      // Mock some default appointments if none are saved yet to make page look complete
      const initialAppts = [
        {
          id: 'APT-4829-KOTA',
          doctorName: 'Dr. Smita Agrawal',
          speciality: 'Maternity Specialist',
          timing: '9:30 AM - 2 PM',
          fee: 500,
          status: 'Confirmed 🟢',
          date: new Date().toLocaleDateString()
        }
      ];
      setAppointments(initialAppts);
      localStorage.setItem('saarthi_appointments', JSON.stringify(initialAppts));
    }
  }, []);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    const updatedUser = { ...user, pregnancyStatus: newStatus };
    onUpdateUser(updatedUser);
    
    // Save to localStorage
    localStorage.setItem('saarthi_user', JSON.stringify(updatedUser));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const clearLog = (id) => {
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    localStorage.setItem('periodLogs', JSON.stringify(updated));
  };

  const clearAppointment = (id) => {
    const updated = appointments.filter(a => a.id !== id);
    setAppointments(updated);
    localStorage.setItem('saarthi_appointments', JSON.stringify(updated));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-warm-200 pb-4 text-left">
        <div>
          <h2 className="font-outfit text-4xl font-black tracking-tight text-warm-850">My Profile & Medical Records</h2>
          <p className="text-base font-semibold text-warm-550 mt-1.5">View your cycle logs, toggle health status, and manage telemedicine consult history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-stretch">
        
        {/* Left Column: Profile Card & Status Switcher (Spans 4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Small Profile Card */}
          <div className="bg-white rounded-3xl border border-warm-200 p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-teal-800 shadow-inner">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-warm-850">{user?.name || 'Saarthi User'}</h3>
              <p className="text-xs font-semibold text-warm-500 mt-0.5">@{user?.username || 'username'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-warm-100 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-warm-400">Age Bracket</span>
                <p className="text-sm font-extrabold text-warm-800">{user?.age || '25-30'} Years</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-warm-400">Scanned Location</span>
                <p className="text-sm font-extrabold text-emerald-600 truncate">{user?.location || 'Kota, India'}</p>
              </div>
            </div>
          </div>

          {/* Active Health Status Selector */}
          <div className="bg-white rounded-3xl border border-warm-200 p-6 shadow-sm space-y-4">
            <div>
              <h4 className="font-bold text-warm-800 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-600" />
                <span>My Active Health Status</span>
              </h4>
              <p className="text-xs text-warm-500 mt-1">Select your current stage to tailor AI alerts and tips.</p>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex gap-1.5 items-center leading-relaxed">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Status updated successfully!</span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              {[
                { key: 'not_pregnant', label: 'Regular Cycle Tracking 🩸', desc: 'Default tracking, ovulation details & advice.' },
                { key: 'trying', label: 'Trying to Conceive 🌿', desc: 'Focus on peak fertility & ovulation windows.' },
                { key: 'pregnant', label: 'Pregnant 🤰', desc: 'Prenatal care, gestational tips & alerts.' },
                { key: 'postpartum', label: 'Postpartum Care 🍼', desc: 'Mental health, pelvic recovery & support.' }
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleStatusChange(opt.key)}
                  className={`w-full p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    status === opt.key 
                      ? 'border-teal-500 bg-teal-50/40 text-teal-950 ring-2 ring-teal-600/10'
                      : 'border-warm-150 hover:bg-warm-50/50 text-warm-800'
                  }`}
                >
                  <p className="text-xs font-extrabold">{opt.label}</p>
                  <p className="text-[10px] text-warm-450 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Records Logs & Appointment Lists (Spans 8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Period History Logs */}
          <div className="bg-white rounded-3xl border border-warm-200 p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-warm-800 text-sm flex items-center gap-2 border-b border-warm-100 pb-2">
              <Calendar className="w-4.5 h-4.5 text-teal-600" />
              <span>Cycle Log History</span>
            </h4>
            
            {logs.length === 0 ? (
              <p className="text-xs text-warm-400 py-4 text-center">No logged cycle dates detected yet. Save them in SheCycle+.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[250px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 bg-warm-50/40 rounded-2xl border border-warm-150 flex justify-between items-center shadow-2xs">
                    <div>
                      <p className="text-xs font-black text-warm-800">Started: {log.startDate}</p>
                      <p className="text-[10px] text-warm-500 font-semibold mt-1">Flow: {log.flow} • Mood: {log.mood || 'Good'}</p>
                    </div>
                    <button 
                      onClick={() => clearLog(log.id)}
                      className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Telehealth Consultations & Appointments */}
          <div className="bg-white rounded-3xl border border-warm-200 p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-warm-800 text-sm flex items-center gap-2 border-b border-warm-100 pb-2">
              <ShieldCheck className="w-4.5 h-4.5 text-teal-600" />
              <span>Telehealth Bookings & Medical Slots</span>
            </h4>

            {appointments.length === 0 ? (
              <p className="text-xs text-warm-400 py-4 text-center">No consultation appointments booked yet. Check GynConnect.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {appointments.map((appt) => (
                  <div key={appt.id} className="p-4 bg-white border border-warm-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-2xs transition-shadow">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md">
                          {appt.id}
                        </span>
                        <span className="text-xs font-black text-emerald-600">
                          {appt.status}
                        </span>
                      </div>
                      <h5 className="font-extrabold text-sm text-warm-850">{appt.doctorName}</h5>
                      <p className="text-xs text-warm-500 font-semibold">{appt.speciality} • Timing: {appt.timing}</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-warm-100 pt-3 sm:pt-0">
                      <span className="text-xs font-black text-warm-800">Fee Paid: ₹{appt.fee}</span>
                      <button 
                        onClick={() => clearAppointment(appt.id)}
                        className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Cancel Slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

export default UserProfile;
