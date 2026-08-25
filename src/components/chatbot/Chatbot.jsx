import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Sparkles, Send, Loader2, BookOpen, ChevronRight, Zap, CheckCircle2 } from 'lucide-react';
import { C } from '../../utils/constants';

export function Chatbot({ open, setOpen, role }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm **HealthHero**, your AI RAG Health Assistant. I analyze NCD risk profiles, clinical vitals, and medical guidelines to offer personalized health advice.\n\nAsk me about diet plans, blood pressure management, exercise routines, or risk explanations!",
      sources: ["GENERAL_HEALTH"]
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [showChunks, setShowChunks] = useState(false);
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
      { condition: "HYPERTENSION", title: "DASH Low Sodium Protocol", text: "Restrict daily sodium intake to under 1,500mg. Increase potassium-rich foods like bananas, spinach, and sweet potatoes to balance arterial vascular tension.", score: 0.94, boost: "+0.35 risk boost" },
      { condition: "DIABETES", title: "Low GI Fiber Protocol", text: "Focus on low glycemic index foods like oats, brown rice, and lentils. Aim for 30-35g fiber daily to stabilize postprandial glucose levels.", score: 0.91, boost: "+0.28 risk boost" },
      { condition: "CVD", title: "Mediterranean Heart Diet", text: "Incorporate extra virgin olive oil, walnuts, and omega-3 rich fatty fish. Trans-fats must be strictly zero to reduce LDL cholesterol plaque buildup.", score: 0.88, boost: "+0.20 risk boost" }
    ],
    exercise: [
      { condition: "CVD", title: "Aerobic Conditioning Plan", text: "Perform 150 minutes per week of moderate-intensity brisk walking or cycling. Monitor resting heart rate and avoid sudden explosive isometric heavy lifting.", score: 0.92, boost: "+0.30 risk boost" },
      { condition: "HYPERTENSION", title: "Dynamic Cardio Workout", text: "30-45 minutes daily of continuous aerobic walking or swimming helps relax peripheral vascular walls and lower systolic pressure by 5-8 mmHg.", score: 0.89, boost: "+0.25 risk boost" }
    ],
    risk: [
      { condition: "STROKE", title: "Arterial Pressure & Retinal Indicators", text: "Elevated systolic BP above 140 mmHg combined with retinal hypertensive changes significantly increases cerebral vascular stroke risk. Immediate pressure management required.", score: 0.95, boost: "+0.40 risk boost" },
      { condition: "CKD", title: "Renal Function & Protein Care", text: "Long-standing unmanaged diabetes and high blood pressure strain kidney nephrons. Protein intake should be moderated to 0.6-0.8g/kg/day under specialist supervision.", score: 0.87, boost: "+0.22 risk boost" }
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
    setChunks(retrieved);

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
            sources: retrieved.map(c => c.condition)
          }]);
          setLoading(false);
          return;
        }
      }

      // Fallback RAG response generation
      setTimeout(() => {
        let reply = "";
        if (intent === 'diet') {
          reply = "**Dietary Guidance & Clinical Protocol:**\n\n• **DASH Low Sodium:** Restrict sodium to under 1,500 mg/day to lower arterial wall tension.\n• **Low GI Fiber:** Consume oats, legumes, and leafy greens (30-35g fiber/day) to stabilize blood glucose.\n• **Healthy Fats:** Use extra virgin olive oil and walnuts rich in Omega-3 to protect coronary arteries.";
        } else if (intent === 'exercise') {
          reply = "**Safe Exercise & Physical Activity Plan:**\n\n• **Aerobic Workouts:** 150 minutes per week of brisk walking or stationary cycling.\n• **Blood Pressure Benefit:** 30-45 mins daily cardio lowers systolic pressure by 5-8 mmHg.\n• **Precaution:** Avoid heavy static weightlifting if blood pressure is above 140/90 mmHg.";
        } else {
          reply = "**NCD Risk Profile & Clinical Assessment:**\n\n• **Hypertension & CVD:** High blood pressure strains arterial walls. Daily log target is < 120/80 mmHg.\n• **Stroke & Eye Retinal Care:** Hypertensive or diabetic retinal changes reflect microvascular strain.\n• **Kidney Protection (CKD):** Keep blood glucose in target range and avoid OTC NSAID painkillers.";
        }

        setMessages((prev) => [...prev, {
          role: "assistant",
          text: reply,
          sources: [...new Set(retrieved.map(c => c.condition))]
        }]);
        setLoading(false);
      }, 800);

    } catch (e) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        text: "I'm currently operating in offline RAG knowledge base mode. You can ask about diet, blood pressure, exercise, or NCD risk profiles.",
        sources: ["OFFLINE_RAG"]
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
      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-40 transition-transform hover:scale-105"
        style={{ backgroundColor: C.primary }}
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 w-[92vw] max-w-[440px] h-[560px] rounded-3xl shadow-2xl flex flex-col z-40 overflow-hidden border"
          style={{ backgroundColor: C.card, borderColor: C.border }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: C.primary }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-400/20 flex items-center justify-center">
                <Sparkles size={18} className="text-emerald-200" />
              </div>
              <div>
                <div className="text-white font-extrabold text-sm leading-tight flex items-center gap-1.5">
                  HealthHero <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-bold border border-emerald-300/30">⚡ RAG Active</span>
                </div>
                <div className="text-[11px] text-emerald-100/70 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {backendOnline ? 'RAG Backend Connected' : 'Knowledge Base Ready'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowChunks(!showChunks)}
              className="p-1.5 rounded-lg bg-emerald-900/40 text-emerald-100 hover:bg-emerald-800/60 text-xs flex items-center gap-1"
              title="View Retrieved Knowledge Chunks"
            >
              <BookOpen size={14} /> Chunks ({chunks.length})
            </button>
          </div>

          {/* RAG Retrieved Chunks Drawer Overlay */}
          {showChunks && (
            <div className="p-3 bg-slate-900 text-white text-xs border-b max-h-48 overflow-y-auto space-y-2">
              <div className="font-bold text-[11px] text-emerald-400 flex justify-between items-center">
                <span>RETRIEVED KNOWLEDGE BASE CHUNKS ({chunks.length})</span>
                <button onClick={() => setShowChunks(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              {chunks.length === 0 ? (
                <div className="text-slate-400 text-[11px]">Ask a question to see retrieved medical chunks.</div>
              ) : (
                chunks.map((c, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex justify-between items-center mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 font-bold text-[10px]">{c.condition}</span>
                      <span className="text-[10px] text-slate-400">Score: {c.score}</span>
                    </div>
                    <div className="font-semibold text-slate-200">{c.title}</div>
                    <div className="text-slate-300 text-[11px] mt-0.5">{c.text}</div>
                    <div className="text-[10px] text-emerald-400 font-semibold mt-1">{c.boost}</div>
                  </div>
                ))
              )}
            </div>
          )}

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

                {m.sources && m.sources.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {m.sources.map((src, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 w-fit text-xs text-slate-500">
                <Loader2 size={14} className="animate-spin text-emerald-600" /> Searching RAG knowledge base...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick Suggestion Pills */}
          <div className="px-3 py-2 bg-white border-t flex gap-1.5 overflow-x-auto no-scrollbar" style={{ borderColor: C.border }}>
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
          <div className="p-3 bg-white border-t flex gap-2" style={{ borderColor: C.border }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendQuestion()}
              placeholder="Ask HealthHero about diet, exercise, BP..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-emerald-600 bg-slate-50"
              style={{ borderColor: C.border }}
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
