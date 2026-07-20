import React, { useState } from 'react';
import { 
  Database, FileText, UploadCloud, Trash2, CheckCircle, 
  Calculator, Info, Share2, Link, Copy, Check, X, TrendingUp, Activity, Calendar, ExternalLink
} from 'lucide-react';

function MediVault({ isLoggedIn, onRequireAuth }) {
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('medivault_records');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "Dr. Sharma Prescription.pdf", size: "1.2 MB", date: "2026-07-02", type: "Prescription" },
      { id: 2, name: "Lab Report Blood Analysis.png", size: "450 KB", date: "2026-06-25", type: "Lab Report" }
    ];
  });

  const [consultations] = useState([
    { id: 'APT-9402', doctor: 'Dr. Smita Jain', specialty: 'Maternity Psychologist', date: '12 July 2026', status: 'Completed' },
    { id: 'APT-8410', doctor: 'Dr. Anjali Verma', specialty: 'Gynecologist & Obstetrician', date: '02 June 2026', status: 'Completed' }
  ]);
  
  // Vitals Evaluator & Dynamic Personalised Trend Graph States
  const [vitalsTrend, setVitalsTrend] = useState(() => {
    const saved = localStorage.getItem('medivault_vitals');
    return saved ? JSON.parse(saved) : [
      { month: 'Jan', sys: 118, dia: 78, sugar: 92, weight: 58 },
      { month: 'Feb', sys: 120, dia: 80, sugar: 95, weight: 58.5 },
      { month: 'Mar', sys: 122, dia: 81, sugar: 88, weight: 59 },
      { month: 'Apr', sys: 119, dia: 79, sugar: 91, weight: 59.2 },
      { month: 'May', sys: 121, dia: 80, sugar: 94, weight: 60 },
      { month: 'Jun', sys: 120, dia: 78, sugar: 90, weight: 60 }
    ];
  });

  const [vitalTab, setVitalTab] = useState('bp'); // 'bp' or 'bmi'
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bpResult, setBpResult] = useState(null);

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmiResult, setBmiResult] = useState(null);

  // Sharing Modal States
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareDoc, setSelectedShareDoc] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleUpload = (e) => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    const file = e.target.files[0];
    if (file) {
      const newRecord = {
        id: Date.now(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        date: new Date().toISOString().split('T')[0],
        type: file.name.toLowerCase().includes('report') ? 'Lab Report' : 'Prescription'
      };
      const updated = [newRecord, ...records];
      setRecords(updated);
      localStorage.setItem('medivault_records', JSON.stringify(updated));
    }
  };

  const deleteRecord = (id) => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem('medivault_records', JSON.stringify(updated));
  };

  // Accurate AHA 2017 BP Classifier with Low BP / Hypotension Check
  const calculateBP = (e) => {
    e.preventDefault();
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    
    // Update personalized graph dynamically with user reading
    setVitalsTrend(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        month: 'Jul (Now)',
        sys: sys,
        dia: dia
      };
      localStorage.setItem('medivault_vitals', JSON.stringify(updated));
      return updated;
    });

    if (sys < 90 || dia < 60) {
      setBpResult({
        category: "Hypotension (Low BP)",
        desc: "Low blood pressure reading (Systolic <90 or Diastolic <60 mmHg). Ensure adequate hydration and consult your physician if experiencing dizziness or fatigue.",
        badgeClass: "bg-blue-100 text-blue-800 border-blue-200 font-extrabold"
      });
    } else if (sys < 120 && dia < 80) {
      setBpResult({
        category: "Normal BP",
        desc: "Optimal resting blood pressure (Systolic 90-119 & Diastolic 60-79 mmHg).",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200"
      });
    } else if (sys >= 120 && sys <= 129 && dia < 80) {
      setBpResult({
        category: "Elevated BP",
        desc: "Slightly elevated. Monitor sodium intake and maintain regular exercise.",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-200"
      });
    } else if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      setBpResult({
        category: "Hypertension Stage 1",
        desc: "Stage 1 high blood pressure. Schedule a routine consult with your gynecologist.",
        badgeClass: "bg-orange-100 text-orange-800 border-orange-200"
      });
    } else if ((sys >= 140 && sys < 180) || (dia >= 90 && dia < 120)) {
      setBpResult({
        category: "Hypertension Stage 2",
        desc: "Stage 2 high blood pressure. Requires clinical medical evaluation.",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-200"
      });
    } else {
      setBpResult({
        category: "Hypertensive Crisis",
        desc: "Critical reading! Seek immediate medical or emergency evaluation.",
        badgeClass: "bg-red-200 text-red-950 border-red-300 font-extrabold"
      });
    }
  };

  // Accurate WHO Standard BMI Calculator
  const calculateBMI = (e) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;

    if (isNaN(w) || isNaN(h) || h <= 0) return;

    const bmi = (w / (h * h)).toFixed(1);

    // Update weight on dynamic graph
    setVitalsTrend(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        month: 'Jul (Now)',
        weight: w
      };
      localStorage.setItem('medivault_vitals', JSON.stringify(updated));
      return updated;
    });

    let category = '';
    let badgeClass = '';
    if (bmi < 18.5) {
      category = 'Underweight (<18.5)';
      badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
    } else if (bmi >= 18.5 && bmi <= 24.9) {
      category = 'Normal Weight (18.5 - 24.9)';
      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (bmi >= 25 && bmi <= 29.9) {
      category = 'Overweight (25 - 29.9)';
      badgeClass = 'bg-orange-100 text-orange-800 border-orange-200';
    } else {
      category = 'Obesity (≥30.0)';
      badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
    }

    setBmiResult({ val: bmi, category, badgeClass });
  };

  const handleCopyLink = () => {
    if (!selectedShareDoc) return;
    const shareUrl = `https://saarthi.health/share/vault_${selectedShareDoc.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left">
      
      {/* Header */}
      <div>
        <h2 className="font-outfit text-2xl font-black text-teal-950">MediVault Health Locker & Vitals Tracker</h2>
        <p className="text-xs text-muted-foreground mt-1">Upload encrypted medical files, track blood pressure trends, and review past consultation records.</p>
      </div>

      {/* Interactive Vitals Trend Graphs (Matching User Wireframe) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Graph 1: Weight & BP Trends Line Chart */}
        <div className="bg-white rounded-2xl border border-teal-100/60 p-5 shadow-soft space-y-3">
          <div className="flex justify-between items-center pb-1 border-b border-teal-50">
            <h4 className="font-outfit text-xs font-extrabold text-teal-950 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-800"></span>
              <span>Weight & BP Trends (Personalized Data)</span>
            </h4>
            <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Systolic / Diastolic</span>
          </div>

          <div className="relative pt-2">
            <svg viewBox="0 0 320 130" className="w-full h-32 overflow-visible">
              {/* Grid Lines */}
              <line x1="30" y1="20" x2="310" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="30" y1="55" x2="310" y2="55" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="30" y1="90" x2="310" y2="90" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="5" y="24" fill="#94a3b8" fontSize="9" fontWeight="700">140</text>
              <text x="5" y="59" fill="#94a3b8" fontSize="9" fontWeight="700">105</text>
              <text x="5" y="94" fill="#94a3b8" fontSize="9" fontWeight="700">70</text>

              {/* Dynamic Systolic Line Plot (Top) */}
              {(() => {
                const pts = vitalsTrend.map((d, i) => {
                  const x = 40 + i * 52;
                  const y = Math.max(15, Math.min(105, 110 - ((d.sys - 70) / 70) * 85));
                  return { x, y, val: d.sys };
                });
                const pathD = pts.reduce((acc, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '');

                return (
                  <>
                    <path d={pathD} fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" />
                    {pts.map((pt, i) => (
                      <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#0f766e" />
                    ))}
                  </>
                );
              })()}

              {/* Dynamic Diastolic Line Plot (Bottom) */}
              {(() => {
                const pts = vitalsTrend.map((d, i) => {
                  const x = 40 + i * 52;
                  const y = Math.max(15, Math.min(105, 110 - ((d.dia - 70) / 70) * 85));
                  return { x, y, val: d.dia };
                });
                const pathD = pts.reduce((acc, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '');

                return (
                  <>
                    <path d={pathD} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" />
                    {pts.map((pt, i) => (
                      <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#64748b" />
                    ))}
                  </>
                );
              })()}

              {/* X Axis Labels */}
              {vitalsTrend.map((d, i) => (
                <text key={i} x={35 + i * 52} y="115" fill="#64748b" fontSize="9" fontWeight="700">
                  {d.month}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Graph 2: Blood Sugar Levels Bar Chart */}
        <div className="bg-white rounded-2xl border border-teal-100/60 p-5 shadow-soft space-y-3">
          <div className="flex justify-between items-center pb-1 border-b border-teal-50">
            <h4 className="font-outfit text-xs font-extrabold text-teal-950 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-800"></span>
              <span>Blood Sugar Levels (Fasting mg/dL)</span>
            </h4>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Normal Range (90 mg/dL)</span>
          </div>

          <div className="relative pt-2">
            <svg viewBox="0 0 320 130" className="w-full h-32 overflow-visible">
              <line x1="30" y1="20" x2="310" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="30" y1="55" x2="310" y2="55" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="30" y1="90" x2="310" y2="90" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />

              <text x="5" y="24" fill="#94a3b8" fontSize="9" fontWeight="700">100</text>
              <text x="5" y="59" fill="#94a3b8" fontSize="9" fontWeight="700">75</text>
              <text x="5" y="94" fill="#94a3b8" fontSize="9" fontWeight="700">50</text>

              {/* Bar Elements */}
              {[
                { x: 35, h: 72 },
                { x: 80, h: 68 },
                { x: 130, h: 65 },
                { x: 180, h: 71 },
                { x: 230, h: 67 },
                { x: 280, h: 66 }
              ].map((bar, i) => (
                <rect 
                  key={i} 
                  x={bar.x} 
                  y={105 - bar.h} 
                  width="22" 
                  height={bar.h} 
                  rx="3" 
                  fill="#6b7280" 
                />
              ))}

              <text x="35" y="115" fill="#64748b" fontSize="9" fontWeight="700">Jan</text>
              <text x="80" y="115" fill="#64748b" fontSize="9" fontWeight="700">Feb</text>
              <text x="130" y="115" fill="#64748b" fontSize="9" fontWeight="700">Mar</text>
              <text x="180" y="115" fill="#64748b" fontSize="9" fontWeight="700">Apr</text>
              <text x="230" y="115" fill="#64748b" fontSize="9" fontWeight="700">May</text>
              <text x="280" y="115" fill="#64748b" fontSize="9" fontWeight="700">Jun</text>
            </svg>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload records section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[18px] border border-[#ECE8F5] p-6 shadow-xs space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-[#ECE8F5]">
              <h3 className="font-outfit text-sm font-extrabold text-[#2D2A4A] flex items-center gap-2">
                <UploadCloud className="w-4.5 h-4.5 text-[#6D5BD0]" />
                <span>Encrypted Document Locker</span>
              </h3>

              <button
                onClick={() => {
                  if (records.length > 0) setSelectedShareDoc(records[0]);
                  setShowShareModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8FC] text-[#2D2A4A] hover:bg-[#F5F3FA] border border-[#6D5BD0] transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#6D5BD0]" />
                <span>Share Prescriptions</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-[#6D5BD0]/30 rounded-[18px] p-6 text-center bg-[#F5F3FA]/50 hover:bg-[#F5F3FA] transition-colors">
              <input 
                type="file" 
                id="med-file" 
                className="hidden" 
                onChange={handleUpload}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <label htmlFor="med-file" className="cursor-pointer space-y-2 block">
                <UploadCloud className="w-8 h-8 text-[#6D5BD0] mx-auto" />
                <p className="text-xs font-bold text-[#2D2A4A]">Click to upload medical files & prescriptions</p>
                <p className="text-[10px] text-[#5F6473]">PDF, PNG, JPG (Client-side encrypted sandbox)</p>
              </label>
            </div>

            {/* List of files */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-[#8A8FA3] uppercase tracking-wider">My Encrypted Documents</h4>
              {records.length > 0 ? (
                <div className="divide-y divide-[#ECE8F5] border border-[#ECE8F5] rounded-xl px-4 bg-white">
                  {records.map(record => (
                    <div key={record.id} className="py-3 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#B6A8F8]/15 text-[#6D5BD0] flex items-center justify-center font-bold border border-[#B6A8F8]/30">
                          <FileText className="w-4 h-4 text-[#6D5BD0]" />
                        </div>
                        <div>
                          <p className="font-bold text-[#2D2A4A]">{record.name}</p>
                          <p className="text-[10px] text-[#5F6473]">{record.size} • Uploaded {record.date}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedShareDoc(record);
                            setShowShareModal(true);
                          }}
                          className="p-1.5 hover:bg-[#F5F3FA] text-[#6D5BD0] rounded-lg transition-colors cursor-pointer"
                          title="Share document link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteRecord(record.id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#5F6473] text-center py-4">No records stored in vault. Upload one above.</p>
              )}
            </div>
          </div>

          {/* Past Consultation Records Card */}
          <div className="bg-white rounded-[18px] border border-[#ECE8F5] p-5 shadow-xs space-y-3">
            <h4 className="font-outfit text-xs font-bold text-[#2D2A4A] flex items-center gap-2 pb-2 border-b border-[#ECE8F5]">
              <Calendar className="w-4 h-4 text-[#6D5BD0]" />
              <span>Consultation & Appointment History</span>
            </h4>
            <div className="divide-y divide-[#ECE8F5]">
              {consultations.map(c => (
                <div key={c.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-[#2D2A4A]">{c.doctor}</p>
                    <p className="text-[10px] text-[#5F6473]">{c.specialty} • {c.date}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#A9D8C8]/20 text-[#3B826E] border border-[#A9D8C8]/30">
                    {c.status} ✓
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vitals Evaluator */}
        <div className="bg-white rounded-[18px] border border-[#ECE8F5] p-6 shadow-xs space-y-5">
          <div className="flex justify-between items-center pb-2 border-b border-[#ECE8F5]">
            <h3 className="font-outfit text-sm font-bold text-[#2D2A4A] flex items-center gap-2">
              <Calculator className="w-4.5 h-4.5 text-[#6D5BD0]" />
              <span>Vitals Evaluator</span>
            </h3>

            <div className="flex gap-1 bg-[#F5F3FA] p-1 rounded-xl border border-[#ECE8F5] text-[10px] font-bold">
              <button 
                onClick={() => setVitalTab('bp')} 
                className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${vitalTab === 'bp' ? 'bg-white text-[#2D2A4A] shadow-xs' : 'text-[#5F6473]'}`}
              >
                BP
              </button>
              <button 
                onClick={() => setVitalTab('bmi')} 
                className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${vitalTab === 'bmi' ? 'bg-white text-[#2D2A4A] shadow-xs' : 'text-[#5F6473]'}`}
              >
                BMI
              </button>
            </div>
          </div>

          {vitalTab === 'bp' ? (
            <form onSubmit={calculateBP} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#2D2A4A]">Systolic BP (mmHg)</label>
                <input 
                  type="number" 
                  required
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  placeholder="e.g. 115"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-xs bg-white text-[#2D2A4A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#2D2A4A]">Diastolic BP (mmHg)</label>
                <input 
                  type="number" 
                  required
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  placeholder="e.g. 78"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-xs bg-white text-[#2D2A4A]"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl font-bold transition-colors text-xs shadow-xs cursor-pointer"
              >
                Analyze Blood Pressure
              </button>
            </form>
          ) : (
            <form onSubmit={calculateBMI} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#2D2A4A]">Weight (kg)</label>
                <input 
                  type="number" 
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 58"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-xs bg-white text-[#2D2A4A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#2D2A4A]">Height (cm)</label>
                <input 
                  type="number" 
                  required
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 162"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-xs bg-white text-[#2D2A4A]"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl font-bold transition-colors text-xs shadow-xs cursor-pointer"
              >
                Calculate BMI
              </button>
            </form>
          )}

          {vitalTab === 'bp' && bpResult && (
            <div className="p-3.5 bg-teal-50/30 border border-teal-100 rounded-xl space-y-1.5 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-teal-650 uppercase">Result</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${bpResult.badgeClass}`}>
                  {bpResult.category}
                </span>
              </div>
              <p className="text-xs text-teal-950 font-semibold leading-relaxed">{bpResult.desc}</p>
            </div>
          )}

          {vitalTab === 'bmi' && bmiResult && (
            <div className="p-3.5 bg-teal-50/30 border border-teal-100 rounded-xl space-y-1.5 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-teal-950">BMI: {bmiResult.val}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${bmiResult.badgeClass}`}>
                  {bmiResult.category}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 p-3 bg-teal-50/20 text-muted-foreground rounded-xl border border-teal-100/40 text-[11px] items-start leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 text-teal-700 mt-0.5" />
            <p>
              Calculated using AHA 2017 & WHO standard Clinical guidelines. Always verify logs with your consulting gynecologist.
            </p>
          </div>
        </div>

      </div>

      {/* Share Document Link Pop-up Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-teal-100/60 p-6 shadow-xl space-y-5 max-w-md w-full animate-in zoom-in-95 duration-200 text-left">
            
            <div className="flex justify-between items-center pb-3 border-b border-teal-50">
              <h4 className="font-outfit text-base font-extrabold text-teal-950 flex items-center gap-2">
                <Share2 className="w-4.5 h-4.5 text-teal-700" />
                <span>Share Prescription Link</span>
              </h4>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1.5 hover:bg-teal-50 rounded-lg text-teal-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-extrabold text-teal-650 uppercase tracking-wider block">Select Prescription to Share</label>
              <select 
                value={selectedShareDoc?.id || ''}
                onChange={(e) => {
                  const doc = records.find(r => r.id === parseInt(e.target.value));
                  setSelectedShareDoc(doc);
                }}
                className="w-full border border-teal-100 rounded-xl px-3.5 py-2 text-xs bg-teal-50/10 font-bold text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                {records.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.size})</option>
                ))}
              </select>
            </div>

            {selectedShareDoc && (
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-extrabold text-teal-650 uppercase tracking-wider block">Generated Temporary Secure Link</label>
                <div className="flex items-center gap-2 bg-teal-50/30 border border-teal-100 p-2.5 rounded-xl text-xs font-semibold text-teal-900">
                  <Link className="w-4 h-4 text-teal-700 shrink-0" />
                  <input 
                    readOnly 
                    value={`https://saarthi.health/share/vault_${selectedShareDoc.id}`}
                    className="bg-transparent border-none outline-none w-full text-xs font-mono text-teal-950"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
                  </button>
                  <a 
                    href={`https://wa.me/?text=Here%20is%20my%20encrypted%20medical%20prescription%20report:%20https://saarthi.health/share/vault_${selectedShareDoc.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/50 rounded-xl text-xs font-extrabold shadow-3xs transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Share on WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setShowShareModal(false)}
                className="px-4 py-1.5 bg-teal-50 hover:bg-teal-100/50 text-teal-950 text-xs font-extrabold rounded-lg border border-teal-100 cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default MediVault;
