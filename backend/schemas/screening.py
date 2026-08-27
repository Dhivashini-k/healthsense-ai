from pydantic import BaseModel, Field, model_validator
from typing import List, Optional

class PatientScreeningPayload(BaseModel):
    patient_id: str = Field(..., description="Unique ID for the patient")
    age: int = Field(..., ge=18, le=120, description="Age must be between 18 and 120")
    gender: str = Field(..., description="Male or Female")
    height_cm: float = Field(..., ge=100.0, le=250.0, description="Height must be between 100 and 250 cm")
    weight_kg: float = Field(..., ge=20.0, le=300.0, description="Weight must be between 20 and 300 kg")
    systolic_bp: int = Field(..., ge=70, le=250, description="Systolic BP must be between 70 and 250 mmHg")
    diastolic_bp: int = Field(..., ge=40, le=150, description="Diastolic BP must be between 40 and 150 mmHg")
    heart_rate: int = Field(..., ge=30, le=200, description="Heart rate must be between 30 and 200 bpm")
    oxygen_saturation: int = Field(..., ge=50, le=100, description="SpO2 must be between 50% and 100%")
    temperature_c: float = Field(37.0, ge=30.0, le=45.0)
    blood_glucose: float = Field(100.0, ge=30.0, le=500.0)
    
    smoking_status: str = Field(..., description="never, former, or current")
    alcohol_consumption: str = Field(..., description="none, moderate, heavy")
    physical_activity: str = Field(..., description="sedentary, light, moderate, active")
    diet_quality: str = Field(..., description="poor, average, healthy")
    sleep_hours: int = Field(..., ge=0, le=24)
    stress_level: int = Field(..., ge=1, le=10)
    
    family_history: List[str] = Field(default_factory=list)
    symptoms: List[str] = Field(default_factory=list)

    @model_validator(mode='after')
    def check_bp(self):
        if self.systolic_bp <= self.diastolic_bp:
            raise ValueError('Systolic blood pressure must be greater than diastolic blood pressure')
        return self
