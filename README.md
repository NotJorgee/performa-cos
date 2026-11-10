# PerformaCOS

Web-based Contract of Service (COS) Performance Evaluation, Daily Accomplishment Reporting (DAR), Attendance & Geofencing, and Contract Renewal System.

## Architecture Overview

- **Frontend**: React 18 + Vite (`src/`)
- **Backend**: FastAPI + SQLAlchemy + Alembic (`backend/`)
- **Database & File Storage**: PostgreSQL and Supabase Storage
- **AI Services**: Google Gemini API integration (`backend/app/ai_service.py`) with automatic offline deterministic fallback

---

## Prerequisites

Ensure the following tools are installed:

1. **Git**
2. **Node.js (v18+)** and **npm**
3. **Python (3.10+)** and **pip**
4. **PostgreSQL** database and a **Supabase** project (for Storage buckets)

---

## Local Development Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Performa-COS
```

### 2. Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

Edit `.env` and provide values for `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `JWT_SECRET_KEY`.
- `SMTP_*` and `GEMINI_API_KEY` are optional for local development (emails are skipped when unconfigured, and AI endpoints fall back cleanly to deterministic rules).

### 3. Install Frontend Dependencies
From the project root:
```bash
npm install
```

### 4. Set Up Python Virtual Environment & Backend Dependencies
From the project root:

```bash
python -m venv venv
```

Activate the virtual environment:
- **Windows (PowerShell):**
  ```powershell
  venv\Scripts\Activate.ps1
  ```
- **macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```

Install backend dependencies:
```bash
pip install -r backend/requirements.txt
```

### 5. Initialize Database Schema & Seed Starter Data
*(Skip this step if `.env` already points to an initialized database.)*

From the `backend/` directory, run Alembic migrations and the seeder script:
```bash
cd backend
alembic upgrade head
python seed.py
cd ..
```
Initial administrator credentials and onboarding invitation tokens are printed at the end of `seed.py`.

---

## Running the Application

Run the backend and frontend servers in two separate terminals:

### Terminal 1 — Backend API (`http://127.0.0.1:8000`)
With the Python virtual environment activated:
```bash
cd backend
python run.py
```
Interactive OpenAPI (Swagger) documentation is available at `http://127.0.0.1:8000/docs`.

### Terminal 2 — Frontend Client (`https://localhost:5173`)
From the project root:
```bash
npm run dev
```
Open **`https://localhost:5173`** in a browser.
- **Self-Signed HTTPS Note**: Local development runs over self-signed HTTPS (`@vitejs/plugin-basic-ssl`) so browser camera capture and geolocation APIs operate across desktop and mobile test devices. Accept the browser security prompt once per session when accessing localhost/LAN URLs.

---

## Production Build

Build the optimized static frontend into `dist/`:
```bash
npm run build
```

For separate frontend/backend hosting in production:
- Configure `CORS_ORIGINS` and `APP_FRONTEND_URL` in backend environment variables to match the hosted frontend origin.
- Set `DEBUG=False` and use a strong `JWT_SECRET_KEY`.
- Configure the frontend API client (`src/services/api.js`) or reverse proxy so `/api` routes to the FastAPI backend.

---

## External & Mobile Client Integration

External or mobile clients should interact strictly with the FastAPI REST API (`/api/*`) using `Authorization: Bearer <jwt_token>` headers rather than connecting directly to PostgreSQL.

- **API Reference**: `http://127.0.0.1:8000/docs`
- **Client Request Examples**: `src/services/api.js`
- **Local Network Access**: Bind FastAPI to all interfaces when testing from mobile devices or emulators:
  ```bash
  cd backend
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```
  - Physical device on the same LAN: `http://<HOST_LAN_IP>:8000/api`
  - Android Emulator: `http://10.0.2.2:8000/api`
  - iOS Simulator: `http://127.0.0.1:8000/api`

---

## Troubleshooting

- **`alembic` command not found**: Ensure the Python virtual environment is active and re-run `pip install -r backend/requirements.txt`.
- **PowerShell script execution policy error**: Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or invoke Python directly via `venv\Scripts\python.exe`.
- **Camera or geolocation blocked on mobile browser**: Access the Vite dev server over `https://<HOST_LAN_IP>:5173` rather than plain `http://`.
