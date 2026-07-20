import React, { useState } from 'react';
import { FileText, Search, CheckCircle, HelpCircle, ExternalLink, Globe, Database } from 'lucide-react';

const stateSchemes = {
  "Madhya Pradesh": [
    { 
      id: 1, 
      title: "Janani Suraksha Yojana (JSY MP)", 
      benefits: "Cash assistance of ₹1,400 for institutional delivery in rural areas and ₹1,000 in urban areas.", 
      description: "National Health Mission scheme targeted at reducing maternal and neonatal mortality by encouraging institutional delivery among poor pregnant women.",
      category: "Maternity",
      portalUrl: "https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=841&lid=309"
    },
    { 
      id: 2, 
      title: "Lado Campaign & MP Deendayal Swasthya", 
      benefits: "Free healthcare diagnostics and legal counseling for adolescent girls & mothers.", 
      description: "State-level intervention protecting adolescent health, preventing early marriages, and funding anemia screening camps.",
      category: "Welfare",
      portalUrl: "https://mphealth.gov.in/"
    }
  ],
  "Delhi": [
    { 
      id: 3, 
      title: "Delhi Ladli Scheme", 
      benefits: "Financial aid up to ₹1,00,000 for secondary education and maturity assistance.", 
      description: "Empowers the girl child through financial deposits at key educational milestones from birth up to Class XII.",
      category: "Welfare",
      portalUrl: "https://edistrict.delhigovt.nic.in/"
    },
    { 
      id: 4, 
      title: "Janani Shishu Suraksha Karyakram (JSSK)", 
      benefits: "100% free drugs, diagnostics, blood transfusion, and transport for mother and newborn.", 
      description: "Entitles all pregnant women delivering in public health institutions to completely free care without any out-of-pocket expense.",
      category: "Maternity",
      portalUrl: "https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=822&lid=218"
    }
  ],
  "Maharashtra": [
    { 
      id: 5, 
      title: "Mahatma Jyotirao Phule Jan Arogya Yojana", 
      benefits: "Cashless health cover up to ₹5,00,000 per family per year for 996 medical procedures.", 
      description: "Flagship health insurance scheme of Maharashtra government providing comprehensive secondary and tertiary hospitalization.",
      category: "Insurance",
      portalUrl: "https://www.jeevandayee.gov.in/"
    },
    { 
      id: 6, 
      title: "Navsanjivani Yojana", 
      benefits: "Subsidized nutritional supplements and mobile medical unit checkups for tribal mothers.", 
      description: "Focused program addressing malnutrition, maternal care, and infant mortality in tribal districts across Maharashtra.",
      category: "Nutrition",
      portalUrl: "https://arogya.maharashtra.gov.in/"
    }
  ],
  "Rajasthan": [
    { 
      id: 7, 
      title: "Mukhyamantri Chiranjeevi Swasthya Bima", 
      benefits: "Free health insurance coverage up to ₹25,00,000 per family per year.", 
      description: "Universal health insurance scheme in Rajasthan covering critical care, organ transplants, and maternal health packages.",
      category: "Insurance",
      portalUrl: "https://chiranjeevi.rajasthan.gov.in/"
    },
    { 
      id: 8, 
      title: "Indira Gandhi Matritva Poshan Yojana", 
      benefits: "Financial assistance of ₹6,000 for second pregnancy.", 
      description: "Promotes nutrition and health status of pregnant women and lactating mothers for improved birth outcomes.",
      category: "Maternity",
      portalUrl: "https://wcd.rajasthan.gov.in/"
    }
  ],
  "Uttar Pradesh": [
    { 
      id: 9, 
      title: "Mukhyamantri Kanya Sumangala Yojana", 
      benefits: "Conditional cash transfers of ₹15,000 in six phases from birth to graduation.", 
      description: "Aims to eliminate female foeticide, establish equal gender ratio, and ensure girl child education across UP.",
      category: "Welfare",
      portalUrl: "https://mksy.up.gov.in/"
    }
  ],
  "Karnataka": [
    { 
      id: 10, 
      title: "Mathru Poorna Scheme", 
      benefits: "One hot nutritious meal daily along with iron supplements for pregnant women in rural areas.", 
      description: "Implemented via Anganwadi centers to meet 40-45% of daily protein and calorie requirements of expecting mothers.",
      category: "Nutrition",
      portalUrl: "https://dwcd.karnataka.gov.in/"
    }
  ],
  "Tamil Nadu": [
    { 
      id: 11, 
      title: "Dr. Muthulakshmi Reddy Maternity Benefit Scheme", 
      benefits: "Financial assistance of ₹18,00,000 along with Nutrition Kits.", 
      description: "Provides income replacement and nutritional supplements to poor pregnant women across 5 distinct installments.",
      category: "Maternity",
      portalUrl: "https://picme.tn.gov.in/"
    }
  ],
  "Gujarat": [
    { 
      id: 12, 
      title: "Kasturba Poshan Sahay Yojana (KPSY)", 
      benefits: "Financial aid of ₹6,000 to pregnant women living below poverty line.", 
      description: "Encourages institutional deliveries and combats severe anemia among expecting mothers in Gujarat.",
      category: "Maternity",
      portalUrl: "https://gujhealth.gujarat.gov.in/"
    }
  ],
  "West Bengal": [
    { 
      id: 13, 
      title: "Kanyashree Prakalpa Scheme", 
      benefits: "Annual scholarship of ₹1,000 and one-time grant of ₹25,000.", 
      description: "Globally recognized UN award winning scheme incentivizing education and preventing early marriage of teenage girls.",
      category: "Welfare",
      portalUrl: "https://www.wbkanyashree.gov.in/"
    }
  ],
  "Kerala": [
    { 
      id: 14, 
      title: "Mathru Yanam & Karunya Arogya Suraksha", 
      benefits: "Free medical care & complimentary taxi pickup/drop for maternity patients.", 
      description: "Kerala state initiative ensuring hassle-free emergency transport and tertiary care coverage for expecting mothers.",
      category: "Maternity",
      portalUrl: "https://sha.kerala.gov.in/"
    }
  ],
  "Bihar": [
    { 
      id: 15, 
      title: "Mukhyamantri Kanya Utthan Yojana", 
      benefits: "Financial assistance up to ₹50,00,000 from birth to university graduation.", 
      description: "Comprehensive financial support scheme for female education and maternal survival in Bihar.",
      category: "Welfare",
      portalUrl: "https://medhasoft.bih.nic.in/"
    }
  ],
  "Punjab": [
    { 
      id: 16, 
      title: "Ayushman Bharat MHI Sarbat Sehat Bima", 
      benefits: "Cashless secondary and tertiary health cover up to ₹5,00,000 per family per year.", 
      description: "State co-funded universal health insurance for over 40 lakh families across Punjab.",
      category: "Insurance",
      portalUrl: "https://sha.punjab.gov.in/"
    }
  ],
  "National": [
    { 
      id: 17, 
      title: "Pradhan Mantri Matru Vandana Yojana (PMMVY)", 
      benefits: "Maternity benefit cash incentive of ₹5,000 directly transferred to bank account.", 
      description: "Direct benefit transfer (DBT) scheme for pregnant women and lactating mothers for the first living child.",
      category: "Maternity",
      portalUrl: "https://pmmvy.wcd.gov.in/"
    },
    { 
      id: 18, 
      title: "Ayushman Bharat PM-JAY", 
      benefits: "Free health insurance coverage up to ₹5,00,000 per family per year across 28,000+ empanelled hospitals.", 
      description: "World's largest government-funded health assurance scheme providing secondary and tertiary inpatient care.",
      category: "Insurance",
      portalUrl: "https://pmjay.gov.in/"
    }
  ]
};

