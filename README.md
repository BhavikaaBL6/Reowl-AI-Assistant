# Reowl • AI Academic Hub
> An advanced, AI-driven academic assistant designed to streamline student productivity with intelligent insights and automated study tools.

**🚀 Live Demo:** [https://reowl.onrender.com](https://reowl.onrender.com)

---

## 🌟 Key Features
* **Reo's Academic Insights:** Personalized study recommendations based on performance metrics.
* **Intelligent Chat & Buddy:** Real-time academic assistance powered by Gemini AI with custom prompt engineering.
* **Automated Note Generation:** Transforms raw study materials into structured academic notes.
* **Key Rotation System:** A custom-built backend proxy to manage multiple API keys, ensuring high availability and bypassing rate limits.
* **Stress & Performance Tracking:** Biometric-style live analysis of student workload.

## 🛠️ Tech Stack
* **Frontend:** React, Vite, TypeScript, Tailwind CSS
* **Backend:** Node.js (Express) Proxy Server
* **AI:** Google Gemini Pro API (with custom key-rotation logic)
* **Deployment:** Render (CI/CD via GitHub)

## 🏗️ Architecture
This project implements a secure backend proxy (`server.ts`) to handle API requests. This architecture hides sensitive API keys from the client-side and allows for **Dynamic Key Rotation**, making the application robust against high traffic and API quota restrictions.

## 💻 Local Setup
1. Clone the repo: `git clone https://github.com/BhavikaaBL6/Reowl-AI-Assistant.git`
2. Install dependencies: `npm install`
3. Configure Environment: Create a `.env` file with your `GEMINI_API_KEY`.
4. Run: `npm run dev`
