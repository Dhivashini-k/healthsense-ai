import React, { useState } from "react";
import { X, Send, Bot } from "lucide-react";
import { chatbotAPI } from "../../services/api";

export default function HealthHeroChatbot() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "Health Hero AI",
      text: "Hello! I am Health Hero AI Assistant. How can I help you today with NCD screening, risk analysis, or patient recommendations?",
      isAi: true
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    const userMsg = { id: Date.now(), sender: "You", text: userText, isAi: false };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await chatbotAPI.sendMessage(userText);
      const reply = res.data.response || "Thank you for reaching out to Health Hero AI. Regular screening and vital tracking are essential for preventive care.";
      const aiMsg = { id: Date.now() + 1, sender: "Health Hero AI", text: reply, isAi: true };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackMsg = {
        id: Date.now() + 1,
        sender: "Health Hero AI",
        text: "Based on our hospital screening protocols, early Non-Communicable Disease identification enables timely intervention and personalized lifestyle modifications.",
        isAi: true
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-[#064E3B] text-white p-3.5 rounded-full shadow-2xl hover:scale-105 transition flex items-center gap-2 border border-emerald-400/30"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500 text-[#064E3B] flex items-center justify-center font-bold">
          🤖
        </div>
        <span className="text-xs font-bold pr-2">Health Hero AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-[#044E3A] text-white rounded-2xl shadow-2xl border border-emerald-500/40 overflow-hidden flex flex-col h-96 animate-fadeIn">
      {/* Header */}
      <div className="p-3 bg-[#033B2C] border-b border-emerald-600/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-[#033B2C] flex items-center justify-center text-lg font-bold">
            🤖
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white leading-tight">Health Hero AI Assistant</h4>
            <p className="text-[10px] text-emerald-300">How can I help you today?</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-emerald-200 hover:text-white rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-[#044E3A]/90 text-xs">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isAi ? "items-start" : "items-end"}`}>
            <div
              className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                msg.isAi
                  ? "bg-[#0B5E47] text-white border border-emerald-400/20 rounded-tl-none"
                  : "bg-emerald-500 text-[#033B2C] font-bold rounded-tr-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col items-start">
            <div className="p-3 rounded-2xl bg-[#0B5E47] text-emerald-300 text-xs italic animate-pulse">
              Health Hero AI is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-2.5 bg-[#033B2C] border-t border-emerald-600/30 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="flex-1 px-3.5 py-2 text-xs bg-[#065E47] border border-emerald-500/40 text-white placeholder-emerald-200/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="p-2 bg-emerald-500 hover:bg-emerald-400 text-[#033B2C] font-bold rounded-xl transition shadow-xs disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
