import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../Common/Button';
import { Field } from '../Common/Field';
import { uid, todayStr } from '../../utils/helpers';
import { patientSchema, validateAll } from '../../utils/validationSchemas';

export function AddPatientForm({ onSave }) {
  const [f, setF] = useState({ name: "", age: "", gender: "Male", phone: "", address: "", medicalHistory: "", previousConditions: "", height: "", weight: "" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validateFieldValue = (key, value) => {
    const data = {
      name: key === "name" ? value : f.name || undefined,
      age: key === "age" ? (value === "" ? undefined : +value) : (f.age === "" ? undefined : +f.age),
      gender: key === "gender" ? value : f.gender || undefined,
      phone: key === "phone" ? value : f.phone || undefined,
      address: key === "address" ? value : f.address || undefined,
      height: key === "height" ? (value === "" ? undefined : +value) : (f.height === "" ? undefined : +f.height),
      weight: key === "weight" ? (value === "" ? undefined : +value) : (f.weight === "" ? undefined : +f.weight),
    };
    const result = validateAll(patientSchema, data);
    setErrors((current) => ({ ...current, [key]: result.errors[key] }));
  };

  const handleChange = (key) => (e) => {
    set(key)(e);
  };

  const handleSave = (event) => {
    event?.preventDefault();
    const dataToValidate = {
      name: f.name || undefined,
      age: f.age === "" ? undefined : +f.age,
      gender: f.gender || undefined,
      phone: f.phone || undefined,
      address: f.address || undefined,
      height: f.height === "" ? undefined : +f.height,
      weight: f.weight === "" ? undefined : +f.weight
    };
    const { valid, errors: newErrors } = validateAll(patientSchema, dataToValidate);
    if (!valid) {
      setErrors(newErrors);
      return;
    }
    onSave({ id: uid("pt"), ...f, age: +f.age, height: +f.height, weight: +f.weight, createdAt: todayStr() });
  };

  return (
    <form className="space-y-4" onSubmit={handleSave} noValidate>
      <Field label="Full Name">
        <input aria-invalid={!!errors.name} className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green ${errors.name ? 'border-brand-coral bg-brand-coral/10' : 'border-brand-border bg-transparent'}`} value={f.name} onChange={handleChange("name")} onBlur={(e) => validateFieldValue("name", e.target.value)} placeholder="Patient name" />
        {errors.name && <div className="text-xs text-brand-coral mt-1.5 font-medium">{errors.name}</div>}
      </Field>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Age" className="!mb-0">
          <input type="number" min="18" max="120" aria-invalid={!!errors.age} className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green ${errors.age ? 'border-brand-coral bg-brand-coral/10' : 'border-brand-border bg-transparent'}`} value={f.age} onChange={handleChange("age")} onBlur={(e) => validateFieldValue("age", e.target.value)} placeholder="e.g. 45" />
          {errors.age && <div className="text-xs text-brand-coral mt-1.5 font-medium">{errors.age}</div>}
        </Field>
        <Field label="Gender" className="!mb-0">
          <select className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green ${errors.gender ? 'border-brand-coral bg-brand-coral/10' : 'border-brand-border bg-transparent'}`} value={f.gender} onChange={set("gender")}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
          {errors.gender && <div className="text-xs text-brand-coral mt-1.5 font-medium">{errors.gender}</div>}
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Height (cm)" className="!mb-0">
          <input type="number" min="100" max="250" aria-invalid={!!errors.height} className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green ${errors.height ? 'border-brand-coral bg-brand-coral/10' : 'border-brand-border bg-transparent'}`} value={f.height} onChange={handleChange("height")} onBlur={(e) => validateFieldValue("height", e.target.value)} placeholder="e.g. 175" />
          {errors.height && <div className="text-xs text-brand-coral mt-1.5 font-medium">{errors.height}</div>}
        </Field>
        <Field label="Weight (kg)" className="!mb-0">
          <input type="number" min="20" max="300" aria-invalid={!!errors.weight} className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green ${errors.weight ? 'border-brand-coral bg-brand-coral/10' : 'border-brand-border bg-transparent'}`} value={f.weight} onChange={handleChange("weight")} onBlur={(e) => validateFieldValue("weight", e.target.value)} placeholder="e.g. 70" />
          {errors.weight && <div className="text-xs text-brand-coral mt-1.5 font-medium">{errors.weight}</div>}
        </Field>
      </div>

      <Field label="Phone Number">
        <input aria-invalid={!!errors.phone} className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green ${errors.phone ? 'border-brand-coral bg-brand-coral/10' : 'border-brand-border bg-transparent'}`} value={f.phone} onChange={handleChange("phone")} onBlur={(e) => validateFieldValue("phone", e.target.value)} placeholder="10-digit mobile" />
        {errors.phone && <div className="text-xs text-brand-coral mt-1.5 font-medium">{errors.phone}</div>}
      </Field>

      <Field label="Address">
        <input aria-invalid={!!errors.address} className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green ${errors.address ? 'border-brand-coral bg-brand-coral/10' : 'border-brand-border bg-transparent'}`} value={f.address} onChange={handleChange("address")} onBlur={(e) => validateFieldValue("address", e.target.value)} placeholder="Full address" />
        {errors.address && <div className="text-xs text-brand-coral mt-1.5 font-medium">{errors.address}</div>}
      </Field>

      <Button className="w-full justify-center mt-4" onClick={handleSave}>
        <Plus size={18} /> Register Patient
      </Button>
    </form>
  );
}
