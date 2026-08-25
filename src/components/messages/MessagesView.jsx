import React, { useState } from "react";
import { MessageSquare, Send, User, CheckCheck } from "lucide-react";

export default function MessagesView() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "Dr. Sarah Jenkins", text: "Eleanor's HbA1c screening is flagged at 68%. I've requested a fasting blood glucose repeat test.", time: "10:14 AM", isMe: false },
    { id: 2, sender: "You", text: "Understood. The lab requisition order has been sent to the outpatient diagnostics department.", time: "10:16 AM", isMe: true },
    { id: 3, sender: "Dr. Robert Chen", text: "Marcus Holloway's carotid Doppler ultrasound is scheduled for tomorrow at 2:00 PM.", time: "11:05 AM", isMe: false }
  ]);

  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "You", text: input, time: "Just now", isMe: true }
    ]);
    setInput("");
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs h-[75vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Hospital Multidisciplinary Team Chat</h3>
            <p className="text-[11px] text-slate-500">Secure HIPAA-compliant clinical messaging</p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-full">
          Active Encryption Node
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
          >
            <span className="text-[10px] font-bold text-slate-400 mb-0.5 px-1">{msg.sender}</span>
            <div
              className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.isMe
                  ? "bg-emerald-600 text-white rounded-br-none shadow-xs"
                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs"
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
              {msg.time} {msg.isMe && <CheckCheck className="w-3 h-3 text-emerald-600" />}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message to clinical team..."
          className="flex-1 px-4 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30"
        />
        <button
          type="submit"
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
