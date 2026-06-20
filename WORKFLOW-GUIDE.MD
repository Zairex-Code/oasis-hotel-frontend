# 🗺️ Next.js + Tailwind v4 + Java Spring Boot: Enterprise Workflow Guide

Welcome to the **Oasis Enterprise Blueprint**. This document serves as a comprehensive, step-by-step methodology for building highly scalable, secure, and visually premium frontend architectures using Next.js (App Router), Tailwind CSS v4, and Axios, designed to interface seamlessly with stateless Java Spring Boot backends.

Use this guide as a template (boilerplate) for any future projects utilizing this tech stack.

---

## 🏗️ Phase 1: Scaffolding & Foundational Setup

### 1. Project Initialization
Start by bootstrapping a fresh Next.js environment with TypeScript and Tailwind CSS.
```bash
npx create-next-app@latest my-enterprise-app --typescript --tailwind --eslint
cd my-enterprise-app
```

### 2. UI Component Library Integration (Shadcn UI)
Instead of building standard components from scratch, leverage Shadcn UI for accessible, unstyled primitives, then heavily customize them.

```bash
npx shadcn@latest init
# Install core dependencies as needed:
npx shadcn@latest add button card input select dialog dropdown-menu
```

### 3. The "CSS Hammer" (Tailwind v4 Configuration)
Tailwind v4 abandons `tailwind.config.js` in favor of native CSS variables. To ensure a cohesive corporate identity (e.g., preventing component libraries from forcing pill-shaped buttons), override the base variables in `src/app/globals.css`.

**Key Paradigm:** Unify the border-radius globally.

```css
/* src/app/globals.css */
@theme inline {
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);
}

@layer base {
  :root {
    /* Define dynamic color spaces (OKLCH recommended) */
    --primary: oklch(0.6723 0.1606 244.9955);
    /* The Golden Rule: Unified Border Radius */
    --radius: 0.375rem; 
  }
  
  /* Force all critical UI elements to adhere to the corporate radius */
  input, select, button, [role="button"] {
    border-radius: var(--radius) !important;
  }
}
```

## 🔐 Phase 2: Network Layer & Edge Security
Building a resilient communication layer with a stateless backend requires strict interceptors and edge-runtime middleware.

### 1. The Axios Interceptors (`src/lib/api.ts`)
Never pass JWT tokens manually in components. Create an Axios instance that intercepts all inbound and outbound traffic.

* **Inbound Guard:** Intercepts every `api.get()` or `api.post()`, retrieves the JWT from localStorage, and injects it into the Authorization header using the `config.headers.set()` method (Crucial for Axios v1.x compatibility).
* **Outbound Guard:** Listens for 401 Unauthorized responses from Spring Boot. If detected, it immediately purges the client session and executes a `window.location.href` to safely route the user back to the login screen without React state corruption.

### 2. Next.js Edge Middleware (`src/middleware.ts`)
Do not rely solely on React Context for route protection. Implement a `middleware.ts` file at the root.

* Extract the HTTP-Only/Standard cookie containing the token.
* Enforce RBAC (Role-Based Access Control) by intercepting requests to `/admin/*` and verifying token existence before the page even renders.

## 🎨 Phase 3: The Architectural Layout (Glassmorphism)
The visual hallmark of this blueprint is the Glassmorphism design language.

### 1. The Hover-Expandable Sidebar (`src/components/Sidebar.tsx`)
Create a persistent navigation component that utilizes Tailwind's `group` utilities.

* Default state: `w-20` (Icons only).
* Hover state: `hover:w-64` (Expands smoothly, revealing text via `group-hover:opacity-100`).

### 2. The Floating Topbar (`src/app/(dashboard)/layout.tsx`)
Instead of a static top border, utilize absolute positioning and deep background blur to create a "Floating Island" effect.

* Classes: `absolute top-0 w-full z-40 bg-card/60 backdrop-blur-2xl`.
* This allows the main content (tables, charts) to slide elegantly underneath the blurred navigation bar.

## ⚡ Phase 4: Secure Data Mutations & Form Handling
The most common failure point in Next.js + Spring Boot integrations is improper form submission handling.

### The Asynchronous Controlled Form Pattern
Never use native HTML `<form action="...">` in Next.js Client Components (`"use client"`) unless utilizing Server Actions. Doing so will trigger a full page reload, dropping the React state and corrupting the Axios request.

**Best Practice:**
1. Bind the form to an `onSubmit` handler.
2. Immediately invoke `e.preventDefault()`.
3. Extract payload data via `new FormData(e.currentTarget)`.
4. Ensure all strict parameters required by the Java Backend (e.g., `@NotNull` fields) are bundled into the final Payload object before dispatching the `api.post()` or `api.put()`.

**Example:**

```typescript
const handleUpdateEntity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);
    
    try {
        const payload = {
            id: entity.id,
            name: formData.get("name"),
            // Always inject immutable fields if the Backend DTO demands them
            immutableField: entity.immutableField 
        };
        await api.put(`/endpoint/${entity.id}`, payload);
        fetchData(); // Trigger local state synchronization
    } catch (error) {
        console.error("Payload Validation Fault", error);
    } finally {
        setIsUpdating(false);
    }
};
```

## 🚀 Phase 5: The "Click-to-Action" UX Paradigm
Enterprise applications should minimize navigation friction. Implement deep UI interactivity:

* **Row-Level Modals:** Instead of requiring users to click a tiny "Edit" button, make the entire data table row interactive (`cursor-pointer hover:bg-accent/20`). Bind the row's `onClick` event to trigger a large, luxurious Dialog modal (`max-w-[600px]`) containing the necessary forms.
* **Debounced Async Search:** For relational mapping (e.g., assigning a Guest to a Room), do not load 10,000 users into a dropdown. Implement an `<Input>` field with a `setTimeout` (300ms debounce) that queries the backend (`/search?name=...`) only after the user stops typing, rendering a floating dropdown of results.

---

This guide represents the refined engineering standards required to build modern, high-performance web applications within the Oasis Architectural Blueprint.