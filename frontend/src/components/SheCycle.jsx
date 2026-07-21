import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Heart, Apple, Dumbbell, Award, ListPlus, 
  Activity, ChevronLeft, ChevronRight, Bell, Plus, Trash2, CheckCircle, X
} from 'lucide-react';
import { API_BASE } from '../App.jsx';
import shecycleWellnessImg from '../assets/shecycle-wellness.jpg';

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const cleanStr = dateStr.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  const [year, month, day] = parts.map(Number);
  return new Date(year, month - 1, day);
};

const getDeduplicatedLogs = (rawLogs) => {
  const sorted = [...rawLogs].sort((a, b) => parseLocalDate(b.startDate) - parseLocalDate(a.startDate));
  const deduped = [];
  
  for (const log of sorted) {
    const logDate = parseLocalDate(log.startDate);
    const isDuplicate = deduped.some(accepted => {
      const acceptedDate = parseLocalDate(accepted.startDate);
      const diffTime = Math.abs(logDate.getTime() - acceptedDate.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= 18;
    });
    
    if (!isDuplicate) {
      deduped.push(log);
    }
  }
  return deduped;
};

function SheCycle({ isLoggedIn, onRequireAuth }) {
  const [periodDate, setPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodDuration, setPeriodDuration] = useState(5);
  const [logs, setLogs] = useState([]);
  const [currentPhase, setCurrentPhase] = useState('Unknown');
  const [cycleDay, setCycleDay] = useState(0);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cycle Configuration Modal States
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editCycleLength, setEditCycleLength] = useState('28');
  const [editPeriodDuration, setEditPeriodDuration] = useState('5');

  // Calendar states
  const [viewDate, setViewDate] = useState(new Date()); // Represents month being viewed
  const [selectedDate, setSelectedDate] = useState(new Date()); // Day selected for details/logging
  
  // Custom Daily Emoji Logs
  const [dayLogs, setDayLogs] = useState({}); // { 'yyyy-mm-dd': { mood: '😊', flow: 'Light', symptoms: 'Cramps' } }
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedFlow, setSelectedFlow] = useState('');

  // Reminders states
  const [reminders, setReminders] = useState([
    { id: 1, name: 'Period Prediction', date: '2026-08-06', alertText: '3 days before', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { id: 2, name: 'Daily Vitamin Check', date: '2026-07-22', alertText: '1 day before', color: 'bg-blue-50 text-blue-700 border-blue-200' }
  ]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderName, setNewReminderName] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderAlert, setNewReminderAlert] = useState('3 days before');

  useEffect(() => {
    // Load local logs and custom cycle parameters on mount
    const savedDate = localStorage.getItem('periodStartDate');
    if (savedDate) {
      const clean = savedDate.split('T')[0];
      setPeriodDate(clean);
      setEditStartDate(clean);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setPeriodDate(today);
      setEditStartDate(today);
    }

    const savedLength = localStorage.getItem('periodCycleLength');
    if (savedLength) {
      const len = parseInt(savedLength) || 28;
      setCycleLength(len);
      setEditCycleLength(String(len));
    }

    const savedDuration = localStorage.getItem('periodDuration');
    if (savedDuration) {
      const dur = parseInt(savedDuration) || 5;
      setPeriodDuration(dur);
      setEditPeriodDuration(String(dur));
    }

    const savedLogs = localStorage.getItem('periodLogs');
    if (savedLogs) {
      const parsed = JSON.parse(savedLogs);
      setLogs(getDeduplicatedLogs(parsed));
    } else if (savedDate) {
      const initialLog = [{ id: Date.now(), startDate: savedDate.split('T')[0], mood: 'Logged', flow: 'Medium', symptoms: 'None' }];
      setLogs(initialLog);
      localStorage.setItem('periodLogs', JSON.stringify(initialLog));
    }

    const savedDayLogs = localStorage.getItem('shecycle_day_logs');
    if (savedDayLogs) {
      setDayLogs(JSON.parse(savedDayLogs));
    }

    const savedReminders = localStorage.getItem('shecycle_reminders');
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
  }, []);

  // Update selected mood/flow inputs when selectedDate changes
  useEffect(() => {
    const dateKey = getFormattedDateKey(selectedDate);
    const existingLog = dayLogs[dateKey];
    if (existingLog) {
      setSelectedMood(existingLog.mood || '');
      setSelectedFlow(existingLog.flow || '');
    } else {
      setSelectedMood('');
      setSelectedFlow('');
    }
  }, [selectedDate, dayLogs]);

  const getFormattedDateKey = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSaveCycleProfile = (e) => {
    e.preventDefault();
    if (!editStartDate) return;

    const len = parseInt(editCycleLength) || 28;
    const dur = parseInt(editPeriodDuration) || 5;

    setPeriodDate(editStartDate);
    setCycleLength(len);
    setPeriodDuration(dur);

    localStorage.setItem('periodStartDate', editStartDate);
    localStorage.setItem('periodCycleLength', String(len));
    localStorage.setItem('periodDuration', String(dur));

    const newLog = { id: Date.now(), startDate: editStartDate, mood: 'Logged', flow: 'Medium', symptoms: 'None' };
    const updated = getDeduplicatedLogs([newLog, ...logs]);
    setLogs(updated);
    localStorage.setItem('periodLogs', JSON.stringify(updated));

    setShowConfigModal(false);
  };

  // Dynamically calculate predicted events based on user's actual chosen cycle parameters
  const getPredictedEvents = () => {
    if (!periodDate && logs.length === 0) return null;
    const lastStart = logs.length > 0 ? parseLocalDate(logs[0].startDate) : parseLocalDate(periodDate);
    
    const nextPeriod = new Date(lastStart);
    nextPeriod.setDate(nextPeriod.getDate() + cycleLength);

    const ovulationDayOffset = Math.round(cycleLength / 2);
    const ovulationDate = new Date(lastStart);
    ovulationDate.setDate(ovulationDate.getDate() + ovulationDayOffset);

    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(fertileStart.getDate() - 3);

    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(fertileEnd.getDate() + 2);

    const todayZero = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const nextZero = new Date(nextPeriod.getFullYear(), nextPeriod.getMonth(), nextPeriod.getDate());
    const diffDays = Math.ceil((nextZero.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24));

    return {
      lastPeriodStr: lastStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      nextPeriodStr: nextPeriod.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      ovulationStr: ovulationDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      fertileWindowStr: `${fertileStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${fertileEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      daysRemaining: diffDays
    };
  };

  useEffect(() => {
    if (logs.length > 0) {
      const targetTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
      let activeLog = null;
      let minDiff = Infinity;
      
      for (const log of logs) {
        const logStart = parseLocalDate(log.startDate);
        const logStartZero = new Date(logStart.getFullYear(), logStart.getMonth(), logStart.getDate());
        const diff = targetTime - logStartZero.getTime();
        
        if (diff >= 0 && diff < minDiff) {
          minDiff = diff;
          activeLog = logStartZero;
        }
      }
      
      if (!activeLog) {
        const earliestLog = parseLocalDate(logs[logs.length - 1].startDate);
        activeLog = new Date(earliestLog.getFullYear(), earliestLog.getMonth(), earliestLog.getDate());
      }
      
      const diffTime = targetTime - activeLog.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const day = ((diffDays % cycleLength) + cycleLength) % cycleLength + 1;
      const ovulationDay = Math.round(cycleLength / 2);
      
      setCycleDay(day);
      
      let phase = '';
      let suggestionDetails = {};
      if (day >= 1 && day <= periodDuration) {
        phase = 'Menstrual Phase 🩸';
        suggestionDetails = {
          meals: '🍲 Iron-rich meals (spinach, beetroot, pomegranate, lentils) and warm chamomile tea.',
          activities: '🧘‍♀️ Low-intensity exercises like yoga, light stretching, and deep breathing meditation.',
          tip: 'Stay warm, hydrate well, and listen to your body. Avoid caffeine and excessive sugar.'
        };
      } else if (day > periodDuration && day < ovulationDay) {
        phase = 'Follicular Phase 🌿';
        suggestionDetails = {
          meals: '🥗 High energy foods (healthy fats like pumpkin seeds, avocados, nuts, fresh greens, and lean proteins).',
          activities: '🏃‍♀️ High-intensity cardio, running, swimming, and strength training. Your energy levels are rising!',
          tip: 'This is the perfect time to start new projects, set goals, and socialize.'
        };
      } else if (day === ovulationDay) {
        phase = 'Ovulation Day 🌸';
        suggestionDetails = {
          meals: '🍓 Antioxidant-rich meals (berries, citrus fruits, bell peppers, broccoli) to support egg health.',
          activities: '🏋️‍♀️ Kickboxing, intense cardio, weightlifting, and active group fitness classes.',
          tip: 'Peak energy and communication skills. You are at your most fertile day.'
        };
      } else {
        phase = 'Luteal Phase 🍂';
        suggestionDetails = {
          meals: '🍠 Complex carbohydrates (sweet potatoes, oats, brown rice) and magnesium-rich foods (dark chocolate, bananas).',
          activities: '🚶‍♀️ Low-impact workouts like Pilates, resistance band training, and long outdoor walks.',
          tip: 'Curb sweet cravings with complex carbs. Practice mindfulness to ease potential PMS symptoms.'
        };
      }
      
      setCurrentPhase(phase);
      setSuggestions(suggestionDetails);
    }
  }, [selectedDate, logs, cycleLength, periodDuration]);

  const logPeriodForDate = async (dateString) => {
    const logDate = parseLocalDate(dateString);
    localStorage.setItem('periodStartDate', logDate.toISOString());
    setViewDate(logDate);
    setSelectedDate(logDate);

    const newLog = {
      id: Date.now(),
      startDate: dateString,
      mood: 'Logged',
      flow: 'Medium',
      symptoms: 'None'
    };

    const updatedLogs = getDeduplicatedLogs([newLog, ...logs]);
    setLogs(updatedLogs);
    localStorage.setItem('periodLogs', JSON.stringify(updatedLogs));

    if (isLoggedIn) {
      setLoading(true);
      try {
        const token = localStorage.getItem('saarthi_token');
        if (token) {
          await fetch(`${API_BASE}/cycle/log`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              startDate: dateString,
              mood: 'Good',
              flow: 'Medium',
              symptoms: 'None'
            })
          });
        }
      } catch (err) {
        console.warn("Could not sync with database server: ", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogPeriod = (e) => {
    e.preventDefault();
    if (!periodDate) return;
    logPeriodForDate(periodDate);
  };

  // Calendar Day Classification
  const getCyclePhaseForDate = (date) => {
    if (logs.length === 0) return null;
    
    const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    
    // Find the most recent period log that started on or before targetTime
    let activeLog = null;
    let minDiff = Infinity;
    
    for (const log of logs) {
      const logStart = parseLocalDate(log.startDate);
      const logStartZero = new Date(logStart.getFullYear(), logStart.getMonth(), logStart.getDate());
      const diff = targetTime - logStartZero.getTime();
      
      if (diff >= 0 && diff < minDiff) {
        minDiff = diff;
        activeLog = logStartZero;
      }
    }
    
    // If no past log is found, use the earliest log as baseline and project backward
    if (!activeLog) {
      const earliestLog = parseLocalDate(logs[logs.length - 1].startDate);
      activeLog = new Date(earliestLog.getFullYear(), earliestLog.getMonth(), earliestLog.getDate());
    }
    
    const diffTime = targetTime - activeLog.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // cDay represents day of the 28-day cycle
    const cDay = ((diffDays % 28) + 28) % 28 + 1;
    const isFuturePrediction = diffDays >= 28;
    
    if (cDay >= 1 && cDay <= 6) {
      if (isFuturePrediction) {
        return { phase: 'next', label: 'Next Period Prediction', icon: '🩸', color: 'bg-pink-100/60 text-pink-900 border-pink-300 border-dashed' };
      }
      if (diffDays < 0) {
        return { phase: 'previous', label: 'Previous Period', icon: '🩸', color: 'bg-amber-100/70 text-amber-900 border-amber-300' };
      }
      return { phase: 'period', label: 'Current Period', icon: '🩸', color: 'bg-rose-100 text-rose-900 border-rose-300' };
    } else if (cDay >= 7 && cDay <= 10) {
      return { phase: 'follicular', label: 'Follicular Phase', icon: '🌿', color: 'bg-purple-100/70 text-purple-900 border-purple-300' };
    } else if (cDay === 14) {
      return { phase: 'ovulation', label: 'Ovulation', icon: '☀️', color: 'bg-blue-100 text-blue-900 border-blue-300' };
    } else if ((cDay >= 11 && cDay <= 13) || (cDay >= 15 && cDay <= 17)) {
      return { phase: 'fertile', label: 'Fertile Window', icon: '🌱', color: 'bg-emerald-100 text-emerald-950 border-emerald-300' };
    } else if (cDay >= 18 && cDay <= 28) {
      return { phase: 'luteal', label: 'Luteal Phase', icon: '🍂', color: 'bg-orange-100/70 text-orange-900 border-orange-300' };
    }
    return null;
  };

  // Generate Calendar Month Grid
  const getDaysInMonthGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay(); // Weekday index for first day
    const totalDays = new Date(year, month + 1, 0).getDate(); // Total days in month
    
    const grid = [];
    // Empty starting padding
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    // Days
    for (let day = 1; day <= totalDays; day++) {
      grid.push(new Date(year, month, day));
    }
    return grid;
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Daily Emoji logger save
  const handleSaveDayLog = (mood, flow) => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    const dateKey = getFormattedDateKey(selectedDate);
    const updated = {
      ...dayLogs,
      [dateKey]: {
        mood: mood || selectedMood,
        flow: flow || selectedFlow
      }
    };
    setDayLogs(updated);
    localStorage.setItem('shecycle_day_logs', JSON.stringify(updated));
  };

  const handleSaveDayLogForButton = () => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    if (!selectedMood && !selectedFlow) return;

    const dateKey = getFormattedDateKey(selectedDate);
    const updated = {
      ...dayLogs,
      [dateKey]: {
        mood: selectedMood,
        flow: selectedFlow
      }
    };
    setDayLogs(updated);
    localStorage.setItem('shecycle_day_logs', JSON.stringify(updated));
  };

  const handleDownloadHistory = () => {
    const printWindow = window.open('', '_blank');
    const logsHtml = Object.entries(dayLogs)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([date, val]) => {
        // Strip emojis for professional clinical output
        const cleanMood = (val.mood || 'Normal / Stable').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
        const cleanFlow = (val.flow || 'None').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

        return `
          <tr>
            <td><strong>${new Date(date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong></td>
            <td><span class="badge mood">${cleanMood || 'Stable'}</span></td>
            <td><span class="badge flow">${cleanFlow || 'None'}</span></td>
          </tr>
        `;
      }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Saarthi Clinical Health Log Report</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
              padding: 40px; 
              color: #1e293b; 
              background-color: #fff;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #0f766e;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .header h1 { 
              color: #0f766e; 
              font-size: 22px; 
              font-weight: 800;
              margin: 0 0 6px 0; 
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #64748b;
              font-weight: 600;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
            }
            th, td { 
              border: 1px solid #cbd5e1; 
              padding: 10px 14px; 
              text-align: left; 
              font-size: 13px; 
            }
            th { 
              background-color: #f1f5f9; 
              font-weight: 700; 
              color: #334155;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
            }
            .badge { 
              display: inline-block; 
              padding: 4px 10px; 
              border-radius: 6px; 
              font-size: 12px; 
              font-weight: 700; 
            }
            .mood { 
              background-color: #f0fdf4; 
              color: #166534; 
              border: 1px solid #bbf7d0; 
            }
            .flow { 
              background-color: #fef2f2; 
              color: #991b1b; 
              border: 1px solid #fecaca; 
            }
            .footer {
              margin-top: 40px;
              padding-top: 16px;
              border-t: 1px solid #e2e8f0;
              font-size: 11px;
              color: #94a3b8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SAARTHI • Clinical Gynecological Cycle Log</h1>
            <div class="meta">
              <span>Patient Reference Log</span>
              <span>Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date Logged</th>
                <th>Logged Mood / Symptom State</th>
                <th>Menstrual Flow Level</th>
              </tr>
            </thead>
            <tbody>
              ${logsHtml || '<tr><td colspan="3" style="text-align:center;">No daily cycle logs recorded yet.</td></tr>'}
            </tbody>
          </table>
          <div class="footer">
            <p>Confidential Medical Record Summary • Prepared for Gynecological Clinical Consultation</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Add custom reminder
  const handleAddReminderSubmit = (e) => {
    e.preventDefault();
    if (!newReminderName || !newReminderDate) return;
    
    const newRem = {
      id: Date.now(),
      name: newReminderName,
      date: newReminderDate,
      alertText: newReminderAlert,
      color: 'bg-teal-50 text-teal-700 border-teal-200'
    };

    const updated = [...reminders, newRem];
    setReminders(updated);
    localStorage.setItem('shecycle_reminders', JSON.stringify(updated));

    // Reset inputs
    setNewReminderName('');
    setNewReminderDate('');
    setShowAddReminder(false);
  };

  const handleDeleteReminder = (id) => {
    const updated = reminders.filter(rem => rem.id !== id);
    setReminders(updated);
    localStorage.setItem('shecycle_reminders', JSON.stringify(updated));
  };

  const gridDays = getDaysInMonthGrid();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner Card with Real Image */}
      <div className="bg-white border border-[#ECE8F5] rounded-[20px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs text-left">
        <div className="space-y-2 max-w-xl">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#D88AB4] bg-[#D88AB4]/10 px-3 py-1 rounded-full border border-[#D88AB4]/20">
            🌸 Natural Women's Health & Cycle Tracking
          </span>
          <h2 className="font-outfit text-2xl sm:text-3xl font-black text-[#2D2A4A]">SheCycle+ Menstrual Wellness</h2>
          <p className="text-xs sm:text-sm text-[#5F6473] leading-relaxed">
            Monitor cycle trends, log biological indicators, and view custom natural dietary guidelines tailored to your body.
          </p>
        </div>
        <img 
          src={shecycleWellnessImg} 
          alt="SheCycle Wellness" 
          className="w-full md:w-72 h-44 object-cover rounded-2xl border border-[#ECE8F5] shadow-xs"
        />
      </div>

      {/* Dynamic AI Period & Ovulation Prediction Summary Banner */}
      {(() => {
        const pred = getPredictedEvents();
        if (!pred) return null;
        return (
          <div className="bg-[#FAF8FC] border border-[#ECE8F5] rounded-[20px] p-6 shadow-xs text-left grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="space-y-1 md:col-span-1 border-b md:border-b-0 md:border-r border-[#ECE8F5] pb-3 md:pb-0 md:pr-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C06093] bg-[#D88AB4]/15 px-2.5 py-0.5 rounded-full">
                🩸 Next Predicted Period
              </span>
              <h4 className="font-outfit text-xl font-black text-[#2D2A4A]">{pred.nextPeriodStr}</h4>
              <p className="text-xs font-bold text-[#6D5BD0]">
                {pred.daysRemaining > 0 ? `In approx. ${pred.daysRemaining} days` : pred.daysRemaining === 0 ? 'Today!' : 'Period expected'}
              </p>
            </div>

            <div className="space-y-1 md:col-span-1 border-b md:border-b-0 md:border-r border-[#ECE8F5] pb-3 md:pb-0 md:pr-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B826E] bg-[#A9D8C8]/20 px-2.5 py-0.5 rounded-full">
                🌸 Estimated Ovulation
              </span>
              <h4 className="font-outfit text-base font-extrabold text-[#2D2A4A]">{pred.ovulationStr}</h4>
              <p className="text-[11px] text-[#5F6473]">Peak fertile day of cycle</p>
            </div>

            <div className="space-y-1 md:col-span-1 border-b md:border-b-0 md:border-r border-[#ECE8F5] pb-3 md:pb-0 md:pr-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B6B38] bg-[#F3E8D6]/50 px-2.5 py-0.5 rounded-full">
                🌱 Fertile Window
              </span>
              <h4 className="font-outfit text-xs font-bold text-[#2D2A4A]">{pred.fertileWindowStr}</h4>
              <p className="text-[11px] text-[#5F6473]">High chance of conception</p>
            </div>

            <div className="md:col-span-1 flex flex-col justify-center gap-2">
              <button
                onClick={() => setShowConfigModal(true)}
                className="w-full py-2.5 px-4 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Change Cycle Profile</span>
              </button>
              <span className="text-[10px] text-[#8A8FA3] text-center">Customized for your body</span>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Date Input, Calendar Grid & Reminders */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Log Last Period Input */}
          <div className="bg-white rounded-[18px] border border-[#ECE8F5] p-5 shadow-xs space-y-4 text-left font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-[#ECE8F5]">
              <h3 className="font-outfit text-xs font-bold text-[#2D2A4A] uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#6D5BD0]" />
                <span>Log Period Start</span>
              </h3>
              <button
                onClick={() => setShowConfigModal(true)}
                className="text-[10px] font-bold text-[#6D5BD0] hover:underline cursor-pointer"
              >
                Setup Cycle
              </button>
            </div>
            
            <form onSubmit={handleLogPeriod} className="flex gap-2">
              <input 
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={periodDate}
                onChange={(e) => setPeriodDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-xs bg-white text-[#2D2A4A]"
              />
              <button 
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl font-bold text-xs transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                {loading ? 'Logging...' : 'Log'}
              </button>
            </form>
          </div>

          {/* Calming Custom Menstrual Calendar Grid */}
          <div className="bg-white rounded-2xl border border-warm-200 p-5 shadow-sm space-y-4">
            
            {/* Calendar Controls */}
            <div className="flex justify-between items-center pb-2">
              <h3 className="font-outfit text-sm font-bold text-warm-850 uppercase tracking-wider">
                {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-warm-200 hover:bg-warm-50 text-warm-600 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-warm-200 hover:bg-warm-50 text-warm-600 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cycle Legend Badges */}
            <div className="flex flex-wrap gap-1.5 text-[9px] font-bold pb-2 border-b border-warm-100 justify-start">
              <span className="px-2 py-1 rounded bg-rose-100 text-rose-900 border border-rose-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Menstrual (1-6)
              </span>
              <span className="px-2 py-1 rounded bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>Follicular (7-10)
              </span>
              <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-950 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Fertile (11-17)
              </span>
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Ovulation (14)
              </span>
              <span className="px-2 py-1 rounded bg-orange-100 text-orange-900 border border-orange-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>Luteal (18-28)
              </span>
              <span className="px-2 py-1 rounded bg-pink-100 text-pink-900 border border-pink-200 border-dashed flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>Next Prediction
              </span>
              <span className="px-2 py-1 rounded bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Previous
              </span>
            </div>

            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-warm-400">
              {weekDays.map(day => (
                <div key={day} className="py-1">{day}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {gridDays.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="aspect-square"></div>;
                }

                const dayNum = date.getDate();
                const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
                const phaseInfo = getCyclePhaseForDate(date);
                
                let cellClass = "aspect-square rounded-xl border border-warm-100 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-warm-50 relative ";
                if (phaseInfo) {
                  cellClass += `${phaseInfo.color} font-bold `;
                } else {
                  cellClass += "bg-white text-warm-800 ";
                }
                if (isSelected) {
                  cellClass += "ring-2 ring-teal-600 ring-offset-1 ";
                }

                return (
                  <button 
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={cellClass}
                  >
                    <span>{dayNum}</span>
                    {phaseInfo && (
                      <span className="text-[8px] absolute bottom-1 leading-none">{phaseInfo.icon}</span>
                    )}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Daily Symptoms History Card */}
          <div className="bg-white rounded-2xl border border-warm-200 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-warm-100">
              <h3 className="font-outfit text-sm font-bold text-warm-850 uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Daily Logs History</span>
              </h3>
            </div>
            
            {Object.keys(dayLogs).length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {Object.entries(dayLogs).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([dateStr, log]) => (
                  <div key={dateStr} className="p-3 rounded-xl bg-warm-50/50 border border-warm-100 flex justify-between items-center text-xs font-semibold">
                    <span className="text-warm-700 font-bold">{new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <div className="flex items-center gap-2">
                      {log.mood && <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">{log.mood}</span>}
                      {log.flow && <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">🩸 {log.flow}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-warm-450 text-center py-2">No daily mood or flow logs saved yet.</p>
            )}

            {Object.keys(dayLogs).length > 0 && (
              <button
                onClick={handleDownloadHistory}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-extrabold text-xs shadow-sm transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Download Mood & Flow History</span>
              </button>
            )}
          </div>

        </div>

        {/* Right Column: Dynamic Suggestions, Daily Logger, Reminders & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Phase Banner */}
          {suggestions ? (
            <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-warm-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-warm-500 uppercase">Current Menstrual Phase</span>
                  <h3 className="text-2xl font-black text-rose-600 mt-1">{currentPhase}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-outfit font-black">
                  D{cycleDay}
                </div>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Meal Suggestion */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-2 text-brand-700 font-bold">
                    <Apple className="w-5 h-5" />
                    <span>Nutrition & Meals</span>
                  </div>
                  <p className="text-sm text-warm-600 leading-relaxed bg-brand-50/40 p-4 rounded-xl border border-brand-100">
                    {suggestions.meals}
                  </p>
                </div>

                {/* Workout Suggestion */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-2 text-rose-600 font-bold">
                    <Dumbbell className="w-5 h-5" />
                    <span>Workouts & Activity</span>
                  </div>
                  <p className="text-sm text-warm-600 leading-relaxed bg-rose-50/40 p-4 rounded-xl border border-rose-100">
                    {suggestions.activities}
                  </p>
                </div>

              </div>

              {/* Tips banner */}
              <div className="flex gap-3 bg-warm-100/60 p-4 rounded-xl border border-warm-200/60 text-xs text-warm-600 items-start text-left">
                <Activity className="w-4 h-4 mt-0.5 text-brand-700 shrink-0" />
                <p className="leading-relaxed">
                  <strong>Saarthi Doctor Insight:</strong> {suggestions.tip}
                </p>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-warm-200 p-8 shadow-sm text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-2xl">
                🩸
              </div>
              <div>
                <h4 className="text-lg font-bold text-warm-800">No Period Log Detected</h4>
                <p className="text-sm text-warm-500 mt-1 max-w-sm mx-auto">Please enter the start date of your last period on the left side menu to see predictions and meal plans.</p>
              </div>
            </div>
          )}

          {/* Daily Logger & Reminders side-by-side grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Daily Emoji & Symptoms Logger */}
            <div className="bg-white rounded-2xl border border-warm-200 p-5 shadow-sm space-y-4 text-left">
              <h3 className="font-outfit text-sm font-bold text-warm-850 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Log For: {selectedDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
              </h3>

              <button
                onClick={handleSaveDayLogForButton}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Log for the Day
              </button>

              <div className="border-t border-warm-100 my-2"></div>

              {/* Mood Emojis Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">How do you feel?</label>
                <div className="flex gap-2 justify-between">
                  {[
                    { emoji: '😊', label: 'Happy' },
                    { emoji: '😔', label: 'Sad / PMS' },
                    { emoji: '🥱', label: 'Tired' },
                    { emoji: '😡', label: 'Crampy' },
                    { emoji: '🤢', label: 'Bloated' }
                  ].map((item) => (
                    <button
                      key={item.emoji}
                      onClick={() => setSelectedMood(item.emoji)}
                      title={item.label}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all ${
                        selectedMood === item.emoji 
                          ? 'border-teal-500 bg-teal-50 shadow-sm ring-1 ring-teal-500' 
                          : 'border-warm-200 hover:bg-warm-50'
                      }`}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menstrual Flow Level */}
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Flow Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Light', 'Medium', 'Heavy'].map((flow) => (
                    <button
                      key={flow}
                      onClick={() => setSelectedFlow(flow)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedFlow === flow 
                          ? 'border-rose-500 bg-rose-50 text-rose-700' 
                          : 'border-warm-200 text-warm-650 hover:bg-warm-50'
                      }`}
                    >
                      🩸 {flow}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reminders Card */}
            <div className="bg-white rounded-2xl border border-warm-200 p-5 shadow-sm space-y-4 text-left">
              <div className="flex justify-between items-center">
                <h3 className="font-outfit text-sm font-bold text-warm-850 uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <span>Reminders</span>
                </h3>
                <button 
                  onClick={() => setShowAddReminder(!showAddReminder)}
                  className="p-1 rounded-lg hover:bg-warm-100 text-warm-600 transition-all border border-warm-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add Reminder Form Drawer */}
              {showAddReminder && (
                <form onSubmit={handleAddReminderSubmit} className="p-4 rounded-xl border border-teal-100 bg-teal-50/30 space-y-3 animate-in slide-in-from-top duration-250">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-teal-800 uppercase">Reminder Title</label>
                    <input 
                      type="text"
                      placeholder="e.g. Period Prediction"
                      required
                      value={newReminderName}
                      onChange={(e) => setNewReminderName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-teal-800 uppercase">Target Date</label>
                    <input 
                      type="date"
                      required
                      value={newReminderDate}
                      onChange={(e) => setNewReminderDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-teal-800 uppercase">Alert Time</label>
                    <select 
                      value={newReminderAlert}
                      onChange={(e) => setNewReminderAlert(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white"
                    >
                      <option value="1 day before">1 day before</option>
                      <option value="3 days before">3 days before</option>
                      <option value="5 days before">5 days before</option>
                    </select>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    Save Reminder
                  </button>
                </form>
              )}

              {/* Reminders List */}
              <div className="space-y-2">
                {reminders.map((rem) => (
                  <div key={rem.id} className={`p-3 rounded-xl border flex justify-between items-center ${rem.color} shadow-sm`}>
                    <div>
                      <h5 className="font-extrabold text-xs">{rem.name}</h5>
                      <p className="text-[9px] opacity-75 mt-0.5">{new Date(rem.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full border border-current">
                        {rem.alertText}
                      </span>
                      <button 
                        onClick={() => handleDeleteReminder(rem.id)}
                        className="p-1 rounded-lg hover:bg-black/5 text-current transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* Logs History */}
          <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-sm space-y-4">
            <h3 className="font-outfit text-base font-bold text-warm-850 text-left">Cycle Logging History</h3>
            {logs.length > 0 ? (
              <div className="divide-y divide-warm-100">
                {logs.map((log) => (
                  <div key={log.id} className="py-3 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                        🩸
                      </div>
                      <div>
                        <p className="font-semibold text-warm-800">{new Date(log.startDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                        <p className="text-xs text-warm-400">Regular Cycle Length: 28 Days</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      Logged Successfully
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-warm-400 text-center py-4">No cycle logs saved. Complete logging above to build pattern tracking history.</p>
            )}
          </div>

        </div>

      </div>

      {/* Dynamic Cycle Parameters Setup Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-[#ECE8F5] p-6 shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200 text-left font-sans space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-[#ECE8F5]">
              <div>
                <h4 className="font-outfit text-base font-black text-[#2D2A4A]">Custom Cycle & Period Setup</h4>
                <p className="text-xs text-[#5F6473]">Configure your real period dates for dynamic predictions</p>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="p-1 hover:bg-[#F5F3FA] rounded-full text-[#2D2A4A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCycleProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#2D2A4A]">Last Period Start Date *</label>
                <input 
                  type="date"
                  required
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-xs bg-white text-[#2D2A4A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2D2A4A]">Average Cycle (Days)</label>
                  <input 
                    type="number"
                    required
                    min="20"
                    max="45"
                    value={editCycleLength}
                    onChange={(e) => setEditCycleLength(e.target.value)}
                    placeholder="28"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-xs bg-white text-[#2D2A4A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2D2A4A]">Period Length (Days)</label>
                  <input 
                    type="number"
                    required
                    min="2"
                    max="10"
                    value={editPeriodDuration}
                    onChange={(e) => setEditPeriodDuration(e.target.value)}
                    placeholder="5"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-xs bg-white text-[#2D2A4A]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#FAF8FC] text-[#2D2A4A] rounded-xl text-[11px] font-normal leading-relaxed border border-[#ECE8F5]">
                💡 Your predictions for future period dates, ovulation, and fertile windows update dynamically based on your custom dates.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F5F3FA] text-[#2D2A4A] text-xs font-bold hover:bg-[#ECE8F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Save Profile & Predict
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default SheCycle;
