import React, { createContext, useContext, useState, useEffect } from "react";
import {
  authAPI,
  patientsAPI,
  dashboardAPI,
  screeningsAPI,
  reviewsAPI,
  appointmentsAPI
} from "../services/api";

const AppContext = createContext();

const getSavedUser = () => {
  try {
    const current = localStorage.getItem("healthsense_user");
    return current ? JSON.parse(current) : null;
  } catch {
    return null;
  }
};

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userRole, setUserRole] = useState(getSavedUser()?.role || "nurse"); // 'nurse' | 'endocrinologist' | 'cardiologist' | 'neurologist' | 'nephrologist' | 'super_admin'
  const [user, setUser] = useState(getSavedUser());
  const [token, setToken] = useState(() => localStorage.getItem("healthsense_token") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem("healthsense_token")));
  
  const [patients, setPatients] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: { count: 1248, subtext: "↑ 12.5% from last month" },
    todaysScreenings: { count: 34, subtext: "↑ 13.3% from yesterday" },
    highRiskCases: { count: 186, subtext: "Auto-assigned to Specialists" },
    pendingFollowups: { count: 27, subtext: "Moderate risk monitoring" }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);

  const [selectedReviewScreening, setSelectedReviewScreening] = useState(null);
  const [isDoctorReviewModalOpen, setIsDoctorReviewModalOpen] = useState(false);

  const [activeReportScreening, setActiveReportScreening] = useState(null);
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, title: "Automated Escalation", text: "Ramesh Verma (PT-1256) Diabetes 78% assigned to Endocrinologist.", time: "10 mins ago", unread: true, category: "alert" },
    { id: 2, title: "Pending Review", text: "Sunita Sharma (PT-1257) CVD Review Requested.", time: "45 mins ago", unread: true, category: "screening" }
  ]);

  const [authError, setAuthError] = useState(null);

  // Load Real Data from Backend API
  const refreshData = async () => {
    try {
      setLoading(true);
      const [patRes, totalRes, highRiskRes, todayRes, followRes, aptRes] = await Promise.all([
        patientsAPI.getPatients().catch(() => ({ data: [] })),
        dashboardAPI.getTotalPatients().catch(() => ({ data: { count: 1248 } })),
        dashboardAPI.getHighRiskPatients().catch(() => ({ data: { count: 186 } })),
        dashboardAPI.getTodayScreenings().catch(() => ({ data: { count: 34 } })),
        dashboardAPI.getFollowups().catch(() => ({ data: { count: 27 } })),
        appointmentsAPI.getAppointments().catch(() => ({ data: [] }))
      ]);

      if (patRes.data && patRes.data.length > 0) {
        setPatients(patRes.data);
        const scrList = patRes.data.map(p => ({
          id: `SCR-2025-${p.id}`,
          patientId: p.id,
          patientName: p.name,
          age: p.age,
          gender: p.gender,
          date: "24 May 2025, 10:30 AM",
          predictedDisease: p.primary_risk || "Diabetes",
          overallRiskScore: p.overall_risk || 78,
          riskCategory: p.risk_level || "High Risk",
          assignedSpecialist: p.assigned_specialist || "Endocrinologist",
          assignedDoctor: p.assigned_doctor || "Dr. Arjun Mehta (Endocrinologist)",
          doctorReviewStatus: p.doctor_review_status || "Pending",
          reportStatus: p.report_status || "Draft",
          selectedLabTests: p.selected_lab_tests || [],
          ecgImageUrl: p.ecg_image_url || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=300&q=80",
          retinalScanUrl: p.retinal_scan_url || "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=300&q=80",
          riskBreakdown: p.risk_breakdown || { diabetes: 78, hypertension: 58, cvd: 64, stroke: 35, ckd: 42 },
          vitals: { bp: p.blood_pressure || "146/92", heartRate: 80, spo2: 96, bmi: p.height ? (p.weight / Math.pow(p.height/100, 2)).toFixed(1) : 29.1 }
        }));
        setScreenings(scrList);
        if (scrList.length > 0 && !activeReportScreening) {
          setActiveReportScreening(scrList[0]);
        }
      }

      setDashboardStats({
        totalPatients: { count: totalRes.data.count || 1248, subtext: "↑ 12.5% from last month" },
        todaysScreenings: { count: todayRes.data.count || 34, subtext: "↑ 13.3% from yesterday" },
        highRiskCases: { count: highRiskRes.data.count || 186, subtext: "Auto-assigned to Specialists" },
        pendingFollowups: { count: followRes.data.count || 27, subtext: "Moderate risk monitoring" }
      });

      if (aptRes.data) {
        setAppointments(aptRes.data);
      }
    } catch (err) {
      console.error("Backend connection error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      authAPI.getProfile()
        .then((res) => {
          if (res.data) {
            setUser(res.data);
            setUserRole(res.data.role || "nurse");
            setIsAuthenticated(true);
          }
        })
        .catch(() => {
          logoutUser();
        });
      refreshData();
    }
  }, [token]);

  const loginUser = async (credentials) => {
    try {
      const res = await authAPI.login(credentials);
      const authUser = res.data.user;
      const authToken = res.data.access_token;
      localStorage.setItem("healthsense_token", authToken);
      localStorage.setItem("healthsense_user", JSON.stringify(authUser));
      setToken(authToken);
      setUser(authUser);
      setUserRole(authUser.role || "nurse");
      setIsAuthenticated(true);
      setAuthError(null);
      setActiveTab("dashboard");
      await refreshData();
      return authUser;
    } catch (error) {
      const message = error?.response?.data?.detail || "Login failed. Please check your credentials.";
      setAuthError(message);
      setIsAuthenticated(false);
      return null;
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("healthsense_token");
    localStorage.removeItem("healthsense_user");
    setToken(null);
    setUser(null);
    setUserRole("nurse");
    setIsAuthenticated(false);
    setActiveTab("dashboard");
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Actions
  const addPatient = async (newPatientData) => {
    try {
      const res = await patientsAPI.createPatient(newPatientData);
      await refreshData();
      return res.data;
    } catch (err) {
      console.error("Failed to add patient:", err);
    }
  };

  const addScreening = async (screeningResult, patientData) => {
    try {
      const payload = {
        patient_id: patientData.patient_id || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
        blood_pressure: `${patientData.bpSystolic || 140}/${patientData.bpDiastolic || 90}`,
        heart_rate: Number(patientData.heartRate) || 80,
        oxygen_level: Number(patientData.spo2) || 97.0,
        smoking: patientData.smoking || "never",
        alcohol: patientData.alcohol || "none",
        exercise: patientData.exercise || "moderate",
        sleep: Number(patientData.sleep) || 7,
        stress: Number(patientData.stress) || 5,
        family_history: patientData.familyHistory || [],
        symptoms: patientData.symptoms || [],
        ecg_image_url: patientData.ecgImageUrl,
        retinal_scan_url: patientData.retinalScanUrl
      };

      const res = await screeningsAPI.createScreening(payload);
      await refreshData();
      return res.data;
    } catch (err) {
      console.error("Failed to submit screening:", err);
    }
  };

  const signReport = async (patientId, remarks, selectedLabs) => {
    try {
      await reviewsAPI.signReport(patientId, {
        remarks,
        selected_lab_tests: selectedLabs
      });
      await refreshData();
      setNotifications(prev => [
        {
          id: Date.now(),
          title: "Report Signed",
          text: `Specialist Doctor approved & signed diagnostic report for ${patientId}. Lab tests ordered.`,
          time: "Just now",
          unread: true,
          category: "alert"
        },
        ...prev
      ]);
    } catch (err) {
      console.error("Failed to sign report:", err);
    }
  };

  const sendReminder = async (patientId) => {
    try {
      await reviewsAPI.sendReminder(patientId);
      await refreshData();
      setNotifications(prev => [
        {
          id: Date.now(),
          title: "Reminder Sent",
          text: `Nurse sent review reminder to Specialist Doctor for patient ${patientId}.`,
          time: "Just now",
          unread: true,
          category: "alert"
        },
        ...prev
      ]);
    } catch (err) {
      console.error("Failed to send reminder:", err);
    }
  };

  const openPatientDetail = (patient) => {
    setSelectedPatient(patient);
    setIsDetailModalOpen(true);
  };

  const openDoctorReview = (screening) => {
    setSelectedReviewScreening(screening);
    setIsDoctorReviewModalOpen(true);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        userRole,
        setUserRole,
        user,
        token,
        isAuthenticated,
        authError,
        loginUser,
        logoutUser,
        patients,
        setPatients,
        screenings,
        setScreenings,
        appointments,
        dashboardStats,
        searchQuery,
        setSearchQuery,
        selectedPatient,
        setSelectedPatient,
        isDetailModalOpen,
        setIsDetailModalOpen,
        openPatientDetail,
        isAddPatientModalOpen,
        setIsAddPatientModalOpen,
        addPatient,
        addScreening,
        selectedReviewScreening,
        openDoctorReview,
        isDoctorReviewModalOpen,
        setIsDoctorReviewModalOpen,
        signReport,
        sendReminder,
        activeReportScreening,
        setActiveReportScreening,
        notifications,
        setNotifications,
        refreshData,
        loading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
