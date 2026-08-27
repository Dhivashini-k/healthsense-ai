import React, { useState } from 'react';
import { Search, UserPlus, Trash2, Eye } from 'lucide-react';
import { C } from '../../utils/constants';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';
import { EmptyState } from '../Common/EmptyState';
import { AddPatientForm } from './AddPatientForm';
import { fmtDate } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';

export function PatientsView({ db, persist, showToast }) {
  const { openPatientDetail } = useApp();
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState("");
  const filtered = db.patients.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this patient?")) {
      const newPatients = db.patients.filter(p => p.id !== id);
      await persist({ ...db, patients: newPatients });
      showToast("Patient removed successfully");
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold text-brand-text">Patients</h1>
        <Button onClick={() => setModal("add")}><UserPlus size={16} /> Add New Patient</Button>
      </div>
      <Card className="p-5">
        <div className="relative mb-4 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patients..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-brand-border text-sm outline-none bg-transparent focus:ring-1 focus:ring-brand-green" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-brand-faint">
              <th className="pb-2">Name</th><th className="pb-2">Age</th><th className="pb-2">Gender</th><th className="pb-2">Phone</th><th className="pb-2">Registered</th><th className="pb-2 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-brand-border hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 font-semibold text-brand-text">{p.name}</td>
                  <td className="py-2.5 text-xs text-brand-muted">{p.age}</td>
                  <td className="py-2.5 text-xs text-brand-muted">{p.gender}</td>
                  <td className="py-2.5 text-xs text-brand-muted">{p.phone}</td>
                  <td className="py-2.5 text-xs text-brand-faint">{fmtDate(p.createdAt)}</td>
                  <td className="py-2.5 text-right text-xs">
                    <button onClick={() => openPatientDetail(p)} className="text-brand-primary hover:bg-emerald-50 p-1.5 rounded-lg transition-colors mr-1" title="View Patient Info">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Remove Patient">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState text="No patients found" />}
        </div>
      </Card>
      {modal === "add" && (
        <Modal title="Register New Patient" onClose={() => setModal(null)}>
          <AddPatientForm onSave={async (p) => { await persist({ ...db, patients: [...db.patients, p] }); setModal(null); showToast("Patient registered"); }} />
        </Modal>
      )}
    </div>
  );
}
