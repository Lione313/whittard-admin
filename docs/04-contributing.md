# Getting Started — Whittard Admin

Everything you need to clone and run this project locally.

---

## Prerequisites

Before anything, make sure you have the following installed:

| Tool | Version | Download |
| :--- | :--- | :--- |
| Node.js | >= 20.x (LTS) | https://nodejs.org |
| Angular CLI | >= 18.x | see below |

---

## 1. Install Angular CLI

This is a global tool you only need to install once on your machine.

```bash
npm install -g @angular/cli
```

Verify it works:

```bash
ng --version
```

---

## 2. Clone the repository

```bash
git clone https://github.com/your-org/whittard-admin.git
cd whittard-admin
```

---

## 3. Install dependencies

```bash
npm install
```

---

## 4. Set up environment variables

The project includes two environment files:

```
src/environments/
├── environment.ts                 ← local development (localhost)
└── environment.development.ts     ← development server
```

`environment.ts` already points to `http://localhost:8000/api` by default. If your Laravel backend runs on a different port, update `apiUrl` there.

---

## 5. Run the project

```bash
ng serve
```

Open your browser at `http://localhost:4200`.

The app will reload automatically when you make changes to the code.

---

## Useful commands

| Command | What it does |
| :--- | :--- |
| `ng serve` | Start the dev server |
| `ng build` | Build for production |
| `ng build --configuration development` | Build for development server |
| `npm install <package>` | Install a new dependency |

---

## Backend

This frontend connects to a **Laravel 13** backend. Make sure the API is running locally before starting the Angular app, otherwise requests will fail.

Refer to the backend repository for its own setup instructions.