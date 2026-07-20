import React, { useState } from 'react';
import { MessageCircle, Send, Users, ShieldAlert, Bot } from 'lucide-react';

const supportGroups = [
  { id: "pcos", name: "PCOS & PCOD Support Forum", members: 120 },
  { id: "pregnancy", name: "Maternal Care Support Room", members: 85 },
  { id: "mental", name: "Anxiety & General Health Support", members: 140 }
];

function CareCircle({ isLoggedIn, onRequireAuth }) {
  const [selectedGroup, setSelectedGroup] = useState(supportGroups[0]);
  const [messages, setMessages] = useState({
    pcos: [
      { id: 1, sender: "Sneha", text: "Has anyone tried seed cycling for irregular cycles? Seeking feedback.", time: "10:15 AM", isMe: false },
      { id: 2, sender: "Meera", text: "Yes! Seed cycling combined with moderate yoga helped me balance my hormonal levels.", time: "10:18 AM", isMe: false }
    ],
    pregnancy: [
      { id: 1, sender: "Priyanka", text: "Which iron supplements are highly recommended during the 2nd trimester?", time: "09:30 AM", isMe: false }
    ],
    mental: [
      { id: 1, sender: "Rupali", text: "Feeling slightly anxious today. Just wanted to share here.", time: "08:12 AM", isMe: false }
    ]
  });
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    const newMsg = {
      id: Date.now(),
      sender: "You (Anonymous)",
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    const currentList = messages[selectedGroup.id] || [];
    setMessages({
      ...messages,
      [selectedGroup.id]: [...currentList, newMsg]
    });
    setInputMsg('');

    // Simulate Realistic Peer & Medical Advisor Auto Response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "Thank you for sharing! Always ensure you consult a verified gynecologist for persistent symptoms.";
      
      const lower = userText.toLowerCase();
      if (lower.includes('pcos') || lower.includes('cycle') || lower.includes('period')) {
        replyText = "Dr. Ananya (Health Guide): For cycle regulation and PCOS management, combining low GI meals with daily 30-min walking is clinically proven to improve insulin sensitivity.";
      } else if (lower.includes('pain') || lower.includes('cramp')) {
        replyText = "Pooja (Peer Advisor): Gentle heating pads and chamomile tea really help me manage severe cramps! If pain persists, check SymptoScan AI.";
      } else if (lower.includes('pregnant') || lower.includes('maternity')) {
        replyText = "Dr. Priya (Maternity Specialist): Ensure regular folic acid & iron intake as prescribed by your doctor. Hydration is key!";
      }

      const replyMsg = {
        id: Date.now() + 1,
        sender: replyText.startsWith("Dr.") ? "Dr. Ananya (Certified Guide)" : "Pooja (Community Advisor)",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false
      };

      setMessages(prev => ({
        ...prev,
        [selectedGroup.id]: [...(prev[selectedGroup.id] || []), replyMsg]
      }));
    }, 1800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left font-sans">
      
      {/* Header */}
      <div className="bg-white border border-[#ECE8F5] rounded-[20px] p-6 md:p-8 space-y-2 shadow-xs">
        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#6D5BD0] bg-[#B6A8F8]/15 px-3 py-1 rounded-full border border-[#B6A8F8]/30">
          💬 Safe Anonymous Peer & Specialist Forum
        </span>
        <h2 className="font-outfit text-2xl sm:text-3xl font-black text-[#2D2A4A]">CareCircle Peer & Specialist Community</h2>
        <p className="text-xs sm:text-sm text-[#5F6473] leading-relaxed">
          Anonymous chat rooms for peer discussions on PCOD, maternity care, and mental wellness.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Forums List */}
        <div className="bg-white rounded-[18px] border border-[#ECE8F5] p-5 shadow-xs space-y-4 h-fit">
          <h3 className="font-outfit text-sm font-extrabold text-[#2D2A4A] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#6D5BD0]" />
            <span>Support Forums</span>
          </h3>

          <div className="space-y-2">
            {supportGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                  selectedGroup.id === group.id 
                    ? 'bg-[#B6A8F8]/20 border-[#6D5BD0] text-[#2D2A4A] shadow-xs' 
                    : 'border-[#ECE8F5] text-[#5F6473] hover:bg-[#F5F3FA] hover:text-[#2D2A4A]'
                }`}
              >
                <span>{group.name}</span>
                <span className="text-[10px] text-[#8A8FA3] font-medium">{group.members} active</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 p-3 bg-[#F5F3FA] text-[#2D2A4A] rounded-xl border border-[#ECE8F5] text-[11px] items-start">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-[#6D5BD0] mt-0.5" />
            <p>All conversations are fully encrypted & anonymous. Treat every member with empathy and respect.</p>
          </div>
        </div>

        {/* Chat Box */}
        <div className="lg:col-span-2 bg-white rounded-[18px] border border-[#ECE8F5] shadow-xs h-[480px] flex flex-col justify-between overflow-hidden">
          
          {/* Forum Header */}
          <div className="bg-[#FAF8FC] border-b border-[#ECE8F5] px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-4.5 h-4.5 text-[#6D5BD0]" />
              <h4 className="font-bold text-[#2D2A4A] text-xs sm:text-sm">{selectedGroup.name}</h4>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B826E] animate-pulse" title="Live Community Online"></span>
          </div>

          {/* Messages Feed */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {(messages[selectedGroup.id] || []).map(msg => (
              <div 
                key={msg.id}
                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] font-bold text-[#8A8FA3] mb-1">
                  {msg.sender} • {msg.time}
                </span>
                <div 
                  className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-normal leading-relaxed ${
                    msg.isMe 
                      ? 'bg-[#6D5BD0] text-white rounded-br-none shadow-xs' 
                      : 'bg-[#F5F3FA] border border-[#ECE8F5] text-[#2D2A4A] rounded-bl-none shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#6D5BD0] animate-pulse">
                <Bot className="w-4 h-4 text-[#6D5BD0]" />
                <span>Specialist Advisor is typing a response...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form onSubmit={sendMessage} className="p-4 border-t border-[#ECE8F5] bg-[#FAF8FC] flex gap-3">
            <input 
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder={`Share your thoughts or ask a question in ${selectedGroup.name}...`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#ECE8F5] text-xs bg-white text-[#2D2A4A] focus:outline-none focus:border-[#6D5BD0] font-normal"
            />
            <button 
              type="submit"
              className="px-4 py-2.5 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}

export default CareCircle;
