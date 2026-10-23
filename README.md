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

#### Option A: Direct Cloud Sync (Easiest — Direct in Browser via MetaApi)
1. In the TradeLog Pro web app, navigate to **Connect MT5**.
2. Under the **Cloud Direct Sync** tab, enter:
   - **MT5 Login ID**
   - **Password** (Master or Investor/Read-Only password)
   - **Broker Server Name** (e.g., `Exness-MT5Real`, `MetaQuotes-Demo`)
   - Free **MetaApi Token** (get your free trial token in 30 seconds from [app.metaapi.cloud/token](https://app.metaapi.cloud/token))
3. Click **Connect & Sync MT5 Trades Now** — trades, pips, SL/TP, and Risk:Reward ratios sync directly without keeping any desktop software open!

#### Option B: MT5 Expert Advisor (Local MT5 Terminal)
1. Copy [TradeLogProEA.mq5](file:///c:/Trader%20Log/TradeLog-Pro/mt5/TradeLogProEA.mq5) to your MT5 Terminal's Experts folder:
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
   - Enter your `InpUserId` in the Inputs tab.

#### Option C: Python Sync Script (Local Bridge)
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
