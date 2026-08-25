import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach JWT Auth token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("healthsense_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/profile")
};

export const dashboardAPI = {
  getTotalPatients: () => api.get("/dashboard/total-patients"),
  getHighRiskPatients: () => api.get("/dashboard/high-risk-patients"),
  getTodayScreenings: () => api.get("/dashboard/today-screenings"),
  getFollowups: () => api.get("/dashboard/followups")
};

export const patientsAPI = {
  getPatients: () => api.get("/patients"),
  createPatient: (data) => api.post("/patients", data),
  getPatient: (id) => api.get(`/patients/${id}`),
  updatePatient: (id, data) => api.put(`/patients/${id}`, data),
  deletePatient: (id) => api.delete(`/patients/${id}`)
};

export const screeningsAPI = {
  createScreening: (data) => api.post("/screenings", data),
  predictRisk: (data) => api.post("/predict-risk", data)
};

export const analyticsAPI = {
  getDiseaseDistribution: () => api.get("/analytics/disease-distribution"),
  getRiskTrends: () => api.get("/analytics/risk-trends"),
  getScreeningStats: () => api.get("/analytics/screenings")
};

export const reviewsAPI = {
  getPendingReviews: () => api.get("/reviews/pending"),
  addReview: (data) => api.post("/reviews", data),
  approveReview: (id, data) => api.put(`/reviews/${id}`, data),
  signReport: (patientId, data) => api.put(`/reviews/${patientId}/sign`, data),
  sendReminder: (patientId) => api.post(`/reviews/${patientId}/reminder`)
};

export const appointmentsAPI = {
  getAppointments: () => api.get("/appointments"),
  bookAppointment: (data) => api.post("/appointments", data),
  updateAppointment: (id, data) => api.put(`/appointments/${id}`, data)
};

export const chatbotAPI = {
  sendMessage: (message) => api.post("/chatbot", { message })
};

export const reportsAPI = {
  getReportUrl: (patientId) => `${API_BASE_URL}/reports/${patientId}`
};

export default api;
