# 🌸 Saarthi • Next-Gen AI Women's Health & Virtual Care Platform

> **Built for HackOrbit & Healthcare Innovation**  
> *Saarthi is a comprehensive, production-grade women's health and virtual care platform. It provides patients with cycle log tracking, secure medical records management, AI-assisted symptom screening, pediatric immunization alerts, and encrypted peer-to-peer video consultations with verified specialists.*

---

## 🌍 Real-World Healthcare Problems Solved by Saarthi

Women's healthcare faces systemic challenges in access, stigma, data organization, and timely medical intervention. Saarthi directly addresses these critical real-world issues:

### 1. Social Stigma & Barriers to Gynecological Consultations
* **The Problem**: Millions of women, particularly in tier-2/3 cities and rural regions, delay or avoid seeking timely gynecological care due to social embarrassment, stigma, or lack of female doctors nearby.
* **Saarthi's Solution**: Provides discreet, direct access to verified female specialists through encrypted WebRTC video calls and text consultations, allowing women to consult doctors privately from the comfort of their home.

### 2. High Diagnostic Delay for PCOS, PCOD & Reproductive Health Conditions
* **The Problem**: Conditions like PCOS, Endometriosis, and Thyroid imbalances affect 1 in 5 women globally, but diagnosis is often delayed by 3 to 7 years because standard tracking apps enforce rigid 28-day cycle assumptions and ignore cycle variability.
* **Saarthi's Solution**: Offers fully customizable cycle parameters (20–45 day cycles, 2–10 day period lengths), ovulation prediction, phase-specific nutrition/exercise guidance, and trend logging so women can present clear medical timelines to their doctor.

### 3. Patient Anxiety & Incomplete Communication During Doctor Visits
* **The Problem**: Consultation slots are often short (10–15 minutes), and patients frequently get anxious or forget key symptoms, timelines, and critical questions to ask their doctor.
* **Saarthi's Solution**: SymptoScan AI converts raw user-reported symptoms into a structured clinical question checklist *before* the consultation, helping patients communicate effectively and improving diagnostic precision.

### 4. Fragmented & Lost Personal Health Records
* **The Problem**: Prescriptions, lab reports, and vitals readings (blood pressure, blood sugar, BMI) are scattered across loose paper slips or separate phone apps, making continuity of care difficult during specialist visits or emergencies.
* **Saarthi's Solution**: MediVault offers a database-backed, encrypted personal health record locker where users store lab PDFs, prescriptions, and vitals history in one secure, accessible location.

### 5. Maternal & Infant Immunization Drop-Off
* **The Problem**: Vaccine drop-off rates for infants and pregnant mothers remain significant due to forgotten immunization dates, lack of awareness, and complex schedules.
* **Saarthi's Solution**: VaxAlert maps vaccination timelines directly to official National Immunization Protocols (MoHFW), sending automated reminders for upcoming doses.

### 6. Low Awareness & Utilization of Government Health Welfare Schemes
* **The Problem**: Many low-income women miss out on government maternity benefits, financial assistance, and NGO health aid because scheme criteria are buried in complex regulatory documents.
* **Saarthi's Solution**: HealthYojana and NGOHeal provide category-based scheme matching to connect women directly to eligible welfare programs and local community support groups.

---

## 🏛️ Production Systems Design & Technical Architecture

### 1. 📍 Geospatial Specialist Finder (GynConnect)
* **The Tech**: Spring Boot, Spring Cache (Redis Abstraction), Spring Data JPA.
* **The Design**: Features an interactive search dashboard allowing patients to locate gynecologists, maternity specialists, and counselors. Queries are optimized using Spring Caching:
  ```java
  @Cacheable(value = "gynecologists", key = "{#lat, #lng, #radius_km}")
  public List<Doctor> findNearbyDoctors(double lat, double lng, double radius_km) { ... }
  ```
  *This intercepts database scans, holding geolocation results in memory to handle peak load spikes.*

