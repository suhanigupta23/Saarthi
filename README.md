# 🌸 Saarthi • AI-Powered Women's Health & Telehealth Platform

> **Built for HackOrbit 2025** — 🏆 Open Innovation Track Winner (1st Place) · Top 10 Finalist overall (1,000+ teams)
>
> Saarthi is a full-stack women's health platform that brings cycle tracking, AI-assisted symptom screening, geolocation-based doctor search, real-time video consultations, and secure payments into one product.

**Live App:** [saarthi-nine-gamma.vercel.app](https://saarthi-nine-gamma.vercel.app/) · **Backend:** Spring Boot on Render · **Frontend:** React on Vercel

---

## 🌍 The Problem

Women's healthcare in India faces real, well-documented gaps:

- **Access & stigma** — many women, especially outside metro cities, delay gynecological care due to embarrassment or lack of nearby specialists.
- **Diagnostic delay** — conditions like PCOS are often diagnosed years late because most cycle-tracking apps assume a rigid 28-day cycle.
- **Short, high-pressure consultations** — patients forget symptoms or questions in 10–15 minute doctor visits.
- **Scattered health records** — prescriptions and lab reports live across paper slips and random apps.

## 💡 How Saarthi Addresses It

| Problem | Saarthi's Approach |
|---|---|
| Access & stigma | Private video consultations from home via WebRTC — no clinic visit needed |
| Diagnostic delay | Fully customizable cycle tracking (20–45 day cycles) with trend logging |
| Unprepared consultations | AI-assisted symptom screening generates a structured question checklist before the appointment |
| Scattered records | Backend-persisted vitals tracking with clinical classification (MediVault) |
| Finding a doctor | Geolocation-based specialist search with distance scoring |
| Payment friction | Stripe Checkout + UPI, signature-verified webhooks |

---

## ⚙️ Key Technical Features

- **JWT-secured REST APIs** with BCrypt password hashing and stateless Spring Security
- **2-way WebRTC video consultations** via a custom Spring Boot WebSocket signaling server, negotiating SDP offers/answers and ICE candidates between patient and doctor
- **AI symptom screening** powered by Gemini 3.5 Flash, wrapped in a **Resilience4j circuit breaker** — if the AI service times out or hits a rate limit, the app automatically falls back to a local rule-based response instead of failing
- **Geolocation-based doctor search** using the Haversine distance formula and Spring Cache (`@Cacheable`)
- **Stripe Checkout integration** with cryptographic webhook signature verification (`Webhook.constructEvent`) — card data never touches the application server
- **Persistent appointment records** in PostgreSQL (Neon), tied to the authenticated user
- **Interactive OpenStreetMap** clinic markers — no paid API key required
- Responsive React + Tailwind CSS UI, deployed via Docker

---

## 🏗️ Architecture

```
                    +------------------------------------+
                    |         Vercel (Frontend)           |
                    |        React 18 SPA (Vite)          |
                    +-----------------+--------------------+
                                       |
                       HTTPS REST & WSS WebSockets (JWT)
                                       |
                    +-----------------v--------------------+
                    |      Render (Spring Boot API)         |
                    |       Java 17 + Spring Security       |
                    +----+-----------------------------+----+
                         |                              |
         Spring Data JPA |                              | Gemini API / Stripe Webhooks
                         |                              |
           +-------------v------+          +------------v-------------------+
           |   Neon PostgreSQL  |          |  External Services:            |
           |  Users & Appointments |       |  • Gemini 3.5 Flash            |
           +---------------------+        |  • Stripe Checkout & Webhooks  |
                                            +---------------------------------+
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Java 17, Spring Boot 3, Spring Security (JWT), Spring Data JPA |
| **Database** | PostgreSQL (Neon, serverless) |
| **Real-Time** | HTML5 WebRTC, Spring WebSocket signaling, Google STUN |
| **Resilience** | Resilience4j Circuit Breaker |
| **Payments** | Stripe Checkout + signed Webhooks, UPI |
| **Caching** | Spring `@Cacheable` |
| **Deployment** | Docker, Vercel (frontend), Render (backend) |

---

## 🚧 Current Limitations & Roadmap

Being upfront about where this stands today:

- Doctor listings currently use seed data rather than a live database table — moving this to a real `doctors` table with admin CRUD is the next step
- Webhook signature verification is fully implemented; persisting the confirmed payment status to the database is in progress
- WebRTC signaling currently supports one active call at a time; room-based isolation (keyed by appointment ID) is needed to support concurrent calls
- No double-booking check yet on appointment slots
- Render's free tier means the backend may take 30–50s to respond after a period of inactivity

Listing these isn't a weakness — it's the honest state of an actively developed solo project, and each item above is a well-understood, scoped next step.

---

## 💻 Local Setup

### Prerequisites
- Java 17+, Node.js 18+, Maven 3.8+

### Backend
```bash
cd backend
cp .env.example .env   # fill in GEMINI_API_KEY, JWT_SECRET, STRIPE keys, DB URL
mvn spring-boot:run    # runs on http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev             # runs on http://localhost:5173
```

---

## 📜 Acknowledgments

Built for HackOrbit 2025. Map tiles courtesy of [OpenStreetMap](https://www.openstreetmap.org).
