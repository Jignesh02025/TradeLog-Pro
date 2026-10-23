import React, { useState, useEffect } from 'react'
import { 
  Cloud, Terminal, ShieldCheck, Zap, Info, Copy, Check, Eye, EyeOff, 
  RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Server, Key, User, 
  Calendar, ArrowRight, Lock
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const POPULAR_SERVERS = [
  'MetaQuotes-Demo',
  'Exness-MT5Real',
  'Exness-MT5Real2',
  'ICMarketsSC-Live',
  'ICMarketsSC-Demo',
  'FTMO-Server',
  'XMGlobal-MT5',
  'Forex.com-Live'
]

const ConnectMT5 = ({ onSyncSuccess, onNavigate }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('cloud') // 'cloud' | 'local'
  const [copied, setCopied] = useState(false)

  // Cloud Sync Form State
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [server, setServer] = useState('')
  const [syncDays, setSyncDays] = useState('90')
  const [metaApiToken, setMetaApiToken] = useState(() => localStorage.getItem('metaapi_token') || '')
  const [saveToken, setSaveToken] = useState(true)

  // Status & Progress State
  const [hasServerToken, setHasServerToken] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncStep, setSyncStep] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  // Check backend configuration on mount
  useEffect(() => {
    fetch(`${apiUrl}/api/mt5/config`)
      .then(res => res.json())
      .then(data => {
        if (data?.hasServerToken) {
          setHasServerToken(true)
        }
      })
      .catch(() => {
        // Backend offline or unreachable
      })
  }, [apiUrl])

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCloudSync = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!login || !password || !server) {
      setError('Please provide your MT5 Account ID, Password, and Broker Server Name.')
      return
    }

    if (!hasServerToken && !metaApiToken.trim()) {
      setError('MetaApi Token is required. Sign up at app.metaapi.cloud to get your free token in 30 seconds.')
      return
    }

    if (saveToken && metaApiToken.trim()) {
      localStorage.setItem('metaapi_token', metaApiToken.trim())
    }

    setSyncing(true)
    setSyncStep('Connecting to MetaApi Cloud Terminal...')

    // Simulated progress steps for better UX
    const stepTimer1 = setTimeout(() => {
      setSyncStep('Authenticating with Broker & Syncing Deals...')
    }, 4000)

    const stepTimer2 = setTimeout(() => {
      setSyncStep('Calculating Pips, Risk:Reward & Importing to Journal...')
    }, 12000)

    try {
      const response = await fetch(`${apiUrl}/api/mt5/cloud-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id,
          login: login.trim(),
          password: password.trim(),
          server: server.trim(),
          metaApiToken: metaApiToken.trim() || undefined,
          syncDays: parseInt(syncDays, 10) || 90
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to sync MT5 trades.')
      }

      setResult({
        success: true,
        count: data.count || 0,
        message: data.count > 0 
          ? `Successfully imported ${data.count} trades into your journal!` 
          : 'Connected successfully, but no closed trades were found in the selected date range.'
      })

      // Notify parent to refresh journal trades list
      if (onSyncSuccess) {
        onSyncSuccess()
      }

    } catch (err) {
      console.error('Cloud Sync Error:', err)
      setError(err.message || 'Connection failed. Please verify your credentials and broker server.')
    } finally {
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      setSyncing(false)
      setSyncStep('')
    }
  }

  return (
    <div className="fade-in page-content" style={{ padding: '32px 36px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Zap size={28} className="gradient-text" /> 
          Connect MetaTrader 5
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15, maxWidth: 680, lineHeight: 1.5 }}>
          Directly import your trades into TradeLog Pro with automatic calculation of pips, Risk:Reward ratio, and profit/loss.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        borderBottom: '1px solid var(--border-color)', 
        marginBottom: 28,
        paddingBottom: 2
      }}>
        <button
          onClick={() => setActiveTab('cloud')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
            background: activeTab === 'cloud' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
            color: activeTab === 'cloud' ? 'var(--accent-blue)' : 'var(--text-muted)',
            borderBottom: activeTab === 'cloud' ? '2px solid var(--accent-blue)' : '2px solid transparent'
          }}
        >
          <Cloud size={18} />
          Cloud Direct Sync (No Software Needed)
          <span style={{ 
            fontSize: 10, 
            padding: '2px 6px', 
            borderRadius: 6, 
            background: 'rgba(16, 185, 129, 0.2)', 
            color: 'var(--accent-green)',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            Recommended
          </span>
        </button>

        <button
          onClick={() => setActiveTab('local')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
            background: activeTab === 'local' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
            color: activeTab === 'local' ? 'var(--accent-blue)' : 'var(--text-muted)',
            borderBottom: activeTab === 'local' ? '2px solid var(--accent-blue)' : '2px solid transparent'
          }}
        >
          <Terminal size={18} />
          Local Windows Sync (Python / EA)
        </button>
      </div>

      {/* TAB 1: CLOUD DIRECT SYNC */}
      {activeTab === 'cloud' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, alignItems: 'start' }}>
          
          {/* Main Sync Form */}
          <div className="glass-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Cloud size={20} color="var(--accent-blue)" />
                MT5 Account Credentials
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-green)' }}>
                <ShieldCheck size={16} /> Read-Only Safe
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Enter your MT5 login details. Our cloud connector securely connects to your broker to fetch all deal history.
            </p>

            <form onSubmit={handleCloudSync} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Login ID */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  MT5 Account Number / Login ID <span style={{ color: 'var(--accent-red)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 51234567"
                    value={login}
                    onChange={e => setLogin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Password <span style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <span style={{ fontSize: 11, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lock size={12} /> Investor (Read-Only) password recommended
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter MT5 Master or Investor password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 40px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 11,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Server Name */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Broker Server Name <span style={{ color: 'var(--accent-red)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Server size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    list="broker-servers"
                    placeholder="e.g. Exness-MT5Real or MetaQuotes-Demo"
                    value={server}
                    onChange={e => setServer(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      outline: 'none'
                    }}
                  />
                  <datalist id="broker-servers">
                    {POPULAR_SERVERS.map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                {/* Server Quick Presets */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Popular:</span>
                  {['MetaQuotes-Demo', 'Exness-MT5Real', 'ICMarketsSC-Live', 'FTMO-Server'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setServer(s)}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sync Period */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  History Time Range
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                  <select
                    value={syncDays}
                    onChange={e => setSyncDays(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days (Recommended)</option>
                    <option value="180">Last 6 Months</option>
                    <option value="365">Last 1 Year</option>
                  </select>
                </div>
              </div>

              {/* MetaApi Token Section */}
              <div style={{ 
                marginTop: 6, 
                padding: '14px', 
                background: 'rgba(255, 255, 255, 0.02)', 
                borderRadius: 8, 
                border: '1px solid var(--border-color)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    MetaApi Free Token {hasServerToken && <span style={{ color: 'var(--accent-green)' }}>(Configured on Server)</span>}
                  </label>
                  <a
                    href="https://app.metaapi.cloud/token"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                  >
                    Get Free Token <ExternalLink size={11} />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder={hasServerToken ? "Using server token (or paste custom token)" : "Paste your free MetaApi Token here"}
                  value={metaApiToken}
                  onChange={e => setMetaApiToken(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Error Notice */}
              {error && (
                <div style={{ 
                  padding: '12px 16px', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  borderRadius: 8, 
                  color: 'var(--accent-red)',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>{error}</div>
                </div>
              )}

              {/* Success Result */}
              {result && (
                <div style={{ 
                  padding: '16px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)', 
                  borderRadius: 8, 
                  color: 'var(--accent-green)',
                  fontSize: 13
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                    <CheckCircle2 size={18} /> Sync Complete!
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
                    {result.message}
                  </p>
                  {result.count > 0 && onNavigate && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => onNavigate('trades')}
                        style={{
                          background: 'var(--accent-blue)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 14px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        View Trades <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('dashboard')}
                        style={{
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 6,
                          padding: '6px 14px',
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        Dashboard
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sync Button */}
              <button
                type="submit"
                disabled={syncing}
                style={{
                  marginTop: 8,
                  padding: '14px',
                  borderRadius: 8,
                  background: syncing ? 'var(--accent-blue-dark)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 15,
                  border: 'none',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                  transition: 'all 0.2s'
                }}
              >
                {syncing ? (
                  <>
                    <RefreshCw size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                    {syncStep || 'Syncing MT5 Trades...'}
                  </>
                ) : (
                  <>
                    <Zap size={18} /> Connect & Sync MT5 Trades Now
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: How it Works & Free Trial Guide */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Free Trial Setup Card */}
            <div className="glass-card" style={{ padding: 22, border: '1px solid rgba(59, 130, 246, 0.25)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-blue)', marginBottom: 14 }}>
                <Cloud size={20} />
                <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  MetaApi Free Trial Setup
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                MetaApi provides a <strong>100% free developer tier</strong> allowing you to connect your MT5 account directly in the browser:
              </p>

              <ol style={{ paddingLeft: 18, margin: 0, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li>
                  Go to <a href="https://app.metaapi.cloud/token" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>app.metaapi.cloud</a> and create a free account (no credit card needed).
                </li>
                <li>
                  Click on <strong>API Access</strong> or <strong>Token</strong> to generate your free authorization token.
                </li>
                <li>
                  Paste it in the token box or add <code style={{ color: 'var(--accent-blue)', fontFamily: 'monospace' }}>METAAPI_TOKEN=...</code> to your <code style={{ fontFamily: 'monospace' }}>backend/.env</code> file.
                </li>
              </ol>
            </div>

            {/* Security Guarantee Card */}
            <div className="glass-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-green)', marginBottom: 12 }}>
                <ShieldCheck size={20} />
                <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Investor Password Security
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                You can use your broker's <strong>Investor (Read-Only) Password</strong>. This password only grants read permissions to trade history. No orders can be opened, modified, or closed, ensuring 100% safety for your capital.
              </p>
            </div>

            {/* Automatic Calculations Card */}
            <div className="glass-card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} color="var(--accent-yellow)" /> What Gets Imported
              </h3>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Exact Entry & Exit execution prices',
                  'Net Profit / Loss (including Commissions & Swaps)',
                  'Pip calculation (tailored for Forex, JPY & Gold)',
                  'Stop Loss & Take Profit levels',
                  'Risk to Reward ratio (R:R)',
                  'Deduplication (updates existing trades without creating duplicates)'
                ].map((item, idx) => (
                  <li key={idx} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                    <div style={{ minWidth: 4, height: 4, borderRadius: '50%', background: 'var(--accent-blue)', marginTop: 6, flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: LOCAL WINDOWS SYNC (PYTHON / EA) */}
      {activeTab === 'local' && (
        <div className="connect-mt5-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Step 1: Preparation */}
            <section className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>1</div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Preparation</h2>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Ensure you have Python installed on your Windows machine with the MetaTrader5 library:
              </p>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                <code style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  pip install MetaTrader5 requests python-dotenv
                </code>
              </div>
            </section>

            {/* Step 2: Bridge Script */}
            <section className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>2</div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Your Journal User ID</h2>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Set this User ID inside your <code style={{ color: 'var(--accent-blue)' }}>mt5/.env</code> or script:
              </p>
              
              <div style={{ 
                background: 'rgba(59, 130, 246, 0.05)', 
                border: '1px dashed rgba(59, 130, 246, 0.3)', 
                padding: '16px', 
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(59, 130, 246, 0.7)', textTransform: 'uppercase', marginBottom: 4 }}>Your Unique User ID</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {user?.id || 'Not Signed In'}
                  </div>
                </div>
                <button 
                  onClick={copyUserId}
                  className="btn-edit" 
                  style={{ padding: '8px 12px', fontSize: 12, minWidth: 90, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                >
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy ID</>}
                </button>
              </div>
            </section>

            {/* Step 3: Run */}
            <section className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>3</div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Run Local Sync</h2>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Keep MetaTrader 5 open on Windows and run the bridge script:
              </p>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                <code style={{ fontSize: 13, color: '#10b981', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  cd mt5 &amp;&amp; python mt5_bridge.py
                </code>
              </div>
            </section>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Status Card */}
            <div className="glass-card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(5,150,105,0.05) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#10b981', marginBottom: 16 }}>
                <ShieldCheck size={20} />
                <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase' }}>Local Endpoint Ready</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                The server accepts incoming trade batches at <code style={{ color: 'var(--accent-blue)' }}>/api/trades/bulk</code>.
              </div>
            </div>

            {/* Tips Card */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={16} color="var(--accent-blue)" /> Tips
              </h3>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                  <div style={{ minWidth: 4, height: 4, borderRadius: '50%', background: 'var(--accent-blue)', marginTop: 6, flexShrink: 0 }} />
                  You can set up Windows Task Scheduler to run the script hourly for automated journaling.
                </li>
                <li style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                  <div style={{ minWidth: 4, height: 4, borderRadius: '50%', background: 'var(--accent-blue)', marginTop: 6, flexShrink: 0 }} />
                  Or attach <code style={{ color: 'var(--accent-blue)' }}>TradeLogProEA.mq5</code> directly to any chart in MT5.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectMT5
