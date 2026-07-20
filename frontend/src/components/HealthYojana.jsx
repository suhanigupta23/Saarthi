import React, { useState } from 'react';
import { FileText, Search, CheckCircle, HelpCircle } from 'lucide-react';

const stateSchemes = {
  "Madhya Pradesh": [
    { id: 1, title: "Janani Suraksha Yojana (JSY)", benefits: "💸 Cash assistance of ₹1,400 for institutional delivery in rural areas.", category: "Maternity" },
    { id: 2, title: "Lado Campaign Scheme", benefits: "🛡️ Free legal counseling and counseling for child marriage prevention.", category: "Welfare" }
  ],
  "Delhi": [
    { id: 3, title: "Delhi Ladli Scheme", benefits: "💰 Financial aid up to ₹1,00,000 for secondary education and marriage maturity.", category: "Welfare" },
    { id: 4, title: "Janani Shishu Suraksha Karyakram (JSSK)", benefits: "🩺 100% free drugs, food, and diagnostics during delivery and neonate treatment.", category: "Maternity" }
  ],
  "National": [
    { id: 5, title: "Pradhan Mantri Matru Vandana Yojana (PMMVY)", benefits: "💸 Maternity benefits cash incentive of ₹5,000 directly to bank accounts.", category: "Maternity" },
    { id: 6, title: "Ayushman Bharat PM-JAY", benefits: "🏥 Free health insurance coverage up to ₹5,000,000 per family per year.", category: "Insurance" }
  ]
};

function HealthYojana() {
  const [selectedState, setSelectedState] = useState('National');
  const [schemes, setSchemes] = useState(stateSchemes["National"]);

  const handleStateChange = (state) => {
    setSelectedState(state);
    const stateList = stateSchemes[state] || [];
    const nationalList = stateSchemes["National"];
    setSchemes([...stateList, ...nationalList]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="font-outfit text-3xl font-black text-warm-850">HealthYojana Scheme Matcher</h2>
        <p className="text-sm text-warm-500 mt-1">Discover government health programs, maternity aids, and insurance schemes matching your state profile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* State Selector */}
        <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-sm space-y-4 h-fit">
          <h3 className="font-outfit text-lg font-bold text-warm-800 flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            <span>Select Location</span>
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-warm-500">Your State Profile</label>
            <select 
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
            >
              <option value="National">All India (Central Schemes)</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Delhi">Delhi</option>
            </select>
          </div>

          <div className="flex gap-2.5 p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-xs">
            <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p>Selecting your state matches local state welfare funds with central schemes.</p>
          </div>
        </div>

        {/* Schemes Results List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-outfit text-base font-bold text-warm-800">
            Available Schemes ({schemes.length})
          </h3>

          <div className="space-y-4">
            {schemes.map((scheme) => (
              <div 
                key={scheme.id} 
                className="bg-white p-6 rounded-2xl border border-warm-200 shadow-sm space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <h4 className="font-bold text-warm-800 text-base">{scheme.title}</h4>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    {scheme.category}
                  </span>
                </div>
                <p className="text-sm text-warm-600 leading-relaxed bg-warm-50 p-4 rounded-xl border border-warm-200/50">
                  {scheme.benefits}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Eligible - Verified by Saarthi Matcher</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

export default HealthYojana;
