# 🌸 SakhiSaathi Backend – PeriodPal API

The **SakhiSaathi Backend** is a comprehensive **Node.js/Express REST API** powering the **PeriodPal** menstrual health companion app. It provides secure user management, cycle and symptom tracking, AI-powered predictions, a community forum, real-time notifications, emergency alerts, and much more.

---

## 📚 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Real-Time Features](#real-time-features)
- [Community System](#community-system)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

- ✅ User Authentication (JWT, Secure Cookies)
- 📆 Cycle & Symptom Tracking
- 🤖 AI-Powered Insights (Gemini/OpenAI Integration)
- 💬 Community Forum (Posts, Comments, Reactions, Notifications)
- 💌 Partner Communication (Email Updates)
- 🚨 Emergency Alerts (SMS/Email, IPFS Backup)
- 📄 PDF Export (Cycle Logs)
- 🔔 Real-Time Notifications (Socket.io)
- 🩺 PCOS Assessment

---

## 🛠️ Tech Stack

- **Node.js & Express** – REST API Server
- **MongoDB & Mongoose** – NoSQL Database & ODM
- **Socket.io** – Real-Time Communication
- **JWT** – Authentication
- **Nodemailer** – Email Notifications
- **Twilio** – SMS Alerts
- **Puppeteer** – PDF Generation
- **Gemini/OpenAI** – AI-Powered Insights
- **IPFS/Pinata** – Decentralized Backup

---

## 🗂 Project Structure

> Organized for scalability and clarity with modular route and controller separation.

```sh
backend/
│
├── app.js                # Main Express app, route setup, middleware, Socket.io
├── server.js             # Entry point for starting the server
├── package.json
├── .env
│
├── config/
│   ├── db.js
│   └── gptConfig.js
│
├── controllers/
│   ├── authController.js
│   ├── communityController.js
│   ├── cycleController.js
│   ├── dashboardController.js
│   ├── emergencyController.js
│   ├── gptController.js
│   ├── insightsController.js
│   ├── partnerController.js
│   ├── periodController.js
│   ├── predictionController.js
│   └── trackerController.js
│
├── middleware/
│   ├── authMiddleware.js
│   └── errorMiddleware.js
│
├── models/
│   ├── community.js
│   ├── Cycle.js
│   ├── EmergencyContact.js
│   ├── Partner.js
│   ├── Period.js
│   ├── PcosAssessment.js
│   ├── Symptom.js
│   ├── TrackerLog.js
│   └── User.js
│
├── routes/
│   ├── authRoutes.js
│   ├── community.js
│   ├── cycleRoutes.js
│   ├── emergencyRoutes.js
│   ├── gptRoutes.js
│   ├── insightsRoutes.js
│   ├── partnerRoutes.js
│   ├── periodRoutes.js
│   ├── pcosAssessment.js
│   ├── predictionRoutes.js
│   └── trackerRoutes.js
│
├── utils/
│   ├── apiFeatures.js
│   ├── asyncHandler.js
│   ├── cycleUtils.js
│   ├── errorResponse.js
│   ├── gptUtils.js
│   ├── ipfs.js
│   ├── mailer.js
│   ├── notification.js
│   └── validators.js
│
├── temp/                 # Temporary files (e.g., PDF exports)
└── README.md

```


---

## 🔗 API Endpoints

All endpoints are prefixed with `/api/`.

| Route Prefix         | Description                                 |
|----------------------|---------------------------------------------|
| `/auth`              | User registration, login, profile           |
| `/tracker`           | Daily logs, cycle tracking                  |
| `/gpt`               | AI-powered Q&A, mood advice, partner msg    |
| `/partner`           | Partner info, send messages                 |
| `/emergency`         | Emergency contacts, alerts                  |
| `/prediction`        | Cycle/symptom predictions                   |
| `/insights`          | Analytics, PDF export                       |
| `/cycles`            | Cycle data, symptom trends                  |
| `/period-tracker`    | Period CRUD                                 |
| `/pcos-assessment`   | PCOS risk assessment                        |
| `/community`         | Forum, posts, comments, notifications       |

---

## 📡 Real-Time Features

> Powered by **Socket.io** for seamless real-time interaction.

- Users join rooms for:
  - Personal notifications
  - Post-specific updates

Example integration in `app.js`:

```js
io.on('connection', (socket) => {
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });
});

```
---

#### 🫂 Community System
* Posts, Comments, Reactions – User-generated content
* Tags & Categories – Organize discussions
* Reports & Moderation – Flag inappropriate content
* Notifications – Replies, reactions, mod actions

##### All community-related routes are prefixed with /api/community.

#### ⚙️ Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/sakhisaathi-backend.git
cd sakhisaathi-backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Fill in the values for MongoDB URI, JWT secrets, API keys, etc.

# 4. Start the server
npm start

# For development with auto-reload
npm run dev


```

----

#### 🤝 Contributing
* Pull requests are welcome!
* For major changes, please open an issue first to discuss what you’d like to modify.

##### Made with ❤️ for women's health and empowerment.


