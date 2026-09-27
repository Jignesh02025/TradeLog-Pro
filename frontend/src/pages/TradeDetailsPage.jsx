import React from 'react'
import { ArrowLeft, TrendingUp, Calendar, Hash, Target, Calculator } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '../utils/currencyUtils'

const TradeDetailsPage = ({ trade, settings, onBack }) => {
  if (!trade) {
    return (
      <div className="page-content" style={{ padding: '32px 36px', textAlign: 'center' }}>
        <h2>Trade not found</h2>
        <button className="btn-primary" onClick={onBack}>Go Back</button>
      </div>
    )
  }

  const isProfit = trade.profitLoss >= 0
  const pnlColor = isProfit ? 'var(--accent-green)' : 'var(--accent-red)'

  return (
    <div className="page-content fade-in" style={{ padding: '32px 36px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Back Button */}
      <button 
        onClick={onBack} 
        style={{ 
          background: 'transparent', border: 'none', color: 'var(--text-secondary)', 
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer',
          marginBottom: 24, padding: 0, fontWeight: 600
        }}
      >
        <ArrowLeft size={16} /> Back to Trades
      </button>

      {/* Header */}
      <div className="glass-card stagger-1" style={{ padding: '32px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
            {trade.pair}
            <span className={`badge ${trade.type === 'Buy' ? 'badge-buy' : 'badge-sell'}`} style={{ fontSize: 16, padding: '6px 14px' }}>
              {trade.type}
            </span>
          </h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: 16, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={16} /> {format(new Date(trade.date), 'dd MMM yyyy')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Hash size={16} /> {trade.lotSize} Lots</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Net Profit / Loss</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: pnlColor, lineHeight: 1 }}>
            {trade.profitLoss > 0 ? '+' : ''}{formatCurrency(trade.profitLoss, settings.defaultCurrency || 'USD')}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="stat-label">Entry Price</div>
          <div className="stat-val" style={{ fontSize: 24 }}>{trade.entryPrice}</div>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="stat-label">Exit Price</div>
          <div className="stat-val" style={{ fontSize: 24 }}>{trade.exitPrice}</div>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="stat-label">Stop Loss</div>
          <div className="stat-val" style={{ fontSize: 24 }}>{trade.stopLoss || '—'}</div>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="stat-label">Take Profit</div>
          <div className="stat-val" style={{ fontSize: 24 }}>{trade.takeProfit || '—'}</div>
        </div>
      </div>

      <div className="stagger-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="stat-label"><TrendingUp size={14} style={{ display: 'inline', marginRight: 6 }} /> Pips Captured</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: trade.pips >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {trade.pips > 0 ? '+' : ''}{trade.pips.toFixed(1)}
          </div>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="stat-label"><Target size={14} style={{ display: 'inline', marginRight: 6 }} /> Risk / Reward</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            1:{trade.riskReward || '—'}
          </div>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="stat-label"><Calculator size={14} style={{ display: 'inline', marginRight: 6 }} /> Pip Value</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {formatCurrency(trade.pipValue, settings.defaultCurrency || 'USD')}
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {trade.notes && (
        <div className="glass-card stagger-4" style={{ padding: 32, marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trade Notes</h3>
          <div style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {trade.notes}
          </div>
        </div>
      )}

      {/* Screenshots Section */}
      {trade.screenshots && trade.screenshots.length > 0 && (
        <div className="glass-card stagger-4" style={{ padding: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attached Screenshots</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {trade.screenshots.map((url, idx) => (
              <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <img src={url} alt={`Screenshot ${idx+1}`} style={{ width: '100%', height: 250, objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TradeDetailsPage
