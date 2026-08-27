import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { C } from '../../utils/constants';

const HealthHeroMascot = ({ className, size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ animation: 'floating 3s ease-in-out infinite' }}
  >
    <style>
      {`
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
      `}
    </style>
    <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.15"/>
    <circle cx="50" cy="50" r="32" fill="currentColor"/>
    <circle cx="38" cy="44" r="4" fill="white"/>
    <circle cx="62" cy="44" r="4" fill="white"/>
    <path d="M 42 58 Q 50 66 58 58" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
  </svg>
);

export function Chatbot({ open, setOpen, role }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm **Health Hero**, your AI clinical assistant. I can help answer questions about health conditions, diet, exercise, or explain risk factors in plain language.\n\nHow can I support you today?",
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const endRef = useRef(null);

  const API = 'http://127.0.0.1:8000';

  useEffect(() => {
    // Health Check for RAG backend API
    const checkApi = async () => {
      try {
        const res = await fetch(`${API}/health`);
        if (res.ok) setBackendOnline(true);
        else setBackendOnline(false);
      } catch (e) {
        setBackendOnline(false);
      }
    };
    checkApi();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  const RAG_KNOWLEDGE_BASE = {
    diet: [
      { condition: "HYPERTENSION", title: "DASH Low Sodium Protocol", text: "Restrict daily sodium intake to under 1,500mg. Increase potassium-rich foods like bananas, spinach, and sweet potatoes to balance arterial vascular tension." },
      { condition: "DIABETES", title: "Low GI Fiber Protocol", text: "Focus on low glycemic index foods like oats, brown rice, and lentils. Aim for 30-35g fiber daily to stabilize postprandial glucose levels." },
      { condition: "CVD", title: "Mediterranean Heart Diet", text: "Incorporate extra virgin olive oil, walnuts, and omega-3 rich fatty fish. Trans-fats must be strictly zero to reduce LDL cholesterol plaque buildup." }
    ],
    exercise: [
      { condition: "CVD", title: "Aerobic Conditioning Plan", text: "Perform 150 minutes per week of moderate-intensity brisk walking or cycling. Monitor resting heart rate and avoid sudden explosive isometric heavy lifting." },
      { condition: "HYPERTENSION", title: "Dynamic Cardio Workout", text: "30-45 minutes daily of continuous aerobic walking or swimming helps relax peripheral vascular walls and lower systolic pressure by 5-8 mmHg." }
    ],
    risk: [
      { condition: "STROKE", title: "Arterial Pressure & Retinal Indicators", text: "Elevated systolic BP above 140 mmHg combined with retinal hypertensive changes significantly increases cerebral vascular stroke risk. Immediate pressure management required." },
      { condition: "CKD", title: "Renal Function & Protein Care", text: "Long-standing unmanaged diabetes and high blood pressure strain kidney nephrons. Protein intake should be moderated to 0.6-0.8g/kg/day under specialist supervision." }
    ]
  };

  const detectIntent = (query) => {
    const q = query.toLowerCase();
    if (/eat|food|diet|meal|sodium|nutrition|snack/i.test(q)) return 'diet';
    if (/exercise|walk|run|gym|active|sport/i.test(q)) return 'exercise';
    return 'risk';
  };

  const sendQuestion = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    const intent = detectIntent(query);
    const retrieved = RAG_KNOWLEDGE_BASE[intent] || RAG_KNOWLEDGE_BASE.diet;

    try {
      if (backendOnline) {
        const ragRes = await fetch(`${API}/assistant/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: role || 'Nurse',
            messages: [{ role: 'user', text: query }],
            system_context: retrieved.map(c => `[${c.condition}] ${c.title}: ${c.text}`).join('\n\n')
          })
        });

        if (ragRes.ok) {
          const data = await ragRes.json();
          setMessages((prev) => [...prev, {
            role: "assistant",
            text: data.text || data.response || "Here is the guidance based on clinical guidelines.",
          }]);
          setLoading(false);
          return;
        }
      }

      setTimeout(() => {
        let reply = "";
        if (intent === 'diet') {
          reply = "For now, choose more vegetables, pulses, whole grains, and unsalted foods. Cut back on packaged snacks and sugary drinks. Your clinician can tailor this to your readings and medications.";
        } else if (intent === 'exercise') {
          reply = "A comfortable walk is a good starting point. Build toward regular moderate activity, and stop if you feel chest pain, severe breathlessness, dizziness, or unusual weakness. Check with the care team before strenuous exercise.";
        } else {
          reply = "A screening result is an early signal, not a diagnosis. Recheck unusual measurements carefully and discuss anything flagged with the appropriate clinician, especially if symptoms are new or severe.";
        }

        setMessages((prev) => [...prev, {
          role: "assistant",
          text: reply,
        }]);
        setLoading(false);
      }, 800);

    } catch (e) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        text: "I'm having trouble connecting to my medical database. You can still ask me about general diet, blood pressure, exercise, or risk profiles.",
      }]);
      setLoading(false);
    }
  };

  const formatText = (txt) => {
    return txt
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n• /g, '<br/>• ')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-40 transition-transform hover:scale-105 bg-brand-primary"
      >
        {open ? <X size={22} className="text-white" /> : <HealthHeroMascot size={28} className="text-white" />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 w-[92vw] max-w-[440px] h-[560px] rounded-3xl shadow-2xl flex flex-col z-40 overflow-hidden border border-brand-border bg-brand-card"
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between bg-brand-primary-deep">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-400/20 flex items-center justify-center">
                <HealthHeroMascot size={22} className="text-emerald-200" />
              </div>
              <div>
                <div className="text-white font-extrabold text-sm leading-tight flex items-center gap-1.5">
                  Health Hero <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-bold border border-emerald-300/30">AI Assistant</span>
                </div>
                <div className="text-[11px] text-emerald-100/70 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400' : 'bg-emerald-400'}`} />
                  {backendOnline ? 'Connected' : 'Ready'}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[88%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-emerald-700 text-white rounded-br-none shadow-sm"
                      : "bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm"
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatText(m.text) }}
                />
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 w-fit text-xs text-slate-500">
                <Loader2 size={14} className="animate-spin text-emerald-600" /> Health Hero is typing...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick Suggestion Pills */}
          <div className="px-3 py-2 bg-white border-t border-brand-border flex gap-1.5 overflow-x-auto no-scrollbar">
            <button onClick={() => sendQuestion("What should I eat for high blood pressure?")} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap hover:bg-emerald-100">
              🥗 What should I eat?
            </button>
            <button onClick={() => sendQuestion("How can I manage blood pressure?")} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap hover:bg-emerald-100">
              ❤️ Manage blood pressure
            </button>
            <button onClick={() => sendQuestion("What exercises are safe for me?")} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap hover:bg-emerald-100">
              🏃 Safe exercises
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-brand-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendQuestion()}
              placeholder="Ask Health Hero about diet, exercise, BP..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-brand-border text-xs outline-none focus:border-emerald-600 bg-slate-50"
            />
            <button
              onClick={() => sendQuestion()}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 transition-colors"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