### 2. 📹 P2P Encrypted Consultations (WebRTC & WebSockets)
* **The Tech**: Spring WebSocket (Signaling Server), HTML5 WebRTC API.
* **The Design**: Facilitates real-time virtual consultations. The Spring Boot backend acts as a lightweight signaling gateway (`SignalingHandler.java`), exchanging session SDP offers, answers, and ICE candidate records between peers without storing media streams on our servers.

### 3. 💳 Stripe Billing & Signed Webhooks (Transaction Safety)
* **The Tech**: Stripe Java SDK, Cryptographic Signature Verification.
* **The Design**: Doctor consultation bookings are paid via Stripe Checkout.
  * **PCI-DSS Compliance**: The frontend loads card forms inside isolated Stripe-hosted iframe elements. Card credentials never touch our database, shielding the codebase from audit liabilities.
  * **Asynchronous Webhook Settlement**: Instead of trusting the client redirect, the backend listens to signed Webhooks at `/api/payment/webhook`. It verifies the request signature cryptographically via `Webhook.constructEvent()` before updating appointment status to `PAID`.

### 4. 🛡️ Resilience4j Fault-Tolerant Screening (SymptoScan)
* **The Tech**: Resilience4j Circuit Breaker, Gemini 1.5 Flash API.
* **The Design**: The AI symptom diagnostic tool leverages a circuit breaker configuration. If the Gemini API times out or hits quota rate limits, the circuit changes status to `OPEN` and immediately diverts traffic to `fallbackSymptomAnalysis()`, returning a safe offline diagnostic instruction panel.

---

## ✨ Feature Overview & Module Breakdowns

### 1. 🌸 SheCycle+ Menstrual & Ovulation Predictor
* **Custom User Setup**: Accepts user-specified period start date, average cycle length (20–45 days), and period duration (2–10 days).
* **Dynamic Prediction Engine**: Calculates live next predicted period date with countdown (`In approx. 22 days`), estimated ovulation day, and peak fertile window.
* **Phase-Aware Care**: Offers natural nutrition guidelines (iron-rich foods, complex carbs) and physical exercises suited to the user's active cycle phase.

### 2. 🤖 SymptoScan AI Diagnostic Assistant
* **Natural Language Screening**: Powered by **Gemini 1.5 Flash** to evaluate user-described symptoms in simple, clear terms.
* **Resilience4j Circuit Breaker**: Protects application stability with automated offline fallbacks if external AI services experience downtime or rate limits.
* **Doctor Consultation Checklist**: Prepares an organized list of clinical questions for users to review before their medical appointment.

### 3. 🩺 GynConnect Telehealth & Geospatial Finder
* **Geospatial Haversine Distance Scoring**: REST endpoint `GET /api/gynecologists` uses `@Cacheable` and a spherical Haversine algorithm (`DoctorController.java`) to score nearby female specialists by real GPS coordinates (`lat`, `lng`).
* **Free OpenStreetMap Leaflet Map Integration**: Displays an interactive OpenStreetMap tile layer (`https://www.openstreetmap.org/export/embed.html`) with clinic markers — 100% free with **0 API keys required**.
* **2-Way WebRTC Video Consultations**: Handles camera/audio streams (`getUserMedia`) and connects to Spring Boot WebSocket signaling (`SignalingHandler.java` at `ws://localhost:8080/ws/signaling`) to negotiate WebRTC SDP offers/answers and ICE candidates.
* **Stripe Checkout Sessions**: Integrates `POST /api/payment/checkout` for session creation and signature-verified webhook processing (`Webhook.constructEvent`) at `/api/payment/webhook`.

