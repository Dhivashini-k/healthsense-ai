import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Calendar, Clock, User, Plus, CheckCircle2, Stethoscope } from "lucide-react";

export default function AppointmentsView() {
  const { appointments, scheduleAppointment, patients } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [newApt, setNewApt] = useState({
    patientName: "Eleanor Vance",
    patientId: "PAT-10892",
    doctorName: "Dr. Sarah Jenkins",
    department: "Cardiology & Diabetes Clinic",
    date: "2026-08-05",
    time: "09:30 AM",
    type: "Screening Consultation"
  });

  const handleBook = (e) => {
    e.preventDefault();
    scheduleAppointment(newApt);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" /> Specialist Consultations & Follow-Ups
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage hospital appointments, doctor follow-up schedules, and screening reviews.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      {/* Appointment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.map((apt) => (
          <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400">{apt.id}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {apt.status}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">{apt.patientName}</h3>
              <p className="text-xs text-slate-500">{apt.type}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">{apt.doctorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{apt.date} at {apt.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-fadeIn space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Schedule Specialist Appointment</h3>
            
            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Patient</label>
                <select
                  value={newApt.patientName}
                  onChange={(e) => {
                    const p = patients.find((pat) => pat.name === e.target.value);
                    setNewApt({ ...newApt, patientName: e.target.value, patientId: p?.id || "PAT-100" });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.name}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consulting Physician</label>
                <input
                  type="text"
                  value={newApt.doctorName}
                  onChange={(e) => setNewApt({ ...newApt, doctorName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newApt.date}
                    onChange={(e) => setNewApt({ ...newApt, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={newApt.time}
                    onChange={(e) => setNewApt({ ...newApt, time: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
