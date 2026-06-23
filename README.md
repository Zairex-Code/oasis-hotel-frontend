# 🌴 Oasis Hospitality Group - Enterprise Frontend
<img width="1890" height="956" alt="image" src="https://github.com/user-attachments/assets/043aae1f-c1ce-4d34-aa80-104865bffa99" />


> A world-class, enterprise-grade Hotel Management Dashboard. Built for speed, security, and absolute visual elegance using Next.js, Tailwind CSS v4, and a custom Glassmorphism UI.

Welcome to the **Oasis Hotel Frontend** repository! 👋 

This isn't just another admin panel. We built this project from the ground up to serve as a **highly scalable, secure, and visually stunning boilerplate** for hospitality management. It features Role-Based Access Control (RBAC), real-time ledger mutations, and an incredibly polished Glassmorphism design language.

---

## ✨ Key Features

- **🛡️ Edge-Runtime Security**: Next.js Middleware protects private routes at the edge, while strict Axios interceptors handle JWT injections and gracefully catch 401 Unauthorized errors to prevent client-side desyncs.
- **🎨 Glassmorphism & OKLCH**: A unified, premium design language. We ditched aggressive borders for a sleek `rounded-md` standard, layered with `backdrop-blur` effects and dynamic OKLCH color spaces that adapt flawlessly to Light and Dark modes.
- **⚡ Instant Booking Engine**: A debounced, asynchronous search engine allows managers to find guests and lock in reservations directly from the room inventory table.
- **📊 Real-Time Analytics**: Beautiful, interactive charts powered by Recharts to track booking velocity and financial metrics.
- **👥 Advanced RBAC**: Distinct clearance levels (`ADMIN`, `HOTEL_MANAGER`, `CUSTOMER`) dynamically alter the UI, rendering specific administrative actions only for authorized personnel.

---

## 🛠️ Tech Stack

We chose a modern, future-proof stack to ensure maximum performance and developer experience:

* **Framework:** [Next.js (App Router)](https://nextjs.org/) + React 19
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Using inline `@theme` directives for zero-config lightning-fast builds)
* **Components:** Custom tailored [Shadcn UI](https://ui.shadcn.com/) (Refactored for corporate `rounded-md` standards)
* **Data Fetching & Networking:** [Axios](https://axios-http.com/) (With robust Request/Response interceptors)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Charts:** [Recharts](https://recharts.org/)

---

## 🚀 Getting Started

Follow these instructions to get the Oasis ecosystem running on your local machine.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/oasis-hotel-frontend.git
cd oasis-hotel-frontend
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and connect it to your Spring Boot Backend API:

```env
# Point this to your Java Spring Boot local or production server
NEXT_PUBLIC_API_URL=http://localhost:8001/v1/api
```

### 4. Fire it up! 🔥
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📸 System Modules & Previews
Here is a quick tour of what the platform can do:

### 🏝️ Public Gateway (Landing Page)
A high-converting, immersive landing page fetching the top-rated branches directly from the public backend APIs.

<img width="400" height="202" alt="simplescreenrecorder-2026-06-22_23 27 08" src="https://github.com/user-attachments/assets/bdc4f3a2-9871-4730-ad4b-f02f2d40e2e1" />


### 🔐 Secure Identity Access (Login)
Handles JWT extraction, saves session context securely, and forces hard-redirects to bypass React race conditions.
<img width="400" height="202" alt="simplescreenrecorder-2026-06-22_23 40 23" src="https://github.com/user-attachments/assets/29af0cfc-ac81-4ae9-8553-acb3ce003a5d" />


### 🏢 Ecosystem Branches (Hotels)
Full CRUD operations utilizing controlled asynchronous forms. Includes live-toggling of branch operational status.
<img width="400" height="202" alt="simplescreenrecorder-2026-06-22_23 41 54" src="https://github.com/user-attachments/assets/afbfc1df-1d19-4aea-8949-d0aa8bdf0f30" />


### 🛏️ Inventory Management (Rooms)
Linked intrinsically to Hotel entities. Features our signature "Click-to-Book" modal with an async guest search engine.
<img width="400" height="202" alt="simplescreenrecorder-2026-06-22_23 43 02" src="https://github.com/user-attachments/assets/eeb0af06-d6c1-4642-8b71-33340afb22a6" />


### 📅 Global Ledger (Reservations)
Track, audit, and mutate reservation lifecycles (Pending, Confirmed, Completed, Cancelled) across the entire network.
<img width="400" height="202" alt="simplescreenrecorder-2026-06-22_23 45 01" src="https://github.com/user-attachments/assets/f68fac8f-eb91-438a-b834-86fc51323299" />


## 🏗️ Architectural Highlights for Developers
If you are a developer looking through the code, here are a few cool things we implemented:

* **The Topbar "Floating Island":** Check out `src/app/(dashboard)/layout.tsx`. We used absolute positioning and deep blur effects so table data gracefully slides underneath the navigation bar.
* **The JWT Interceptors:** Inside `src/lib/api.ts`, we implemented an Outbound Guard. If the Spring Boot backend throws a 401 Unauthorized, Axios instantly catches it, flushes the local storage, and kicks the user out safely before the UI breaks.
* **The CSS Hammer:** In `src/app/globals.css`, we used a global `!important` rule on `--radius` to override default component libraries, ensuring a strict, cohesive corporate design system across 100% of the UI.

## 🤝 Contributing
This project is currently the Frontend core of the Oasis Ecosystem. If you'd like to contribute, please fork the repository and use a feature branch. Pull requests are warmly welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Built with ❤️ and a lot of coffee.
