import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr

# Auth Schemas
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "nurse" # nurse, endocrinologist, cardiologist, neurologist, nephrologist, super_admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Patient Schemas
class PatientCreate(BaseModel):
    patient_id: Optional[str] = None
    name: str
    age: int
    gender: str
    height: float
    weight: float
    phone: Optional[str] = None
    address: Optional[str] = None
    medical_history: Optional[List[str]] = []

class PatientResponse(BaseModel):
    id: int
    patient_id: str
    name: str
    age: int
    gender: str
    height: float
    weight: float
    phone: Optional[str] = None
    address: Optional[str] = None
    medical_history: Optional[List[str]] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Screening & Risk Prediction Schemas
class ScreeningCreate(BaseModel):
    patient_id: str
    blood_pressure: str # e.g. "146/92"
    heart_rate: int
    oxygen_level: float
    bmi: Optional[float] = None
    smoking: Optional[str] = "never"
    alcohol: Optional[str] = "none"
    exercise: Optional[str] = "moderate"
    sleep: Optional[int] = 7
    stress: Optional[int] = 5
    family_history: Optional[List[str]] = []
    symptoms: Optional[List[str]] = []
    ecg_image_url: Optional[str] = None
    retinal_scan_url: Optional[str] = None

class RiskPredictionResponse(BaseModel):
    diabetes_risk: float
    hypertension_risk: float
    cvd_risk: float
    stroke_risk: float
    ckd_risk: float
    overall_risk: float
    risk_level: str
    assigned_specialist: Optional[str] = None
    assigned_doctor: Optional[str] = None

    class Config:
        from_attributes = True

# Doctor Review Schemas
class DoctorReviewCreate(BaseModel):
    patient_id: str
    doctor_id: Optional[int] = None
    remarks: str
    selected_lab_tests: Optional[List[str]] = []
    status: Optional[str] = "Reviewed"
    report_status: Optional[str] = "Signed" # Draft, Sent, Viewed, Signed

class DoctorReviewResponse(BaseModel):
    id: int
    patient_id: str
    doctor_id: Optional[int]
    remarks: Optional[str]
    selected_lab_tests: Optional[List[str]]
    status: str
    report_status: str
    review_date: datetime.datetime

    class Config:
        from_attributes = True

# Appointment Schemas
class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: Optional[int] = None
    appointment_date: datetime.datetime
    status: Optional[str] = "Confirmed"

class AppointmentResponse(BaseModel):
    id: int
    patient_id: str
    doctor_id: Optional[int]
    appointment_date: datetime.datetime
    status: str

    class Config:
        from_attributes = True

# Chatbot Schemas
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

ChatMessage = ChatRequest
