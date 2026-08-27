import React, { useState } from 'react';
import { FlaskConical, Download, FileText, CheckCircle2, Clock, Search, Filter } from 'lucide-react';
import { C, ROLE_DISEASES } from '../../utils/constants';
import { Card } from '../Common/Card';
import { Modal } from '../Common/Modal';
import { EmptyState } from '../Common/EmptyState';
import { StatusBadge } from '../Common/StatusBadge';
import { Button } from '../Common/Button';
import { fmtDate, printPDFReport } from '../../utils/helpers';

export function LabTestsView({ db, scopeRole, persist, showToast }) {
  const [view, setView] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Determine lab test orders for nurse vs specialist doctors
  const isNurse = !scopeRole || scopeRole === "Nurse" || scopeRole === "Super Admin";
  
  const labOrders = db.referrals.filter((r) => {
    const hasTests = r.labTests && r.labTests.length > 0;
    const matchesRole = isNurse || (ROLE_DISEASES[scopeRole] && ROLE_DISEASES[scopeRole].includes(r.disease));
    return hasTests && matchesRole;
  });

  const patientName = (id) => db.patients.find((p) => p.id === id)?.name || "Unknown Patient";
  const getPatient = (id) => db.patients.find((p) => p.id === id);

  const filteredOrders = labOrders.filter((r) => {
    const name = patientName(r.patientId).toLowerCase();
    const disease = r.disease.toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = name.includes(q) || disease.includes(q);
    const matchesStatus = filterStatus === "All" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const downloadRequisitionSlip = (order) => {
    const patient = getPatient(order.patientId);
    const screening = db.screenings.find((s) => s.id === order.screeningId);

    const html = `
      <div class="section">
        <div class="section-title">Clinical Diagnostic Lab Requisition Slip</div>
        <p style="font-size:13px; margin:3px 0;"><b>Requisition ID:</b> LAB-${order.id.toUpperCase()}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Ordering Doctor / Department:</b> ${order.specialistRole}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Disease Evaluation:</b> ${order.disease} (${order.riskPercent}% Risk Score)</p>
        <p style="font-size:13px; margin:3px 0;"><b>Order Date:</b> ${order.signedAt ? fmtDate(order.signedAt) : fmtDate(order.createdAt)}</p>
      </div>

      <div class="section">
        <div class="section-title">Patient Information</div>
        <p style="font-size:13px; margin:3px 0;"><b>Name:</b> ${patient?.name}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Age / Gender:</b> ${patient?.age} yrs / ${patient?.gender}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Contact:</b> ${patient?.phone} | <b>Address:</b> ${patient?.address}</p>
      </div>

      <div class="section" style="background-color: #F2F9F6; border-color: #0E7C5A;">
        <div class="section-title" style="color: #0E7C5A;">Required Diagnostic Tests</div>
        <ul style="font-size:14px; font-weight:bold; color:#122420;">
          ${order.labTests.map(t => `<li style="margin-bottom:8px;">${t}</li>`).join('')}
        </ul>
      </div>

      <div class="section">
        <div class="section-title">Nurse & Clinical Vitals Summary</div>
        <p style="font-size:13px; margin:3px 0;"><b>BP:</b> ${screening?.vitals.systolic}/${screening?.vitals.diastolic} mmHg | <b>BMI:</b> ${screening?.vitals.bmi}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Clinical Notes:</b> ${screening?.notes || 'None'}</p>
      </div>
    `;

    printPDFReport(`Lab_Requisition_${patient?.name}_${order.disease}`, html);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-brand-text">
            <FlaskConical className="text-brand-green" size={24} /> Clinical Lab Test Orders
          </h1>
          <p className="text-xs mt-0.5 text-brand-faint">
            {isNurse ? "All diagnostic lab tests requested by specialists" : `Lab orders for ${scopeRole} referrals`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Total Orders: <b>{labOrders.length}</b></span>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name or disease..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-brand-border outline-none bg-transparent focus:ring-1 focus:ring-brand-green"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={15} className="text-brand-faint" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-brand-border text-sm outline-none bg-transparent focus:ring-1 focus:ring-brand-green"
            >
              <option value="All">All Statuses</option>
              <option value="Signed">Signed Off</option>
              <option value="Viewed">Viewed</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-brand-faint">
                <th className="pb-3 font-semibold">Patient Name</th>
                <th className="pb-3 font-semibold">Disease</th>
                <th className="pb-3 font-semibold">Ordered Diagnostic Tests</th>
                <th className="pb-3 font-semibold">Specialist</th>
                <th className="pb-3 font-semibold">Order Date</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((r) => {
                const patient = getPatient(r.patientId);
                return (
                  <tr key={r.id} className="border-t border-brand-border hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-semibold text-brand-text">
                      <div>{patient?.name || "Unknown"}</div>
                      <div className="text-xs font-normal text-brand-muted">{patient?.age}y · {patient?.gender}</div>
                    </td>
                    <td className="py-3 text-xs font-medium text-brand-muted">{r.disease}</td>
                    <td className="py-3 text-xs font-semibold">
                      <div className="flex flex-wrap gap-1">
                        {r.labTests.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-xs text-brand-muted">{r.specialistRole}</td>
                    <td className="py-3 text-xs text-brand-faint">{fmtDate(r.signedAt || r.createdAt)}</td>
                    <td className="py-3"><StatusBadge status={r.status} /></td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setView(r)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => downloadRequisitionSlip(r)}
                          className="p-1 rounded-lg border border-brand-border hover:bg-slate-100 text-slate-600"
                          title="Download Requisition Slip"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 && <EmptyState text="No matching lab test orders found" />}
        </div>
      </Card>

      {view && (
        <Modal title={`Lab Test Requisition — ${patientName(view.patientId)}`} onClose={() => setView(null)} wide>
          {(() => {
            const p = getPatient(view.patientId);
            const s = db.screenings.find((x) => x.id === view.screeningId);
            return (
              <div className="space-y-4 text-sm text-brand-text">
                <div className="p-3 rounded-xl bg-slate-50 border border-brand-border flex justify-between items-center">
                  <div>
                    <div className="font-bold text-base">{p?.name}</div>
                    <div className="text-xs text-slate-500">{p?.age} yrs · {p?.gender} · {p?.phone}</div>
                  </div>
                  <StatusBadge status={view.status} />
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <div className="text-xs font-bold uppercase tracking-wide mb-2 text-emerald-800 flex items-center gap-1.5">
                    <FlaskConical size={16} /> Prescribed Diagnostic Tests
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {view.labTests.map((t, i) => (
                      <div key={i} className="p-2.5 bg-white rounded-lg border border-emerald-200 font-semibold text-emerald-900 text-xs flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> {t}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-700 mb-1">Ordering Specialist</div>
                    <div><b>Role:</b> {view.specialistRole}</div>
                    <div><b>Target Disease:</b> {view.disease} ({view.riskPercent}% Risk)</div>
                    <div><b>Order Date:</b> {fmtDate(view.signedAt || view.createdAt)}</div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-700 mb-1">Nurse Vitals & Notes</div>
                    <div><b>BP:</b> {s?.vitals.systolic}/{s?.vitals.diastolic} mmHg | <b>BMI:</b> {s?.vitals.bmi}</div>
                    <div><b>Nurse Notes:</b> {s?.notes || "None"}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
                  <Button variant="outline" onClick={() => setView(null)}>Close</Button>
                  <Button onClick={() => downloadRequisitionSlip(view)}>
                    <Download size={15} /> Print / Download Requisition Slip
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
