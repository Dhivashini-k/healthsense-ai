import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="nurse") # nurse, endocrinologist, cardiologist, neurologist, nephrologist, super_admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    height = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    medical_history = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    screenings = relationship("Screening", back_populates="patient", cascade="all, delete-orphan")
    risk_predictions = relationship("RiskPrediction", back_populates="patient", cascade="all, delete-orphan")
    reviews = relationship("DoctorReview", back_populates="patient", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")

class Screening(Base):
    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    blood_pressure = Column(String, nullable=False) # e.g. "146/92"
    heart_rate = Column(Integer, nullable=False)
    oxygen_level = Column(Float, nullable=False)
    bmi = Column(Float, nullable=False)
    smoking = Column(String, nullable=True)
    alcohol = Column(String, nullable=True)
    exercise = Column(String, nullable=True)
    sleep = Column(Integer, nullable=True)
    stress = Column(Integer, nullable=True)
    family_history = Column(JSON, nullable=True)
    symptoms = Column(JSON, nullable=True)
    ecg_image_url = Column(String, nullable=True)
    retinal_scan_url = Column(String, nullable=True)
    screening_date = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="screenings")

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    diabetes_risk = Column(Float, nullable=False)
    hypertension_risk = Column(Float, nullable=False)
    cvd_risk = Column(Float, nullable=False)
    stroke_risk = Column(Float, nullable=False)
    ckd_risk = Column(Float, nullable=False)
    overall_risk = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False) # Low Risk, Moderate Risk, High Risk
    assigned_specialist = Column(String, nullable=True) # Endocrinologist, Cardiologist, Neurologist, Nephrologist
    assigned_doctor = Column(String, nullable=True)

    patient = relationship("Patient", back_populates="risk_predictions")

class DoctorReview(Base):
    __tablename__ = "doctor_reviews"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(Text, nullable=True)
    selected_lab_tests = Column(JSON, nullable=True)
    status = Column(String, default="Pending")
    report_status = Column(String, default="Draft") # Draft, Sent, Viewed, Signed
    review_date = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="reviews")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    appointment_date = Column(DateTime, nullable=False)
    status = Column(String, default="Confirmed")

    patient = relationship("Patient", back_populates="appointments")
