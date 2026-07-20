import React, { useState, useEffect } from 'react';
import { User, Calendar, Award, CheckCircle, Database, ShieldCheck, Heart, Trash2, Shield, MessageSquare, PhoneCall } from 'lucide-react';

function UserProfile({ user, onUpdateUser }) {
  const [logs, setLogs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [completedVaccines, setCompletedVaccines] = useState([]);
  const [ngoInquiries, setNgoInquiries] = useState([]);
  const [status, setStatus] = useState(user?.pregnancyStatus || 'not_pregnant');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load logs, appointments, vaccines, and NGO inquiries from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('periodLogs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }

    const savedAppts = localStorage.getItem('saarthi_appointments');
    if (savedAppts) {
      setAppointments(JSON.parse(savedAppts));
    } else {
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

    const savedVaccines = localStorage.getItem('saarthi_completed_vaccines');
    if (savedVaccines) {
      const parsed = JSON.parse(savedVaccines);
      setCompletedVaccines(parsed);
    }

    const savedInquiries = localStorage.getItem('saarthi_ngo_inquiries');
    if (savedInquiries) {
      setNgoInquiries(JSON.parse(savedInquiries));
    }
  }, []);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    const updatedUser = { ...user, pregnancyStatus: newStatus };
    onUpdateUser(updatedUser);
    
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
    <div className="space-y-8 animate-in fade-in duration-300 text-left">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-teal-100 pb-4">
        <div>
          <h2 className="font-outfit text-2xl font-black tracking-tight text-teal-950">My Profile & Medical Dashboard</h2>
          <p className="text-xs font-semibold text-muted-foreground mt-1">Manage health status, track cycle history, review telehealth bookings, and check NGO inquiries.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Profile Card, SMS Status, & Stage Switcher */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-teal-100/60 p-6 shadow-soft flex flex-col items-center text-center space-y-4">
            <div className="w-18 h-18 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-teal-800 shadow-inner">
              <User className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-teal-950">{user?.name || 'Ananya Sharma'}</h3>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">{user?.email || 'ananya.sharma@example.com'}</p>
            </div>
            
            {/* Registered SMS Notification Alert */}
            <div className="p-3 bg-teal-50/40 rounded-xl border border-teal-100/60 w-full text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-teal-950">
                <PhoneCall className="w-3.5 h-3.5 text-teal-700" />
                <span>Registered Mobile SMS Active</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                SMS Appointment Confirmations & Reminders active on: <strong className="text-teal-950">+91 98******10</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full pt-3 border-t border-teal-50 text-left">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-teal-650">Age</span>
                <p className="text-xs font-extrabold text-teal-950">{user?.age || '26'} Years</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold text-teal-650">Location</span>
                <p className="text-xs font-extrabold text-teal-800 truncate">{user?.location || 'Bhopal, MP'}</p>
              </div>
            </div>
          </div>

          {/* Active Health Status Selector */}
          <div className="bg-white rounded-2xl border border-teal-100/60 p-6 shadow-soft space-y-4">
            <div>
              <h4 className="font-extrabold text-teal-950 text-xs flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-700" />
                <span>My Active Health Status</span>
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Select your current stage to tailor AI alerts and tips.</p>
            </div>

            {savedSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-extrabold flex gap-1.5 items-center leading-relaxed">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Status updated successfully!</span>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {[
                { key: 'not_pregnant', label: 'Regular Cycle Tracking', desc: 'Default tracking, ovulation details & advice.' },
                { key: 'trying', label: 'Trying to Conceive', desc: 'Focus on peak fertility & ovulation windows.' },
                { key: 'pregnant', label: 'Pregnant Care', desc: 'Prenatal care, gestational tips & alerts.' },
                { key: 'postpartum', label: 'Postpartum Recovery', desc: 'Mental health, pelvic recovery & support.' }
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleStatusChange(opt.key)}
                  className={`w-full p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    status === opt.key 
                      ? 'border-teal-700 bg-teal-50/40 text-teal-950 ring-1 ring-teal-700/20'
                      : 'border-teal-100/60 hover:bg-teal-50/20 text-teal-900'
                  }`}
                >
                  <p className="text-xs font-extrabold">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: History Records, Appointments, & Immunization Status */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Completed Immunizations & Vaccination History */}
          <div className="bg-white rounded-2xl border border-teal-100/60 p-5 shadow-soft space-y-3">
            <h4 className="font-extrabold text-teal-950 text-xs flex items-center gap-2 border-b border-teal-50 pb-2">
              <Shield className="w-4 h-4 text-teal-700" />
              <span>Vaccination & Immunization Record</span>
            </h4>

            {completedVaccines.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">No vaccination records updated yet. Manage them in VaxAlert.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1">
                {completedVaccines.map((vax) => (
                  <div key={vax.id} className="p-3 bg-teal-50/20 rounded-xl border border-teal-100/40 space-y-1">
                    <div className="flex justify-between items-center">
                      <h5 className="font-extrabold text-xs text-teal-950">{vax.name}</h5>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                        vax.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {vax.status === 'completed' ? 'Vaccinated ✓' : 'Due Soon'}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold">{vax.cost} • Due: {vax.due}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NGO & Support Inquiries History */}
          <div className="bg-white rounded-2xl border border-teal-100/60 p-5 shadow-soft space-y-3">
            <h4 className="font-extrabold text-teal-950 text-xs flex items-center gap-2 border-b border-teal-50 pb-2">
              <MessageSquare className="w-4 h-4 text-teal-700" />
              <span>My NGO & Welfare Support Inquiries</span>
            </h4>

            {ngoInquiries.length === 0 ? (
              <div className="p-3 bg-teal-50/15 rounded-xl border border-teal-100/40 text-xs text-muted-foreground font-medium">
                Sample Inquiry Submitted: <strong>Snehalaya Women Crisis Care</strong> (Delhi NCR) • Status: <span className="text-emerald-700 font-extrabold">Submitted 🟢</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                {ngoInquiries.map((inq) => (
                  <div key={inq.id} className="p-3 bg-white border border-teal-100/50 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-extrabold text-teal-950">{inq.ngoName}</p>
                      <p className="text-[10px] text-muted-foreground">{inq.field} • {inq.date}</p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/50">
                      {inq.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cycle History Logs */}
          <div className="bg-white rounded-2xl border border-teal-100/60 p-5 shadow-soft space-y-3">
            <h4 className="font-extrabold text-teal-950 text-xs flex items-center gap-2 border-b border-teal-50 pb-2">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span>Cycle Log History</span>
            </h4>
            
            {logs.length === 0 ? (
              <div className="p-3 bg-teal-50/15 rounded-xl border border-teal-100/40 text-xs text-teal-950 font-semibold">
                Sample Log: Cycle Started on <strong>2026-07-01</strong> • Flow: Moderate • Mood: Calm & Healthy
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 bg-teal-50/20 rounded-xl border border-teal-100/40 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-extrabold text-teal-950">Started: {log.startDate}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Flow: {log.flow} • Mood: {log.mood || 'Good'}</p>
                    </div>
                    <button 
                      onClick={() => clearLog(log.id)}
                      className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors cursor-pointer"
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
          <div className="bg-white rounded-2xl border border-teal-100/60 p-5 shadow-soft space-y-3">
            <h4 className="font-extrabold text-teal-950 text-xs flex items-center gap-2 border-b border-teal-50 pb-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Telehealth Bookings & Medical Slots</span>
            </h4>

            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {appointments.map((appt) => (
                <div key={appt.id} className="p-3.5 bg-white border border-teal-100/60 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-150/40 px-1.5 py-0.5 rounded">
                        {appt.id}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-700">
                        {appt.status}
                      </span>
                    </div>
                    <h5 className="font-extrabold text-xs text-teal-950">{appt.doctorName}</h5>
                    <p className="text-[10px] text-muted-foreground">{appt.speciality} • Timing: {appt.timing}</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-teal-50 pt-2 sm:pt-0">
                    <span className="text-xs font-extrabold text-teal-950">Fee Paid: ₹{appt.fee}</span>
                    <button 
                      onClick={() => clearAppointment(appt.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors cursor-pointer"
                      title="Cancel Slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default UserProfile;
