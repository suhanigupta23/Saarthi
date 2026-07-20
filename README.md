# Saarthi: Women's Health & Telehealth Platform

Saarthi is a comprehensive, production-grade women's health and virtual care platform. It provides patients with cycle log tracking, secure medical records management, AI-assisted symptom screening, pediatric immunization alerts, and encrypted peer-to-peer video consultations with verified specialists.

The architecture is built from the ground up to emphasize **system design resilience, PCI-DSS compliance, stateless JWT security, and high-performance caching**.

---

## 🚀 Key Features & Architecture Pillars

### 1. Geospatial Specialist Finder (GynConnect)
* **The Tech**: Spring Boot, Spring Cache (Redis abstraction), JPA.
* **The Design**: Features an interactive search dashboard allowing patients to locate gynecologists, maternity specialists, and counselors. Queries are optimized using Spring Caching:
  * `@Cacheable(value = "gynecologists", key = "{#lat, #lng, #radius_km}")`
  * This intercepts database scans, holding geolocation results in memory to handle peak load spikes.

### 2. P2P Encrypted Consultations (WebRTC & WebSockets)
* **The Tech**: WebSockets (Signaling Server), HTML5 WebRTC API.
* **The Design**: Facilitates real-time virtual consultations. The Spring Boot backend acts as a lightweight signaling gateway (`SignalingHandler.java`), exchanging session SDP offers, answers, and ICE candidate records between peers without storing media streams on our servers.

### 3. Stripe billing & Signed Webhooks (Transaction Safety)
* **The Tech**: Stripe SDK, Cryptographic Signature Verification.
* **The Design**: Doctor consultation bookings are paid via Stripe Checkout.
  * **PCI-DSS Compliance**: The frontend loads card forms inside isolated Stripe-hosted iframe elements. Card credentials never touch our database, shielding the codebase from audit liabilities.
  * **Asynchronous Webhook Settlement**: Instead of trusting the client redirect, the backend listens to signed Webhooks at `/api/payment/webhook`. It verifies the request signature cryptographically via `Webhook.constructEvent()` before updating appointment status to `PAID`.

### 4. Resilience4j Fault-Tolerant Screening (SymptoScan)
* **The Tech**: Resilience4j Circuit Breaker, Gemini 1.5 Flash.
* **The Design**: The AI symptom diagnostic tool leverages a circuit breaker configuration. If the Gemini API times out or hits quota rate limits, the circuit changes status to `OPEN` and immediately diverts traffic to `fallbackSymptomAnalysis()`, returning a safe offline diagnostic instruction panel.

---

## 🛠️ Tech Stack

* **Frontend**: React (Vite), CSS3, Lucide Icons, WebRTC Client.
* **Backend**: Spring Boot 3.1.5, Spring Security, Spring Data JPA, Hibernate, Resilience4j, WebSockets.
* **Database**: PostgreSQL (Production) / H2 Database (Local Dev).

---

## 💻 Local Setup & Running Instructions

### Prerequisites
* Java Development Kit (JDK) 17+
* Node.js v18+
* Maven 3.8+
* Stripe CLI *(optional, for local webhook testing)*

### Step 1: Clone and Configure Environment
Copy the environment template in `backend/.env` and update the values:
```properties
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_base64_jwt_signing_secret_here

# Stripe Keys
STRIPE_API_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PostgreSQL Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/saarthidb
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
```

### Step 2: Start the Backend Server
Navigate to the backend folder, load variables, and boot Spring Boot:
```bash
cd backend
export $(cat .env | xargs) && mvn spring-boot:run
```
The server will start on port `8080` with the embedded Tomcat instance.

### Step 3: Start the Frontend Application
In a new terminal window, navigate to the frontend folder and launch Vite:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** (or port 5174 if 5173 is occupied) to access the platform.

---

## 🧪 Testing Stripe Webhooks Locally
To test payment webhooks on localhost:
1. Launch Stripe CLI forwarding:
   ```bash
   stripe listen --forward-to localhost:8080/api/payment/webhook
   ```
2. Copy the printed signature `whsec_...` into your backend `.env` file.
3. In a separate terminal, trigger a test check-out event:
   ```bash
   stripe trigger checkout.session.completed
   ```
4. Verify your Spring Boot console prints:
   `Payment checkout session succeeded! Updating database status...`
