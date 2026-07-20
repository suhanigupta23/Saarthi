import React, { useState } from 'react';
import { Database, FileText, UploadCloud, Trash2, CheckCircle, Calculator, Info } from 'lucide-react';

function MediVault({ isLoggedIn, onRequireAuth }) {
  const [records, setRecords] = useState([
    { id: 1, name: "Dr. Sharma Prescription.pdf", size: "1.2 MB", date: "2026-07-02" },
    { id: 2, name: "Lab Report Blood Analysis.png", size: "450 KB", date: "2026-06-25" }
  ]);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bpStatus, setBpStatus] = useState('');

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
        date: new Date().toISOString().split('T')[0]
      };
      setRecords([newRecord, ...records]);
    }
  };

  const deleteRecord = (id) => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    setRecords(records.filter(r => r.id !== id));
  };

  const calculateBP = (e) => {
    e.preventDefault();
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    
    if (sys < 120 && dia < 80) setBpStatus("Normal (Healthy Range) 💚");
    else if (sys >= 120 && sys <= 129 && dia < 80) setBpStatus("Elevated (Monitor intake) 💛");
    else if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) setBpStatus("Hypertension Stage 1 (Consult Gynocologist) 🧡");
    else setBpStatus("Hypertension Stage 2 (High Risk! Urgent Consultation) ❤️");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="font-outfit text-3xl font-black text-warm-850">MediVault Health Locker</h2>
        <p className="text-sm text-warm-500 mt-1">Upload and secure your medical files, prescriptions, and log essential cardiovascular vitals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload records section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-warm-200 p-6 shadow-sm space-y-6">
          <h3 className="font-outfit text-lg font-bold text-warm-800 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-purple-600" />
            <span>Upload Document Locker</span>
          </h3>

          <div className="border-2 border-dashed border-warm-200 rounded-2xl p-8 text-center bg-warm-50/50 hover:bg-warm-50 transition-colors">
            <input 
              type="file" 
              id="med-file" 
              className="hidden" 
              onChange={handleUpload}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <label htmlFor="med-file" className="cursor-pointer space-y-2 block">
              <span className="text-4xl block">📤</span>
              <p className="text-sm font-semibold text-warm-700">Click to upload medical files</p>
              <p className="text-xs text-warm-400">PDF, PNG, JPG (Max 5MB)</p>
            </label>
          </div>

          {/* List of files */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-warm-500 uppercase">My Encrypted Documents</h4>
            {records.length > 0 ? (
              <div className="divide-y divide-warm-100">
                {records.map(record => (
                  <div key={record.id} className="py-3.5 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-base">
                        📄
                      </div>
                      <div>
                        <p className="font-semibold text-warm-800">{record.name}</p>
                        <p className="text-xs text-warm-400">{record.size} • Uploaded {record.date}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => deleteRecord(record.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-warm-400 text-center py-4">No records stored in vault. Upload one above.</p>
            )}
          </div>
        </div>

        {/* Vitals Calculator */}
        <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-sm space-y-6">
          <h3 className="font-outfit text-lg font-bold text-warm-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            <span>Vitals Evaluator</span>
          </h3>

          <form onSubmit={calculateBP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-500">Systolic BP (mmHg)</label>
              <input 
                type="number" 
                required
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                placeholder="e.g. 115"
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-500">Diastolic BP (mmHg)</label>
              <input 
                type="number" 
                required
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                placeholder="e.g. 78"
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all text-sm"
            >
              Analyze Vitals
            </button>
          </form>

          {bpStatus && (
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl space-y-2 animate-in fade-in duration-200">
              <span className="text-xs font-bold text-purple-500 uppercase">Analysis Results</span>
              <p className="text-sm font-extrabold text-warm-800">{bpStatus}</p>
            </div>
          )}

          <div className="flex gap-2.5 p-3.5 bg-warm-100/50 text-warm-500 rounded-xl border border-warm-200/50 text-xs items-start leading-relaxed">
            <Info className="w-4 h-4 shrink-0 text-warm-400 mt-0.5" />
            <p>
              Consistently high blood pressure readings may indicate cardiac stress or complications related to pregnancy/postpartum states. Check regularly!
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default MediVault;
