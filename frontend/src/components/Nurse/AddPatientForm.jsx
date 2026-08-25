import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../Common/Button';
import { Field } from '../Common/Field';
import { uid, todayStr } from '../../utils/helpers';

export function AddPatientForm({ onSave }) {
  const [f, setF] = useState({ name: "", age: "", gender: "Male", phone: "", address: "", medicalHistory: "", previousConditions: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div>
      <Field label="Full Name"><input className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#DEE9E4" }} value={f.name} onChange={set("name")} placeholder="Patient name" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Age"><input type="number" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#DEE9E4" }} value={f.age} onChange={set("age")} /></Field>
        <Field label="Gender">
          <select className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#DEE9E4" }} value={f.gender} onChange={set("gender")}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </Field>
      </div>
      <Field label="Phone Number"><input className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#DEE9E4" }} value={f.phone} onChange={set("phone")} placeholder="10-digit mobile" /></Field>
      <Field label="Address"><input className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#DEE9E4" }} value={f.address} onChange={set("address")} /></Field>
      <Button className="w-full justify-center mt-2" disabled={!f.name || !f.age}
        onClick={() => onSave({ id: uid("pt"), ...f, createdAt: todayStr() })}>
        <Plus size={16} /> Register Patient
      </Button>
    </div>
  );
}
