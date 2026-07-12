# Project Delhi

Project Delhi is a modern, responsive community collaboration platform designed to empower and coordinate volunteer initiatives across India's capital. Developed as an initiative of the **Naksh Foundation**, the platform facilitates the creation of community campaigns (cleanups, educational drives, relief distributions), manages volunteering registries, processes newsletter subscriptions, and hosts a structured manual donation reporting and verification system with automated 80G tax receipt issuance.

---

## 🌟 Key Features

### 1. Proposal Campaign System
*   **Raise Proposals**: Registered users can submit detailed campaign proposals (cleanups, relief drives, cyber safety seminars) specify locations on an interactive Leaflet map, schedule event dates, and define volunteer requirements.
*   **Moderator Lifecycle**: Core moderators can review pending proposals, request revisions/clarifications, or approve them to go live.
*   **Real-time Notifications**: Automated email alerts update proposers on approval stages, moderator questions, and capacity achievements.

### 2. Volunteer Pool & Event Sign-ups
*   **Task Registrations**: Volunteers can sign up for specific, active campaigns. 
*   **General Volunteer Pool**: Users can register in a general volunteer registry, specifying preferred roles and localities.
*   **Admin Panel**: Core administrators can view registered volunteers, track activity metrics, and export data directly as CSV files.

### 3. Manual Donation Verification Flow (80G Tax Exemption)
*   **Pill-Tab Payment UI**: Sleek, above-the-fold interface allowing users to toggle between Google Pay (UPI QR Code) and Direct Bank Transfer (NEFT/IMPS) details.
*   **Report Transfer Form**: Nested inside the details card, enabling users to submit their transaction reference IDs.
*   **Immediate Acknowledgement**: Triggers an automated email to the donor confirming receipt of report details.
*   **Admin Approval**: Administrators verify transaction IDs, approving or rejecting submissions. Approved transfers trigger professional, automated PDF-friendly tax receipts via email.

---

## 🛠️ Technology Stack

### Frontend
*   **Core**: React 18, TypeScript, Vite
*   **Styling**: Vanilla CSS (Premium Dark/Glassmorphic Themes)
*   **Maps & Icons**: Leaflet (OpenStreetMap integration), Lucide React

### Backend
*   **Core**: Node.js, Express
*   **Database**: MongoDB Atlas (Mongoose ORM)
*   **Email Engine**: Nodemailer (integrated with Mailrelay SMTP)

---

## 📁 Directory Structure

```text
projectdelhi/
├── backend/
│   ├── config/             # Database connection & SMTP mailer transporter
│   ├── models/             # Mongoose schemas (Donation, Task, User, VolunteerApp, etc.)
│   ├── routes/             # Express API routing logic (authRoutes, appRoutes, taskRoutes)
│   ├── .env.example        # Reference file for backend environment variables
│   ├── package.json
│   └── server.js           # Server bootstrapper & core team seeder
├── frontend/
│   ├── public/             # Production static assets (videos, logo, active payment QR)
│   ├── src/
│   │   ├── components/     # Global layout components (Navbar, Protected Routes)
│   │   ├── pages/          # Page layouts (Admin, Browse, Donate, Home, Legal Policies)
│   │   ├── store.ts        # Global frontend state, API client & auth handlers
│   │   ├── App.tsx         # Main entry point & React routing configurations
│   │   └── index.css       # Core design tokens, gradients & responsive styling
│   ├── package.json
│   └── tsconfig.json
└── raw_assets/             # Original raw design vectors, backup images, and archives
```

---

## 🚀 Installation & Local Setup

### Prerequisites
*   Node.js (v18 or higher recommended)
*   MongoDB Instance (Local or Atlas Connection URI)
*   SMTP Server Credentials (e.g. Mailrelay)

### Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the reference parameters:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=5001
   GOOGLE_CLIENT_ID=your_google_auth_client_id
   
   # SMTP Configurations
   SMTP_HOST=smtp1.s.ipzmarketing.com
   SMTP_PORT=587
   SMTP_USER=your_smtp_auth_user
   SMTP_PASS=your_smtp_auth_password
   SMTP_FROM="Project Delhi <team@projectdelhi.org>"
   ADMIN_EMAIL=hello@projectdelhi.org
   ```
4. Start the server:
   ```bash
   npm run start
   ```

### Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build or run the development server:
   ```bash
   # Run development dev-server
   npm run dev
   
   # Compile production bundle
   npm run build
   ```

---

## 🔒 Security & Policy Layouts
All activities on Project Delhi align with transparent operational protocols:
*   **Privacy Policy**: Outlines data collection, volunteer metrics, and donor privacy.
*   **Terms of Service**: Regulates platform usage rules, safety compliance, and intellectual property.
*   **Donation Policy**: Defines Section 80G tax eligibility, utilization of funds, and refund terms.

All policy configurations feature anchor-linked layouts and scroll offset calculations to ensure a smooth, single-page navigation layout.