# TradeLog Pro — Trading Journal

A professional Forex trading journal with AI analytics and MetaTrader 5 integration.

## 📁 Project Structure

```
Trading Journal/
├── frontend/        ← React.js app (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   └── lib/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env         ← VITE_ variables only
│
├── backend/         ← Node.js + Express API server
│   ├── index.js
│   ├── package.json
│   └── .env         ← DB, GROQ, PORT variables
│
├── mt5/             ← MT5 Integration Files
│   ├── TradeLogProEA.mq5 ← MQL5 Expert Advisor (Recommended)
│   ├── mt5_bridge.py     ← Python MT5 bridge script (Alternative)
│   ├── mt5_diagnostics.py
│   └── mt5_inspect.py
│
├── supabase_setup.sql  ← Run once to create DB tables
├── .gitignore
└── README.md
```

## 🚀 Running the Project

### 1. Frontend (React App)
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### 2. Backend (Express Server)
```bash
cd backend
npm install
node index.js
# Runs at http://localhost:5000
```

### 3. MT5 Integration (Choose One)

#### Option A: MT5 Expert Advisor (Recommended — No installation required)
1. Copy [TradeLogProEA.mq5](file:///c:/Trading%20Journal/mt5/TradeLogProEA.mq5) to your MT5 Terminal's Experts folder:
   - In MT5, go to **File** -> **Open Data Folder**.
   - Navigate to `MQL5/Experts/`.
   - Paste `TradeLogProEA.mq5` into this folder.
2. Compile the EA:
   - Double-click `TradeLogProEA.mq5` to open it in MetaEditor.
   - Click **Compile** at the top.
3. Configure MT5 WebRequest permission:
   - In MT5, go to **Tools** -> **Options** (`Ctrl+O`) -> **Expert Advisors**.
   - Check **Allow WebRequest for listed URL**.
   - Add your API URL: `http://localhost:5000` (or your production API URL).
4. Run the EA:
   - Drag `TradeLogProEA` from the Navigator panel to any active chart.
   - Enter your `InpUserId` (get this from the Profile page of your Trading Journal app) in the Inputs tab.

#### Option B: Python Sync Script (Alternative)
```bash
# Open MetaTrader 5 first, then:
cd mt5
python mt5_bridge.py
```

## 🔑 Environment Variables

### `frontend/.env`
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### `backend/.env`
```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=db.xxxx.supabase.co
DB_NAME=postgres
DB_PORT=5432
GROQ_API_KEY=gsk_xxx...
PORT=5000
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite |
| Styling | Vanilla CSS |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Groq API (LLaMA 3.3) |
| Charts | Recharts |
| MT5 Sync | MQL5 Expert Advisor (or Python) |