### 4. 🔐 MediVault Document Locker & Vitals Evaluator
* **Database Vitals History**: Persists user blood pressure, blood sugar, weight, and BMI records in Spring Boot JPA `vitals_logs` table (`VitalsController.java`).
* **Clinical Classifiers**: Evaluates AHA 2017 Blood Pressure standards (with Low BP / Hypotension detection) and WHO BMI benchmarks.
* **Encrypted Locker**: Securely manages user prescriptions and lab reports with user-controlled storage.

### 5. 💉 VaxAlert, HealthYojana, NGOHeal & CareCircle
* **VaxAlert Scheduler**: Immunization tracking aligned with official MoHFW schedules.
* **HealthYojana Matcher**: Categorized eligibility search for government healthcare benefits and maternity schemes.
* **CareCircle Peer Support**: Anonymous channels for mental health, PCOS, and maternal guidance.

---

## 🏗️ System Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                                  React 18 Frontend                                |
|  [SheCycle+]   [SymptoScan AI]   [GynConnect Consult]   [MediVault]  [VaxAlert]   |
+----------------------------------------+------------------------------------------+
                                         |
                       HTTP REST / WebSockets (JWT Auth)
                                         |
+----------------------------------------v------------------------------------------+
|                               Spring Boot 3 Backend                               |
|  - DoctorController (@Cacheable Haversine)  - VitalsController (/api/vitals/log)   |
|  - AppointmentController (/api/appointments)- PaymentController (Stripe / Webhook) |
|  - SignalingHandler (WebSocket WebRTC)      - GeminiService (Resilience4j AI)     |
+----------------------------------------+------------------------------------------+
                                         |
                                  Spring Data JPA
                                         |
+----------------------------------------v------------------------------------------+
|                             PostgreSQL / H2 Database                              |
|   [users]    [cycle_logs]    [vitals_logs]    [appointments]    [doctor_profiles]  |
+-----------------------------------------------------------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Core** | React 18, Vite, JavaScript (ES6+), HTML5 Canvas / MediaDevices |
| **Styling & Design System** | TailwindCSS, Custom HSL Tokens, Lucide Icons, Outfit Typography |
| **Backend Framework** | Java 17, Spring Boot 3.1.5, Spring Security (JWT), Spring Data JPA |
| **Real-Time Communications**| HTML5 WebRTC API, Spring WebSocket (`TextWebSocketHandler`), STUN Servers |
| **Fault Tolerance & Caching**| Resilience4j Circuit Breaker, `@Cacheable` Spring Caching |
| **Mapping & Payments** | OpenStreetMap Leaflet Tile Embeds, Stripe SDK & Signed Webhook Verification |
| **Database** | PostgreSQL (Production) / H2 In-Memory Database (Development) |

---

## 💻 Local Setup & Installation Instructions

### Prerequisites
* **Java Development Kit (JDK) 17+**
* **Node.js v18+ & npm**
* **Maven 3.8+**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/saarthi.git
cd saarthi
```

---

### Step 2: Configure Environment Variables

1. Navigate to the backend directory and update `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Open `.env` and fill in your configuration:
   ```properties
   GEMINI_API_KEY=your_gemini_api_key_here
   JWT_SECRET=your_base64_jwt_signing_secret_here
   
   # Stripe Configuration
   STRIPE_API_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Database Configuration (Defaults to H2 in-memory for quick testing)
   SPRING_DATASOURCE_URL=jdbc:h2:mem:saarthidb
   SPRING_DATASOURCE_USERNAME=sa
   SPRING_DATASOURCE_PASSWORD=
   ```

---

### Step 3: Start the Spring Boot Backend Server
```bash
cd backend
mvn spring-boot:run
```
*The Spring Boot server will launch on **`http://localhost:8080`**.*

---

### Step 4: Start the React Frontend Application
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Open **[http://localhost:5173](http://localhost:5173)** in your browser to run Saarthi.*

---

## 📜 License & Acknowledgments

* Built for **HackOrbit & Women's Healthcare Innovation**.
* Open-source map tile layers provided by **[OpenStreetMap](https://www.openstreetmap.org)**.
