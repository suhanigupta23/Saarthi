import React, { useState } from 'react';
import { MessageCircle, Send, Users, ShieldAlert } from 'lucide-react';

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

  const sendMessage = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    if (!inputMsg.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "You (Anonymous)",
      text: inputMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setMessages({
      ...messages,
      [selectedGroup.id]: [...(messages[selectedGroup.id] || []), newMsg]
    });
    setInputMsg('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="font-outfit text-3xl font-black text-warm-850">CareCircle Peer Support</h2>
        <p className="text-sm text-warm-500 mt-1">Anonymous chat rooms for peer discussions on PCOD, maternity, and mental wellness.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Forums List */}
        <div className="bg-white rounded-2xl border border-warm-200 p-5 shadow-sm space-y-4 h-fit">
          <h3 className="font-outfit text-lg font-bold text-warm-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <span>Support Forums</span>
          </h3>

          <div className="space-y-2">
            {supportGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all ${
                  selectedGroup.id === group.id 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-sm' 
                    : 'border-warm-200 text-warm-700 hover:bg-warm-100/50'
                }`}
              >
                <span>{group.name}</span>
                <span className="text-xs text-warm-400 font-bold">{group.members} users</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2.5 p-3 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-200 text-xs items-start">
            <ShieldAlert className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
            <p>All conversations are fully anonymous. Please treat everyone with respect.</p>
          </div>
        </div>

        {/* Chat box */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-warm-200 shadow-sm h-[450px] flex flex-col justify-between overflow-hidden">
          
          {/* Forum Header */}
          <div className="bg-warm-50 border-b border-warm-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-warm-800 text-sm">{selectedGroup.name}</h4>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {(messages[selectedGroup.id] || []).map(msg => (
              <div 
                key={msg.id} 
                className={`max-w-xs p-3.5 rounded-2xl text-xs space-y-1 ${
                  msg.isMe 
                    ? 'bg-indigo-600 text-white ml-auto rounded-tr-none' 
                    : 'bg-warm-50 border border-warm-200 text-warm-700 mr-auto rounded-tl-none'
                }`}
              >
                <div className="flex justify-between items-center gap-4 border-b border-white/10 pb-1 mb-1 font-bold">
                  <span>{msg.sender}</span>
                  <span className="opacity-75">{msg.time}</span>
                </div>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Input form */}
          <form onSubmit={sendMessage} className="p-4 bg-warm-50 border-t border-warm-200 flex gap-2">
            <input 
              type="text" 
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Post anonymously to room..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white text-warm-700"
            />
            <button 
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}

export default CareCircle;
