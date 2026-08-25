import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { C } from '../../utils/constants';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';
import { EmptyState } from '../Common/EmptyState';
import { AddPatientForm } from './AddPatientForm';
import { fmtDate } from '../../utils/helpers';

export function PatientsView({ db, persist, showToast }) {
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState("");
  const filtered = db.patients.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>Patients</h1>
        <Button onClick={() => setModal("add")}><UserPlus size={16} /> Add New Patient</Button>
      </div>
      <Card className="p-5">
        <div className="relative mb-4 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patients..." className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm" style={{ borderColor: C.border }} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left" style={{ color: C.textFaint }}>
              <th className="pb-2">Name</th><th className="pb-2">Age</th><th className="pb-2">Gender</th><th className="pb-2">Phone</th><th className="pb-2">Registered</th>
            </tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: C.border }}>
                  <td className="py-2.5 font-semibold" style={{ color: C.text }}>{p.name}</td>
                  <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{p.age}</td>
                  <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{p.gender}</td>
                  <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{p.phone}</td>
                  <td className="py-2.5 text-xs" style={{ color: C.textFaint }}>{fmtDate(p.createdAt)}</td>
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
