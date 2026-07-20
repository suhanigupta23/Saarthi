import React, { useState } from 'react';
import { 
  HeartPulse, Stethoscope, BookOpen, ScanFace, 
  Phone, Radar, AlertTriangle, Info, HelpCircle, X, CheckCircle, CheckCircle2
} from 'lucide-react';
import { API_BASE } from '../App.jsx';

const symptomOptions = [
  { value: "fatigue", label: "Fatigue / Low Energy" },
  { value: "irregular periods", label: "Irregular Periods / Delayed Cycle" },
  { value: "pelvic pain", label: "Pelvic Pain" },
  { value: "mood swings", label: "Mood Swings" },
  { value: "acne", label: "Acne / Skin Breakouts" },
  { value: "bloating", label: "Bloating / Swelling" },
  { value: "hot flashes", label: "Hot Flashes" },
  { value: "cramps", label: "Severe Menstrual Cramps" },
  { value: "heavy bleeding", label: "Heavy Menstrual Flow" },
  { value: "frequent urination", label: "Frequent Urination" },
  { value: "night sweats", label: "Night Sweats" },
  { value: "hair thinning", label: "Hair Thinning / Loss" },
  { value: "weight gain", label: "Unexplained Weight Gain" }
];

function SymptoScan({ onTabChange }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [tips, setTips] = useState([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [scanModeInfo, setScanModeInfo] = useState('');

  const toggleSymptom = (value) => {
    if (selectedSymptoms.includes(value)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== value));
    } else {
      setSelectedSymptoms([...selectedSymptoms, value]);
    }
  };

  const handleCheck = async () => {
    if (selectedSymptoms.length === 0) {
      alert("Please select at least one symptom.");
      return;
    }

    setLoading(true);
    setResult(null);
    setShowTips(false);
    setScanModeInfo('');

    try {
      const token = localStorage.getItem('saarthi_token');
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/symptoscan/predict`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ symptoms: selectedSymptoms }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error("API scan failed");
      setResult(data);
    } catch (err) {
      console.error(err);
      setScanModeInfo("Running local clinical rules analyzer.");
      const fallbackResult = runLocalFallback(selectedSymptoms);
      setResult(fallbackResult);
    } finally {
      setLoading(false);
    }
  };

  const runLocalFallback = (symptoms) => {
    const conditionSymptoms = {
      "PCOD/PCOS": ["irregular periods", "acne", "weight gain", "hair thinning"],
      "Endometriosis": ["pelvic pain", "cramps", "fatigue"],
      "Fibroids": ["heavy bleeding", "pelvic pain", "frequent urination"],
      "PMS/PMDD": ["mood swings", "bloating", "fatigue"],
      "Menopause": ["hot flashes", "night sweats"]
    };

    let bestMatch = "Condition not confidently detected";
    let maxMatches = 0;

    for (const [cond, symList] of Object.entries(conditionSymptoms)) {
      let count = 0;
      symptoms.forEach(s => {
        if (symList.includes(s)) count++;
      });
      if (count > maxMatches) {
        maxMatches = count;
        bestMatch = cond;
      }
    }

    const confidence = maxMatches > 0 ? (maxMatches / 4) : 0.0;
    return {
      predicted_condition: bestMatch,
      confidence: confidence,
      urgency: confidence > 0.6 ? "Medium" : "Low",
      recommended_specialist: "Gynecologist",
      doctor_questions: [
        "Are there specific clinical tests you recommend for these symptoms?",
        "Should I track these symptoms over a specific number of cycles?"
      ],
      home_care: "Ensure proper hydration, follow a balanced diet, and rest."
    };
  };

  const handleSelfCareClick = () => {
    setShowTips(true);
    setLoadingTips(false);
    
    let defaultList = [
      "Stay well-hydrated throughout the day (2.5 to 3 liters of water).",
      "Practice gentle pelvic stretching or yoga to relieve muscle tension.",
      "Maintain a balanced diet rich in fiber, antioxidants, and omega-3 fatty acids.",
      "Ensure 7 to 9 hours of quality, restorative sleep each night."
    ];

    if (result && result.home_care) {
      defaultList.unshift(`Targeted Advice: ${result.home_care}`);
    }

    setTips(defaultList);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left font-sans">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#ECE8F5] rounded-[20px] p-6 md:p-8 space-y-2 shadow-xs">
        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#6D5BD0] bg-[#B6A8F8]/15 px-3 py-1 rounded-full border border-[#B6A8F8]/30">
          🤖 AI Clinical Symptom Guidance
        </span>
        <h2 className="font-outfit text-2xl sm:text-3xl font-black text-[#2D2A4A]">SymptoScan AI Check</h2>
        <p className="text-xs sm:text-sm text-[#5F6473] leading-relaxed">
          Select symptoms to evaluate common women's health conditions like PCOS, Fibroids, or Menstrual disruptions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Symptoms Selector */}
        <div className="bg-white rounded-[18px] border border-[#ECE8F5] p-6 shadow-xs space-y-6">
          <h3 className="font-outfit text-lg font-bold text-[#2D2A4A] flex items-center gap-2 border-b border-[#ECE8F5] pb-3">
            <ScanFace className="w-5 h-5 text-[#6D5BD0]" />
            <span>Select Symptoms</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {symptomOptions.map((option) => {
              const selected = selectedSymptoms.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleSymptom(option.value)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selected 
                      ? 'bg-[#B6A8F8]/20 border-[#6D5BD0] text-[#2D2A4A] shadow-xs' 
                      : 'border-[#ECE8F5] text-[#5F6473] hover:bg-[#F5F3FA] hover:text-[#2D2A4A]'
                  }`}
                >
                  <span>{option.label}</span>
                  {selected && <CheckCircle className="w-4 h-4 text-[#6D5BD0]" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={handleCheck}
              disabled={loading || selectedSymptoms.length === 0}
              className="w-full py-3.5 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl font-bold transition-colors shadow-xs disabled:opacity-50 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Analyzing Symptoms via Gemini AI...' : 'Analyze Symptoms'}
            </button>
          </div>
        </div>

        {/* Diagnosis Results */}
        <div className="space-y-6 transition-all duration-300">
          <div className="bg-white rounded-2xl border border-warm-200 p-7 shadow-sm space-y-6">
            <h3 className="font-outfit text-xl font-bold text-warm-800 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-brand-600" />
              <span>Diagnostic Report</span>
            </h3>

            {loading ? (
              <div className="text-center py-14 space-y-4 animate-in fade-in duration-200 bg-teal-50/20 border border-teal-100/50 rounded-2xl">
                <div className="w-10 h-10 border-4 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-teal-950">Analyzing Symptoms</h4>
                  <p className="text-xs text-teal-650 font-semibold">Generating clinical guidance via Gemini AI...</p>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                {scanModeInfo && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm font-bold">
                    ⚠️ {scanModeInfo}
                  </div>
                )}
                <div className="p-5 bg-warm-50 rounded-xl border border-warm-200 space-y-4 text-sm">
                  
                  {/* Condition & Urgency */}
                  <div className="flex justify-between items-start border-b border-warm-200 pb-3">
                    <div>
                      <span className="text-xs font-bold text-warm-500 uppercase tracking-wider flex items-center gap-1">
                        <Radar className="w-3.5 h-3.5 text-blue-500" />
                        <span>Predicted Condition</span>
                      </span>
                      <h4 className="text-lg font-black text-warm-900 mt-1">{result.predicted_condition}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-black uppercase text-[10px] ${
                      result.urgency === 'High' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      result.urgency === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {result.urgency || 'Low'} Urgency
                    </span>
                  </div>

                  {/* Specialist & Confidence */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold text-warm-500 block text-xs uppercase">Consult:</span>
                      <span className="text-warm-900 font-extrabold text-sm">{result.recommended_specialist || 'Gynecologist'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-warm-500 block text-xs uppercase">Confidence Match:</span>
                      <span className="text-warm-900 font-extrabold text-sm">{(result.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Home Care Section */}
                  {result.home_care && (
                    <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 text-warm-800 leading-relaxed text-sm">
                      <strong className="text-emerald-950 font-bold block mb-0.5">Home Care Tip:</strong> {result.home_care}
                    </div>
                  )}

                  {/* Doctor Questions */}
                  {result.doctor_questions && result.doctor_questions.length > 0 && (
                    <div className="space-y-2 border-t border-warm-150 pt-3">
                      <strong className="text-warm-900 font-bold block text-sm">Questions to ask your doctor:</strong>
                      <ul className="list-disc list-inside text-warm-850 pl-1 space-y-1.5 text-sm">
                        {result.doctor_questions.map((q, idx) => (
                          <li key={idx} className="leading-relaxed">{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 p-4 bg-yellow-50 text-yellow-900 rounded-xl border border-yellow-250 text-xs leading-relaxed">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-yellow-600 mt-0.5" />
                  <p>
                    <strong>Medical Disclaimer:</strong> SymptoScan provides general insights based on AI matches. It is NOT a substitute for professional clinical advice.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={handleSelfCareClick}
                    className="flex items-center justify-center gap-1.5 border border-warm-300 text-warm-800 px-4 py-3 rounded-xl text-sm font-bold hover:bg-warm-100 transition-colors"
                  >
                    <BookOpen className="w-4.5 h-4.5 text-warm-600" />
                    <span>Self-Care Tips</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (onTabChange) {
                        onTabChange('gynconnect');
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 bg-brand-600 text-white px-4 py-3 rounded-xl text-sm font-extrabold hover:bg-brand-700 transition-colors text-center shadow-sm cursor-pointer"
                  >
                    <Phone className="w-4.5 h-4.5" />
                    <span>Book Consult</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-warm-450 space-y-3">
                <HeartPulse className="w-14 h-14 text-warm-350 mx-auto animate-pulse" />
                <p className="text-sm leading-relaxed max-w-[220px] mx-auto">
                  Select your symptoms on the left and submit to scan for conditions.
                </p>
              </div>
            )}
          </div>

          {/* Self-Care Modal Backdrop Overlay */}
          {showTips && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
              {/* Modal Container */}
              <div className="bg-white rounded-2xl border border-teal-100/50 p-6 shadow-xl space-y-5 max-w-lg w-full animate-in zoom-in-95 duration-200 text-left">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-3 border-b border-teal-50">
                  <h4 className="font-outfit text-base font-extrabold text-teal-950 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-700" />
                    <span>Self-Care Suggestions</span>
                  </h4>
                  <button 
                    onClick={() => setShowTips(false)}
                    className="p-1.5 hover:bg-teal-50 rounded-lg text-teal-800 transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Content */}
                {loadingTips ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-extrabold text-teal-750">Fetching advice...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ul className="text-xs sm:text-sm text-teal-950 space-y-3 list-none pl-0">
                      {tips.map((tip, idx) => (
                        <li key={idx} className="leading-relaxed flex items-start gap-2.5 p-3.5 rounded-xl bg-teal-50/25 border border-teal-100/40 font-semibold shadow-soft">
                          <CheckCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer Action */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowTips(false)}
                    className="bg-teal-50 hover:bg-teal-100/50 text-teal-950 border border-teal-100 px-4 py-2 rounded-lg text-xs font-extrabold transition-colors shadow-sm cursor-pointer"
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default SymptoScan;
