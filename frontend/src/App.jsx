import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import AddTrade from './pages/AddTrade'
import TradeList from './pages/TradeList'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import ConnectMT5 from './pages/ConnectMT5'
import TradeDetailsPage from './pages/TradeDetailsPage'
import HelpGuide from './pages/HelpGuide'
import Auth from './pages/Auth'
import ImportModal from './components/ImportModal'
import useTrades from './hooks/useTrades'
import { Menu, Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AIChat from './components/AIChat'

const AppContent = () => {
  const [page, setPage] = useState('dashboard')
  const [navData, setNavData] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  
  const { user, loading: authLoading } = useAuth()
  const { 
    trades, settings, setSettings, addTrade, updateTrade, 
    deleteTrade, importTrades, clearAllTrades, stats, loading: tradesLoading 
  } = useTrades()

  const navigate = (p, data = null) => {
    setPage(p)
    setNavData(data)
    setSidebarOpen(false)
  }

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <Loader2 size={32} className="spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-blue)' }} />
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard trades={trades} stats={stats} settings={settings} onNavigate={navigate} />
      case 'add-trade':
        return <AddTrade onAdd={addTrade} />
      case 'trades':
        return <TradeList trades={trades} settings={settings} onUpdate={updateTrade} onDelete={deleteTrade} onNavigate={navigate} />
      case 'view-trade':
        return <TradeDetailsPage trade={navData} settings={settings} onBack={() => navigate('trades')} />
      case 'analytics':
        return <Analytics trades={trades} stats={stats} settings={settings} />
      case 'settings':
        return <Settings settings={settings} onUpdateSettings={setSettings} onClearData={clearAllTrades} />
      case 'help':
        return <HelpGuide />
      case 'connect-mt5':
        return <ConnectMT5 />
      default:
        return <Dashboard trades={trades} stats={stats} settings={settings} onNavigate={navigate} />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar - hidden on mobile via CSS */}
      <Sidebar activePage={page} onNavigate={navigate} onOpenImport={() => setImportOpen(true)} />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-mobile-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="sidebar-mobile-panel" onClick={e => e.stopPropagation()}>
            <Sidebar activePage={page} onNavigate={navigate} onOpenImport={() => { setImportOpen(true); setSidebarOpen(false); }} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', minWidth: 0 }}>
        {/* Mobile top bar — hidden via CSS on desktop, flex on mobile */}
        <div className="mobile-topbar" style={{
          alignItems: 'center', gap: 12,
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'linear-gradient(180deg, #0c1322 0%, #0a0f1e 100%)',
          position: 'sticky', top: 0, zIndex: 40,
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}>
          <button
            id="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 9, cursor: 'pointer', color: 'var(--text-primary)',
              width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Menu size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(59,130,246,0.4)', flexShrink: 0,
            }}>
              <span style={{ fontSize: 14 }}>📈</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Trade<span style={{ background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Log</span> Pro
              </div>
              <div style={{ fontSize: 9, color: '#475569', fontWeight: 600, letterSpacing: '0.06em' }}>CLOUD EDITION</div>
            </div>
          </div>
          {tradesLoading && page !== 'add-trade' && (
            <Loader2 size={14} className="spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)', flexShrink: 0 }} />
          )}
        </div>

        {tradesLoading && page !== 'add-trade' && (
          <div className="mobile-topbar-hidden" style={{ position: 'absolute', top: 20, right: 36, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          </div>
        )}

        {renderPage()}
        <AIChat />
      </main>

      {/* Import Modal */}
      {importOpen && (
        <ImportModal onImport={importTrades} onClose={() => setImportOpen(false)} />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
