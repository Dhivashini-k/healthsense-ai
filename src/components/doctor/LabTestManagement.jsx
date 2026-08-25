import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { MOCK_LAB_TEST_ORDERS } from "../../data/mockData";
import { FlaskConical, CheckCircle2, Clock, Plus, Search, Filter, AlertCircle } from "lucide-react";

export default function LabTestManagement() {
  const { patients } = useApp();
  const [labOrders, setLabOrders] = useState(MOCK_LAB_TEST_ORDERS);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [newOrder, setNewOrder] = useState({
    patientId: "PT-1256",
    diseaseType: "Diabetes",
    testName: "HbA1c & Fasting Blood Sugar",
    doctorName: "Dr. Arjun Mehta (Endocrinologist)"
  });

  const filteredOrders = labOrders.filter((order) => {
    const matchesStatus = filterStatus === "All" || order.status === filterStatus;
    const matchesSearch =
      order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateOrder = (e) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === newOrder.patientId || p.patient_id === newOrder.patientId);
    const orderObj = {
      id: `LAB-${Math.floor(800 + Math.random() * 100)}`,
      patientId: newOrder.patientId,
      patientName: patient ? patient.name : "Ramesh Verma",
      diseaseType: newOrder.diseaseType,
      testName: newOrder.testName,
      doctorName: newOrder.doctorName,
      orderDate: new Date().toISOString().split("T")[0],
      status: "Ordered",
      resultSummary: "Requisition sent to hospital diagnostic lab"
    };

    setLabOrders([orderObj, ...labOrders]);
    setShowOrderModal(false);
  };

  const handleUpdateStatus = (id, newStatus) => {
    setLabOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: newStatus, resultSummary: newStatus === "Completed" ? "Diagnostic results uploaded to EHR" : "Lab processing in progress" } : o
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-emerald-600" /> Specialist Lab Test Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Order confirmatory diagnostic laboratory tests and track status across Ordered, Pending, and Completed stages.
          </p>
        </div>

        <button
          onClick={() => setShowOrderModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Order Diagnostic Lab Test
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search test name, patient ID, or disease..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          {["All", "Ordered", "Pending", "Completed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filterStatus === st ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Lab Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Test ID</th>
                <th className="py-3.5 px-5">Patient Name & ID</th>
                <th className="py-3.5 px-5">Target Disease</th>
                <th className="py-3.5 px-5">Ordered Lab Test</th>
                <th className="py-3.5 px-5">Ordering Specialist</th>
                <th className="py-3.5 px-5">Order Date</th>
                <th className="py-3.5 px-5 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{order.id}</td>
                  <td className="py-3.5 px-5">
                    <p className="font-bold text-slate-900">{order.patientName}</p>
                    <p className="text-[10px] font-mono text-slate-400">{order.patientId}</p>
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-slate-800">{order.diseaseType}</td>
                  <td className="py-3.5 px-5 font-bold text-emerald-800 bg-emerald-50/50 rounded-lg py-1 px-2.5 w-fit">
                    {order.testName}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600">{order.doctorName}</td>
                  <td className="py-3.5 px-5 text-slate-500">{order.orderDate}</td>
                  <td className="py-3.5 px-5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === "Completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.status === "Pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.status === "Completed" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-600" />
                      )}
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {order.status !== "Completed" ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "Completed")}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition shadow-2xs"
                      >
                        Mark Completed
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold">Results Logged</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-fadeIn space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Order Diagnostic Lab Test</h3>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select High-Risk Patient</label>
                <select
                  value={newOrder.patientId}
                  onChange={(e) => setNewOrder({ ...newOrder, patientId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}) - {p.primaryRisk} ({p.overallRiskScore}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Disease Category</label>
                <select
                  value={newOrder.diseaseType}
                  onChange={(e) => setNewOrder({ ...newOrder, diseaseType: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Diabetes">Diabetes Mellitus (Endocrinology)</option>
                  <option value="Heart Disease">Heart Disease (Cardiology)</option>
                  <option value="Stroke">Stroke / Cerebrovascular (Neurology)</option>
                  <option value="CKD">Chronic Kidney Disease (Nephrology)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Diagnostic Test Requisition</label>
                <select
                  value={newOrder.testName}
                  onChange={(e) => setNewOrder({ ...newOrder, testName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="HbA1c & Fasting Blood Sugar">HbA1c & Fasting Blood Sugar</option>
                  <option value="12-Lead ECG & Lipid Profile">12-Lead ECG & Lipid Profile</option>
                  <option value="Serum Creatinine & Urine Albumin">Serum Creatinine & Urine Albumin</option>
                  <option value="Carotid Doppler US & Brain CT">Carotid Doppler US & Brain CT</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-2xs"
                >
                  Confirm Lab Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
