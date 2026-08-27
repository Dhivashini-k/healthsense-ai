import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

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
    name: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-zA-Z\s\-'.]+$")
    age: int = Field(..., ge=18, le=120)
    gender: str
    height: float = Field(..., ge=100, le=250)
    weight: float = Field(..., ge=20, le=300)
    phone: Optional[str] = Field(None, min_length=6, max_length=20, pattern=r"^[+\d\s\-()]+$")
    address: Optional[str] = Field(None, min_length=3, max_length=200)
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
    blood_pressure: str = Field(..., pattern=r"^\d{2,3}/\d{2,3}$") # e.g. "146/92"
    heart_rate: int = Field(..., ge=30, le=220)
    oxygen_level: float = Field(..., ge=0, le=100)
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

    @field_validator("blood_pressure")
    @classmethod
    def validate_bp(cls, v):
        sys, dia = map(int, v.split("/"))
        if not (70 <= sys <= 250):
            raise ValueError("Systolic BP must be between 70 and 250")
        if not (40 <= dia <= 150):
            raise ValueError("Diastolic BP must be between 40 and 150")
        if sys <= dia:
            raise ValueError("Systolic must be greater than diastolic")
        return v

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
    model_explanations: Optional[dict] = None

    model_config = {
        "from_attributes": True,
        "protected_namespaces": ()
    }

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
