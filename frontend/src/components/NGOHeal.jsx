import React, { useState } from 'react';
import { Building2, Search, MapPin, ExternalLink } from 'lucide-react';

const ngoData = [
  { id: 1, name: "Goonj - NGO Clean India", field: "Menstrual Hygiene", focus: "Distributes clean cotton pads and sanitary napkins to rural women.", city: "Delhi NCR & MP" },
  { id: 2, name: "Snehalaya Women Care", field: "Emergency Housing & Shelter", focus: "Crisis support, legal counsel, and shelter for domestic violence survivors.", city: "Delhi" },
  { id: 3, name: "Aarohan Wellness Foundation", field: "Maternal Health Support", focus: "Free nutritional supplements and iron vaccines tracking drives for mothers.", city: "Madhya Pradesh" }
];

function NGOHeal({ isLoggedIn, onRequireAuth }) {
  const [filterNGO, setFilterNGO] = useState('All');

  const filtered = filterNGO === 'All' 
    ? ngoData 
    : ngoData.filter(n => n.field === filterNGO);

  const handleContact = () => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    alert("Inquiry successfully sent to NGO. They will contact you shortly.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="font-outfit text-3xl font-black text-warm-850">NGOHeal Support Network</h2>
        <p className="text-sm text-warm-500 mt-1">Connect with verified non-governmental clinics and crisis shelter groups in India.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* NGO filter */}
        <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-sm space-y-4 h-fit">
          <h3 className="font-outfit text-lg font-bold text-warm-800 flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-500" />
            <span>Search Filter</span>
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-warm-500">Service Category</label>
            <select 
              value={filterNGO}
              onChange={(e) => setFilterNGO(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
            >
              <option value="All">All Services</option>
              <option value="Menstrual Hygiene">Menstrual Hygiene</option>
              <option value="Emergency Housing & Shelter">Emergency Housing & Shelter</option>
              <option value="Maternal Health Support">Maternal Health Support</option>
            </select>
          </div>
        </div>

        {/* Listings */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-outfit text-base font-bold text-warm-800">
            Verified Healthcare Partners ({filtered.length})
          </h3>

          <div className="space-y-4">
            {filtered.map((ngo) => (
              <div 
                key={ngo.id} 
                className="bg-white p-6 rounded-2xl border border-warm-200 shadow-sm space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <h4 className="font-bold text-warm-800 text-base">{ngo.name}</h4>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {ngo.field}
                  </span>
                </div>
                
                <p className="text-sm text-warm-600 leading-relaxed bg-warm-50 p-4 rounded-xl border border-warm-200/50">
                  {ngo.focus}
                </p>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="flex items-center gap-1 text-warm-500">
                    <MapPin className="w-3.5 h-3.5 text-warm-400" />
                    <span>Operating in: {ngo.city}</span>
                  </span>
                  <button 
                    onClick={handleContact}
                    className="flex items-center gap-1.5 text-teal-600 font-bold hover:underline"
                  >
                    <span>Contact Support</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

export default NGOHeal;