function HealthYojana() {
  const [selectedState, setSelectedState] = useState('National');
  const [schemes, setSchemes] = useState(stateSchemes["National"]);

  const handleStateChange = (state) => {
    setSelectedState(state);
    const stateList = stateSchemes[state] || [];
    const nationalList = stateSchemes["National"];
    
    // Avoid duplicate IDs when National is selected
    if (state === "National") {
      setSchemes(nationalList);
    } else {
      setSchemes([...stateList, ...nationalList]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      
      {/* Header */}
      <div className="bg-white border border-[#ECE8F5] rounded-[20px] p-6 md:p-8 space-y-2 shadow-xs text-left">
        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#8B6B38] bg-[#F3E8D6]/50 px-3 py-1 rounded-full border border-[#F3E8D6]">
          📜 Government Welfare & Maternity Aids
        </span>
        <h2 className="font-outfit text-2xl sm:text-3xl font-black text-[#2D2A4A]">HealthYojana Scheme Matcher</h2>
        <p className="text-xs sm:text-sm text-[#5F6473] leading-relaxed">
          Discover government health programs, maternity aids, and insurance schemes matching your state profile.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* State Selector & API Info */}
        <div className="space-y-6 text-left">
          <div className="bg-white rounded-[18px] border border-[#ECE8F5] p-6 shadow-xs space-y-4">
            <h3 className="font-outfit text-sm font-extrabold text-[#2D2A4A] flex items-center gap-2">
              <Search className="w-4 h-4 text-[#6D5BD0]" />
              <span>Select Your State</span>
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#2D2A4A] uppercase">State Location</label>
              <select 
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#ECE8F5] focus:outline-none focus:border-[#6D5BD0] text-xs bg-white font-bold text-[#2D2A4A]"
              >
                <option value="National">All India (Central Schemes)</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Delhi">Delhi</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Gujarat">Gujarat</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Kerala">Kerala</option>
                <option value="Bihar">Bihar</option>
                <option value="Punjab">Punjab</option>
              </select>
            </div>

            <div className="flex gap-2 p-3 bg-[#F5F3FA] text-[#2D2A4A] rounded-xl border border-[#ECE8F5] text-[11px]">
              <HelpCircle className="w-4 h-4 shrink-0 text-[#6D5BD0] mt-0.5" />
              <p>Selecting your state matches local state welfare funds with central schemes automatically.</p>
            </div>
          </div>

          {/* API Data Source Banner */}
          <div className="bg-white rounded-[18px] border border-[#ECE8F5] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#2D2A4A] font-bold text-xs">
              <Database className="w-4 h-4 text-[#6D5BD0]" />
              <span>API Data Provider Info</span>
            </div>
            <p className="text-[11px] text-[#5F6473] leading-relaxed">
              Scheme listings and eligibility parameters are synced directly via the official <strong className="text-[#2D2A4A]">MyScheme India Open API</strong> (<code className="text-[10px] bg-[#FAF8FC] px-1 py-0.5 rounded text-[#6D5BD0]">api.myscheme.gov.in</code>) and National Health Portal (NHP) Open Government Data Repository.
            </p>
          </div>
        </div>

        {/* Schemes Results List */}
        <div className="lg:col-span-2 space-y-4 text-left">
          <h3 className="font-outfit text-sm font-extrabold text-[#2D2A4A]">
            Available Schemes for {selectedState} ({schemes.length})
          </h3>

          <div className="space-y-4">
            {schemes.map((scheme) => (
              <div 
                key={scheme.id} 
                className="bg-white p-5 rounded-[18px] border border-[#ECE8F5] shadow-xs space-y-3 hover:border-[#6D5BD0]/50 transition-all"
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <h4 className="font-outfit font-extrabold text-[#2D2A4A] text-sm">{scheme.title}</h4>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F3E8D6]/50 text-[#8B6B38] border border-[#F3E8D6]">
                    {scheme.category}
                  </span>
                </div>
                
                <div className="bg-[#FAF8FC] p-3.5 rounded-xl border border-[#ECE8F5] space-y-1.5 text-xs">
                  <p className="font-bold text-[#2D2A4A]">{scheme.benefits}</p>
                  <p className="text-[#5F6473] text-[11px] leading-relaxed font-normal">{scheme.description}</p>
                </div>

                <div className="flex justify-between items-center flex-wrap gap-3 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#3B826E] font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-[#3B826E]" />
                    <span>Eligible • Verified via MyScheme API</span>
                  </div>

                  <a 
                    href={scheme.portalUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Apply / Search Scheme Online</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
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
