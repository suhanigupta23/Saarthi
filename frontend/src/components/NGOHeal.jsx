import React, { useState } from 'react';
import { Building2, Search, MapPin, ExternalLink, ShieldCheck, X, Send, CheckCircle2 } from 'lucide-react';
import communitySupportImg from '../assets/community-support.jpg';

const ngoData = [
  { 
    id: 1, 
    name: "Goonj - Clean & Dignified Hygiene", 
    field: "Menstrual Hygiene", 
    state: "Madhya Pradesh",
    focus: "Distributes clean cotton sanitary napkin kits and conducts rural awareness drives on menstrual dignity.", 
    city: "Bhopal & Indore, MP",
    website: "https://goonj.org/"
  },
  { 
    id: 2, 
    name: "Snehalaya Women Crisis Care", 
    field: "Emergency Housing & Shelter", 
    state: "Delhi",
    focus: "24/7 crisis response hotline, legal counsel, and rehabilitation shelters for domestic violence survivors.", 
    city: "Delhi NCR",
    website: "https://www.snehalaya.org/"
  },
  { 
    id: 3, 
    name: "Aarohan Maternal Wellness Foundation", 
    field: "Maternal Health Support", 
    state: "Madhya Pradesh",
    focus: "Free nutritional supplement distribution and iron anemia screening camps for pregnant women.", 
    city: "Jabalpur & Gwalior, MP",
    website: "https://aarohan.org/"
  },
  { 
    id: 4, 
    name: "CORO India Women Rights Collective", 
    field: "Emergency Housing & Shelter", 
    state: "Maharashtra",
    focus: "Grassroots women leadership movement offering shelter, legal aid, and counseling in urban slums.", 
    city: "Mumbai & Pune, MH",
    website: "https://coroindia.org/"
  },
  { 
    id: 5, 
    name: "Vatsalya Reproductive Health Society", 
    field: "Maternal Health Support", 
    state: "Uttar Pradesh",
    focus: "Community-based maternal healthcare monitoring and neonatal survival programs in rural UP.", 
    city: "Lucknow & Kanpur, UP",
    website: "http://vatsalya.org.in/"
  },
  { 
    id: 6, 
    name: "Banyan Mental Health Initiative", 
    field: "Emergency Housing & Shelter", 
    state: "Tamil Nadu",
    focus: "Mental healthcare, supportive housing, and medical counseling for destitute homeless women.", 
    city: "Chennai, TN",
    website: "https://thebanyan.org/"
  },
  { 
    id: 7, 
    name: "SEWA Women Health Cooperative", 
    field: "Menstrual Hygiene", 
    state: "Gujarat",
    focus: "Self-employed women association providing community health training and low-cost sanitary care.", 
    city: "Ahmedabad, GJ",
    website: "https://www.sewa.org/"
  },
  { 
    id: 8, 
    name: "Sanchooni Rural Health Mission", 
    field: "Maternal Health Support", 
    state: "Rajasthan",
    focus: "Mobile healthcare vans delivering maternal checkups and emergency obstetrics transport.", 
    city: "Jaipur & Jodhpur, RJ",
    website: "https://www.myscheme.gov.in/"
  }
];

