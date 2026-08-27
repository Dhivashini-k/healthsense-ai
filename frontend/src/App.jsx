import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { C, ROLE_DISEASES, SPECIALIST_MAP } from './utils/constants';
import { seedDB } from './utils/seedData';
import { storage } from './utils/storage';
import { Sidebar } from './components/Layout/Sidebar';
import { TopBar } from './components/Layout/TopBar';
import { LoginScreen } from './components/Auth/LoginScreen';
import { NurseArea } from './components/Nurse/NurseArea';
import { SpecialistArea } from './components/Specialist/SpecialistArea';
import { AdminArea } from './components/Admin/AdminArea';
import { Chatbot } from './components/Chatbot/Chatbot';
import { LandingPage } from './components/Landing/LandingPage';
import { uid, todayStr } from './utils/helpers';

export default function App() {
  const [db, setDb] = useState(null);
  const [session, setSession] = useState(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("healthsense-db", true);
        if (res && res.value) {
          const saved = JSON.parse(res.value);
          if (saved.seedVersion === 2) setDb(saved);
          else {
            const seeded = seedDB();
            setDb(seeded);
            await storage.set("healthsense-db", JSON.stringify(seeded), true);
          }
        } else {
          const seeded = seedDB();
          setDb(seeded);
          await storage.set("healthsense-db", JSON.stringify(seeded), true);
        }
      } catch (e) {
        console.error("Failed to load data:", e);
        setDb(seedDB());
      }
    })();
  }, []);

  // 5-Minute Recurring Emergency Doctor Notification Timer
  useEffect(() => {
    if (!db) return;
    const interval = setInterval(() => {
      const unreadHighRisk = db.referrals.filter(
        (r) => r.riskLevel === "High" && !r.isSeen && r.status !== "Signed"
      );

      if (unreadHighRisk.length > 0) {
        const newNotifs = [...db.notifications];
        let stateChanged = false;

        unreadHighRisk.forEach((ref) => {
          const patient = db.patients.find((p) => p.id === ref.patientId);
          const role = ref.specialistRole || SPECIALIST_MAP[ref.disease];
          newNotifs.push({
            id: uid("nt"),
            role: role,
            message: `THIS IS EMERGENCY: High Risk ${ref.disease} (${ref.riskPercent}%) for ${patient?.name || 'Patient'} requires immediate review! [5-Min Reminder]`,
            createdAt: todayStr(),
            read: false,
            isEmergency: true,
            patientName: patient?.name,
            disease: ref.disease,
            riskScore: ref.riskPercent
          });
          stateChanged = true;
        });

        if (stateChanged) {
          persist({ ...db, notifications: newNotifs });
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [db]);

  const persist = async (next) => {
    setDb(next);
    try {
      await storage.set("healthsense-db", JSON.stringify(next), true);
    } catch (e) {
      console.error("Failed to persist:", e);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  if (!db) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 500, backgroundColor: C.bg }}>
        <Loader2 className="animate-spin" style={{ color: C.primary }} size={28} />
      </div>
    );
  }

  if (!hasEntered) {
    return <LandingPage onEnter={() => setHasEntered(true)} />;
  }

  if (!session) {
    return <LoginScreen onLogin={(role, name) => { setSession({ role, name }); setTab("dashboard"); }} />;
  }

  const renderMainArea = () => {
    if (session.role === "Nurse") {
      return <NurseArea tab={tab} setTab={setTab} db={db} persist={persist} showToast={showToast} />;
    }
    if (session.role === "Super Admin") {
      return <AdminArea tab={tab} db={db} />;
    }
    if (ROLE_DISEASES[session.role]) {
      return <SpecialistArea role={session.role} tab={tab} db={db} persist={persist} showToast={showToast} />;
    }
    return null;
  };

  return (
    <div className="w-full min-h-full flex" style={{ backgroundColor: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: 720 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>
      <Sidebar role={session.role} tab={tab} setTab={setTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar session={session} db={db} onLogout={() => setSession(null)} setTab={setTab} persist={persist} />
        <main className="flex-1 p-6 overflow-y-auto">
          {renderMainArea()}
        </main>
      </div>
      <Chatbot open={chatOpen} setOpen={setChatOpen} role={session.role} />
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${
            toast.type === "emergency" ? "bg-red-600 text-white" : "bg-emerald-900 text-white"
          }`}
        >
          {toast.type === "emergency" ? <AlertTriangle size={18} /> : <CheckCircle2 size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
