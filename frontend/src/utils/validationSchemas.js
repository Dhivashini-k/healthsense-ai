import { z } from 'zod';

/**
 * HealthSense AI — Centralized Validation Schemas (Zod).
 * 
 * Consistent with backend Pydantic rules.
 * All ranges are clinically validated.
 */

// ── Patient Registration ──────────────────────────────────────────────

export const patientSchema = z.object({
  name: z.string({
    required_error: "Patient name is required",
    invalid_type_error: "Name must be a string",
  })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or less")
    .regex(/^[a-zA-Z\s]+$/, "Please enter a valid name using letters only"),
  age: z.coerce.number({
    required_error: "Age is required",
    invalid_type_error: "Please enter a valid age",
  })
    .min(18, "Patient must be at least 18 years old")
    .max(120, "Age cannot exceed 120 years"),
  gender: z.enum(["Male", "Female", "Other"], { 
    errorMap: () => ({ message: "Please select a gender" })
  }),
  phone: z.string({
    required_error: "Phone number is required",
    invalid_type_error: "Phone number must be a string",
  })
    .min(6, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(/^[+\d\s\-()]+$/, "Invalid phone number format"),
  address: z.string({
    required_error: "Address is required",
    invalid_type_error: "Address must be a string",
  })
    .min(3, "Address is too short")
    .max(200, "Address is too long"),
  height: z.coerce.number({
    required_error: "Height is required",
    invalid_type_error: "Please enter a valid height",
  })
    .min(100, "Height must be at least 100 cm")
    .max(250, "Height cannot exceed 250 cm"),
  weight: z.coerce.number({
    required_error: "Weight is required",
    invalid_type_error: "Please enter a valid weight",
  })
    .min(20, "Weight must be at least 20 kg")
    .max(300, "Weight cannot exceed 300 kg"),
});

// ── Screening Personal Details ────────────────────────────────────────

export const personalSchema = z.object({
  height: z.coerce.number()
    .min(100, "Height must be at least 100 cm")
    .max(250, "Height cannot exceed 250 cm"),
  weight: z.coerce.number()
    .min(20, "Weight must be at least 20 kg")
    .max(300, "Weight cannot exceed 300 kg"),
});

// ── Screening Vitals ──────────────────────────────────────────────────

export const vitalsSchema = z.object({
  systolic: z.coerce.number()
    .min(70, "Systolic BP must be at least 70 mmHg")
    .max(250, "Systolic BP cannot exceed 250 mmHg"),
  diastolic: z.coerce.number()
    .min(40, "Diastolic BP must be at least 40 mmHg")
    .max(150, "Diastolic BP cannot exceed 150 mmHg"),
  heartRate: z.coerce.number()
    .min(30, "Heart rate must be at least 30 bpm")
    .max(220, "Heart rate cannot exceed 220 bpm"),
}).refine(
  (data) => data.systolic > data.diastolic,
  {
    message: "Systolic pressure must be greater than diastolic pressure",
    path: ["systolic"],
  }
);

// ── Clinical Warning Ranges (not errors, but flags) ───────────────────

export function getVitalWarnings(vitals) {
  const warnings = {};
  const sys = Number(vitals.systolic);
  const dia = Number(vitals.diastolic);
  const hr = Number(vitals.heartRate);

  if (sys >= 180)
    warnings.systolic = "⚠️ Hypertensive Crisis (≥180 mmHg) — Immediate evaluation needed";
  else if (sys >= 140)
    warnings.systolic = "⚠️ Stage 2 Hypertension (140-179 mmHg)";
  else if (sys >= 130)
    warnings.systolic = "Elevated blood pressure (130-139 mmHg)";

  if (dia >= 120)
    warnings.diastolic = "⚠️ Hypertensive Crisis (≥120 mmHg) — Immediate evaluation needed";
  else if (dia >= 90)
    warnings.diastolic = "⚠️ Stage 2 Hypertension (90-119 mmHg)";

  if (hr >= 100)
    warnings.heartRate = "⚠️ Tachycardia (≥100 bpm) — Consider further evaluation";
  else if (hr < 50)
    warnings.heartRate = "⚠️ Bradycardia (<50 bpm) — Consider further evaluation";

  return warnings;
}

// ── Validation Helper ─────────────────────────────────────────────────

/**
 * Validate a single field against its schema.
 * Returns { valid: boolean, error: string | null }
 */
export function validateField(schema, fieldName, value) {
  try {
    const partialData = { [fieldName]: value };
    schema.pick({ [fieldName]: true }).parse(partialData);
    return { valid: true, error: null };
  } catch (err) {
    const issue = err.issues?.[0];
    return { valid: false, error: issue?.message || "Invalid value" };
  }
}

/**
 * Validate all fields against a schema.
 * Returns { valid: boolean, errors: { [field]: string } }
 */
export function validateAll(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: {} };
  }
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] || "form";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { valid: false, errors };
}