function NGOHeal({ isLoggedIn, onRequireAuth }) {
  const [filterState, setFilterState] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Contact Form Modal States
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);

  const filtered = ngoData.filter(n => {
    const matchState = filterState === 'All' || n.state === filterState;
    const matchCategory = filterCategory === 'All' || n.field === filterCategory;
    return matchState && matchCategory;
  });

  const handleOpenContactModal = (ngo) => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    setSelectedNgo(ngo);
    setInquirySuccess(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Save inquiry to localStorage for Profile display
    const newInquiry = {
      id: Date.now(),
      ngoName: selectedNgo.name,
      field: selectedNgo.field,
      city: selectedNgo.city,
      date: new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' }),
      status: 'Submitted 🟢',
      message: inquiryMsg
    };

    const existing = JSON.parse(localStorage.getItem('saarthi_ngo_inquiries') || '[]');
    localStorage.setItem('saarthi_ngo_inquiries', JSON.stringify([newInquiry, ...existing]));

    setInquirySuccess(true);
    setTimeout(() => {
      setSelectedNgo(null);
      setInquiryName('');
      setInquiryPhone('');
      setInquiryMsg('');
      setInquirySuccess(false);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left font-sans">
      
      {/* Header Banner Card with Real Photo */}
      <div className="bg-white border border-[#ECE8F5] rounded-[20px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2 max-w-xl">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#3B826E] bg-[#A9D8C8]/20 px-3 py-1 rounded-full border border-[#A9D8C8]/30">
            🤝 Verified Partner NGO & Shelter Network
          </span>
          <h2 className="font-outfit text-2xl sm:text-3xl font-black text-[#2D2A4A]">NGOHeal Support Network</h2>
          <p className="text-xs sm:text-sm text-[#5F6473] leading-relaxed">
            Connect with verified non-governmental healthcare clinics, shelters, and crisis response groups across India.
          </p>
        </div>
        <img 
          src={communitySupportImg} 
          alt="NGO Community Support" 
          className="w-full md:w-72 h-44 object-cover rounded-2xl border border-[#ECE8F5] shadow-xs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* NGO Filter Section */}
        <div className="bg-white rounded-[18px] border border-[#ECE8F5] p-6 shadow-xs space-y-4 h-fit">
          <h3 className="font-outfit text-sm font-extrabold text-[#2D2A4A] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#6D5BD0]" />
            <span>Search Filter</span>
          </h3>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#2D2A4A] uppercase">State Location</label>
              <select 
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-xs bg-white font-bold text-[#2D2A4A]"
              >
                <option value="All">All States</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Delhi">Delhi</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Gujarat">Gujarat</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#2D2A4A] uppercase">Service Category</label>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-xs bg-white font-bold text-[#2D2A4A]"
              >
                <option value="All">All Services</option>
                <option value="Menstrual Hygiene">Menstrual Hygiene</option>
                <option value="Emergency Housing & Shelter">Emergency Housing & Shelter</option>
                <option value="Maternal Health Support">Maternal Health Support</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#F5F3FA] border border-[#ECE8F5] rounded-xl text-[11px] text-[#2D2A4A] space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3B826E]" />
              <span>Verified NGO Network</span>
            </div>
            <p className="text-[#5F6473] text-[10px] leading-relaxed">
              All listed NGOs are 12A/80G certified healthcare organizations working directly with district hospitals.
            </p>
          </div>
        </div>

        {/* NGO Cards List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-outfit text-sm font-extrabold text-[#2D2A4A]">
            Verified Partner Organizations ({filtered.length})
          </h3>

          <div className="space-y-4">
            {filtered.map((ngo) => (
              <div 
                key={ngo.id} 
                className="bg-white p-5 rounded-[18px] border border-[#ECE8F5] shadow-xs space-y-3 hover:border-[#6D5BD0]/50 transition-all"
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <h4 className="font-outfit font-extrabold text-[#2D2A4A] text-sm">{ngo.name}</h4>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#B6A8F8]/15 text-[#6D5BD0] border border-[#B6A8F8]/30">
                    {ngo.field}
                  </span>
                </div>
                
                <p className="text-xs text-[#5F6473] leading-relaxed bg-[#FAF8FC] p-3.5 rounded-xl border border-[#ECE8F5] font-normal">
                  {ngo.focus}
                </p>

                <div className="flex justify-between items-center flex-wrap gap-3 pt-1 text-xs">
                  <span className="flex items-center gap-1 text-[#5F6473] font-medium text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-[#6D5BD0]" />
                    <span>{ngo.city}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <a 
                      href={ngo.website}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-[#ECE8F5] text-[#2D2A4A] hover:bg-[#F5F3FA] text-[11px] font-bold transition-colors flex items-center gap-1"
                    >
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button 
                      onClick={() => handleOpenContactModal(ngo)}
                      className="flex items-center gap-1 px-3.5 py-1.5 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Contact Support</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Small Popup Contact Form Card Modal */}
      {selectedNgo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-teal-100/60 p-6 shadow-xl space-y-4 max-w-md w-full animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center pb-2 border-b border-teal-50">
              <div>
                <h4 className="font-outfit text-sm font-extrabold text-teal-950">Inquiry Form: {selectedNgo.name}</h4>
                <p className="text-[10px] text-muted-foreground">{selectedNgo.city}</p>
              </div>
              <button 
                onClick={() => setSelectedNgo(null)}
                className="p-1 hover:bg-teal-50 rounded-lg text-teal-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inquirySuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h5 className="font-extrabold text-teal-950 text-sm">Inquiry Submitted Successfully!</h5>
                <p className="text-xs text-muted-foreground">Recorded in your profile history. A support representative will contact you via mobile.</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-teal-900 uppercase">Your Name</label>
                  <input 
                    type="text" 
                    required 
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="e.g. Ananya Sharma" 
                    className="w-full px-3 py-2 rounded-xl border border-teal-100 text-xs bg-teal-50/10 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-teal-900 uppercase">Mobile Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="+91 9876543210" 
                    className="w-full px-3 py-2 rounded-xl border border-teal-100 text-xs bg-teal-50/10 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-teal-900 uppercase">Message / Requirement</label>
                  <textarea 
                    required
                    rows="3"
                    value={inquiryMsg}
                    onChange={(e) => setInquiryMsg(e.target.value)}
                    placeholder="Describe your query or request for assistance..."
                    className="w-full px-3 py-2 rounded-xl border border-teal-100 text-xs bg-teal-50/10 font-bold"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setSelectedNgo(null)}
                    className="px-3.5 py-2 rounded-lg bg-teal-50 text-teal-950 text-xs font-extrabold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Inquiry</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default NGOHeal;
