# HealthSense AI - Hospital NCD Screening Platform

HealthSense AI is a comprehensive, AI-assisted **early screening and risk assessment platform for major non-communicable diseases (NCDs)**. Designed as a decision-support and prototyping tool for healthcare professionals, it leverages machine learning to predict risks for Diabetes, Hypertension, Cardiovascular Disease (CVD), Stroke, and Chronic Kidney Disease (CKD).

## 🏥 Features

- **Multi-Disease Risk Prediction:** Utilizes a FastAPI backend with integrated machine learning models to assess patient risk profiles across 5 major NCDs.
- **Explainable AI:** Feature contribution charts help healthcare professionals understand the key driving factors behind the AI's predictions (e.g., Blood Pressure, Age, BMI).
- **Automated Clinical Referrals:** Automatically flags high-risk patients and routes them to the appropriate specialist's queue.
- **Role-Based Workflows:**
  - **Nurse / Triage:** Registers patients, conducts initial screenings, captures vitals, and reviews overall risk scores.
  - **Specialist (e.g., Cardiologist, Nephrologist):** Reviews high-risk patient referrals, orders diagnostic lab tests, and manages follow-up consultations.
- **HealthSense AI Assistant:** A RAG-powered clinical chatbot that offers generalized healthcare guidelines (e.g., DASH diet, safe exercise plans) for patients and clinicians based on WHO and AHA guidelines.
- **Responsive UI/UX:** Built with React and styled with modern aesthetics, providing intuitive operational funnel charts and disease risk trends.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, TailwindCSS (inline classes/constants styling), Lucide-React for icons, Recharts for data visualization. Zod for form schema validation.
- **Backend:** FastAPI (Python), Pydantic for data validation, integrated machine learning logic.
- **Chatbot (RAG):** Powered by Gemini API (Google Generative AI) with a fallback keyword-based mechanism.
- **Storage:** Emulated browser persistence (IndexedDB wrapper) for frontend data and a lightweight backend setup.

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd healthsense-ai
   ```

2. **Backend Setup:**
   Ensure you have Python 3.12+ installed.
   ```bash
   cd backend
   python -m venv venv312
   source venv312/Scripts/activate  # On Windows: .\venv312\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
   *Note: Set your `GEMINI_API_KEY` in the environment variables to fully enable the RAG chatbot.*

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```

## 🚀 Running the Application

To run the application locally, you need to start both the backend and frontend servers in separate terminals.

**Terminal 1 (Backend):**
```bash
cd backend
.\venv312\Scripts\activate
uvicorn main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

4. **Access the application:**
   Open your browser to `http://localhost:3000` or `http://127.0.0.1:3000`.

## 🧑‍⚕️ Demo Roles

Use the following demo roles available on the Login screen to explore the application:

1. **Nurse** (Screening desk)
2. **Diabetes Specialist**
3. **Hypertension Specialist**
4. **Cardiovascular Specialist**
5. **Stroke Specialist**
6. **CKD Specialist**

## ⚠️ Disclaimer

HealthSense AI is intended as a **decision-support and prototype tool** for healthcare professionals. It is not a replacement for a physician or a clinically validated diagnostic device. Never present AI results as definitive diagnoses. Terms like 'Estimated Risk' and 'AI Screening Result' must be used. All recommendations are based on generic clinical guidelines and require professional verification.
