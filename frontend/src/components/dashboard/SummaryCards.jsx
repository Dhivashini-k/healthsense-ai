import React from "react";
import { Users, AlertTriangle, ClipboardList, UserCheck, FlaskConical, ChevronRight } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function SummaryCards() {
  const { userRole, setActiveTab, dashboardStats } = useApp();
  const isNurse = userRole === "nurse";

  const nurseCards = [
    {
      title: "Total Patients",
      count: dashboardStats.totalPatients.count,
      subtext: dashboardStats.totalPatients.growth,
      subtextColor: "text-emerald-600",
      icon: Users,
      iconBg: "bg-emerald-100 text-emerald-700",
      tabTarget: "patients"
    },
    {
      title: "Today's Screenings",
      count: dashboardStats.todaysScreenings.count,
      subtext: dashboardStats.todaysScreenings.growth,
      subtextColor: "text-blue-600",
      icon: ClipboardList,
      iconBg: "bg-blue-100 text-blue-600",
      tabTarget: "screening"
    },
    {
      title: "High Risk Cases",
      count: dashboardStats.highRiskCases.count,
      subtext: dashboardStats.highRiskCases.growth,
      subtextColor: "text-rose-600",
      icon: AlertTriangle,
      iconBg: "bg-rose-100 text-rose-600",
      tabTarget: "doctor-review"
    },
    {
      title: "Pending Follow-Ups",
      count: dashboardStats.pendingFollowups.count,
      subtext: dashboardStats.pendingFollowups.growth,
      subtextColor: "text-purple-600",
      icon: UserCheck,
      iconBg: "bg-purple-100 text-purple-600"
    }
  ];

  const doctorCards = [
    {
      title: "High Risk Patients",
      count: dashboardStats.highRiskCases.count,
      subtext: "Escalated for Specialist Care",
      subtextColor: "text-rose-600",
      icon: AlertTriangle,
      iconBg: "bg-rose-100 text-rose-600",
      tabTarget: "doctor-review"
    },
    {
      title: "New Referrals Today",
      count: "14",
      subtext: "Assigned by Nurse Screening",
      subtextColor: "text-emerald-600",
      icon: Users,
      iconBg: "bg-emerald-100 text-emerald-700"
    },
    {
      title: "Pending Reviews",
      count: "18",
      subtext: "Awaiting diagnostic sign-off",
      subtextColor: "text-amber-600",
      icon: ClipboardList,
      iconBg: "bg-amber-100 text-amber-600"
    },
    {
      title: "Scheduled Lab Tests",
      count: "32",
      subtext: "12 Pending Lab Analysis",
      subtextColor: "text-blue-600",
      icon: FlaskConical,
      iconBg: "bg-blue-100 text-blue-600",
      isAction: true,
      tabTarget: "lab-tests"
    }
  ];

  const cards = isNurse ? nurseCards : doctorCards;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition"
          >
            <div className={`p-3.5 rounded-2xl ${card.iconBg} shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>

            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-500 block">{card.title}</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight block mt-0.5">{card.count}</span>
              
              {card.isAction ? (
                <button
                  onClick={() => setActiveTab(card.tabTarget || "appointments")}
                  className={`text-[11px] font-bold mt-1 flex items-center gap-0.5 ${card.subtextColor}`}
                >
                  {card.subtext} <ChevronRight className="w-3 h-3" />
                </button>
              ) : (
                <span className={`text-[11px] font-bold mt-1 block ${card.subtextColor}`}>
                  {card.subtext}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
