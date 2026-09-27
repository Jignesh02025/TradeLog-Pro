import React, { useState, useMemo } from 'react'
import { Search, Pencil, Trash2, ArrowUpRight, ArrowDownRight, ChevronDown, AlertCircle, X, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import TradeForm from '../components/TradeForm'
import { convertCurrency, formatCurrency } from '../utils/currencyUtils'

const EMPTY_FILTER = { 
  search: '', 
  dateFrom: '', 
  dateTo: '', 
  profitLossFilter: 'all',
  minProfitLoss: '',
  maxProfitLoss: ''
}

const TradeList = ({ trades, settings, onUpdate, onDelete }) => {
  const [filter, setFilter] = useState(EMPTY_FILTER)
  const [editTrade, setEditTrade] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  const setF = (field) => (e) => setFilter(prev => ({ ...prev, [field]: e.target.value }))

  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (editTrade || deleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [editTrade, deleteConfirm]);

  const filtered = useMemo(() => {
    let list = [...trades]
    if (filter.search.trim()) {
      const q = filter.search.trim().toLowerCase()
      list = list.filter(t => t.pair.toLowerCase().includes(q))
    }
    if (filter.dateFrom) list = list.filter(t => t.date >= filter.dateFrom)
    if (filter.dateTo)   list = list.filter(t => t.date <= filter.dateTo)
    if (filter.profitLossFilter === 'profit') list = list.filter(t => t.profitLoss > 0)
    if (filter.profitLossFilter === 'loss')   list = list.filter(t => t.profitLoss < 0)
    
    if (filter.minProfitLoss) list = list.filter(t => t.profitLoss >= parseFloat(filter.minProfitLoss))
    if (filter.maxProfitLoss) list = list.filter(t => t.profitLoss <= parseFloat(filter.maxProfitLoss))

    list.sort((a, b) => sortDir === 'desc'
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    return list
  }, [trades, filter, sortDir])

  const fmtCurrency = (n, from = 'USD') => {
    const base = settings.defaultCurrency || 'USD'
    const converted = convertCurrency(n, from, base)
    return formatCurrency(converted, base)
  }

  const resetFilters = () => setFilter(EMPTY_FILTER)
  const hasFilters = filter.search || filter.dateFrom || filter.dateTo || filter.profitLossFilter !== 'all' || filter.minProfitLoss || filter.maxProfitLoss

  const [expandedId, setExpandedId] = useState(null)

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id)

  return (
    <div className="page-content" style={{ padding: '32px 36px', maxWidth: 1400 }}>
      {/* Header */}
      <div className="fade-in" style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Trade <span className="gradient-text">History</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            {trades.length} trades logged · {filtered.length} showing
          </p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="glass-card fade-in stagger-1" style={{ padding: '20px', marginBottom: 20 }}>
        <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>Search Pair</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="search-input" style={{ width: '100%', minWidth: 'auto' }} placeholder="e.g. EURUSD" value={filter.search} onChange={setF('search')} />
            </div>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>Date From</label>
            <input type="date" className="filter-chip" style={{ width: '100%' }} value={filter.dateFrom} onChange={setF('dateFrom')} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>Date To</label>
            <input type="date" className="filter-chip" style={{ width: '100%' }} value={filter.dateTo} onChange={setF('dateTo')} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>Status</label>
            <select className="filter-chip" style={{ width: '100%' }} value={filter.profitLossFilter} onChange={setF('profitLossFilter')}>
              <option value="all">All trades</option>
              <option value="profit">Profit only</option>
              <option value="loss">Loss only</option>
            </select>
          </div>
          <div className="filter-actions-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {hasFilters && (
              <button onClick={resetFilters} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                ✕ Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card fade-in stagger-2" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="trade-table">
            <thead>
              <tr>
                <th onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} style={{ cursor: 'pointer' }}>
                  Date <ChevronDown size={12} style={{ transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none' }} />
                </th>
                <th>Pair</th>
                <th>Type</th>
                <th>Lots</th>
                <th>RR</th>
                <th>Pips</th>
                <th>P&L ({settings.defaultCurrency})</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} data-label="" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No matches found.</td></tr>
              ) : (
                filtered.map((t, rowIdx) => {
                  const isExpanded = expandedId === t.id;
                  return (
                    <tr key={t.id} className={isExpanded ? 'row-expanded' : ''} style={{ animationDelay: `${rowIdx * 30}ms` }}>
                      <td data-label="Date" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{format(new Date(t.date), 'dd MMM yyyy')}</td>
                      <td data-label="Pair" style={{ fontWeight: 700 }}>{t.pair}</td>
                      <td data-label="Type"><span className={`badge ${t.type === 'Buy' ? 'badge-buy' : 'badge-sell'}`}>{t.type}</span></td>
                      <td data-label="Lots" className="mobile-hide-detail"><span className="badge badge-lots">{t.lotSize}</span></td>
                      <td data-label="RR" className="mobile-hide-detail">
                        <span style={{ fontWeight: 600, color: (t.riskReward || 0) >= 2 ? 'var(--accent-green)' : (t.riskReward || 0) < 1 ? 'var(--accent-red)' : 'inherit' }}>
                          1:{t.riskReward || '—'}
                        </span>
                      </td>
                      <td data-label="Pips" className="mobile-hide-detail" style={{ fontWeight: 600, color: t.pips >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {t.pips >= 0 ? '+' : ''}{t.pips.toFixed(1)}
                      </td>
                      <td data-label="P&L" className={t.profitLoss >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                        {fmtCurrency(t.profitLoss)}
                      </td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button className="btn-edit mobile-detail-toggle" onClick={(e) => { e.stopPropagation(); toggleExpand(t.id); }}>
                            <AlertCircle size={14} />
                          </button>
                          <div className="action-btns-desktop" style={{ display: 'flex', gap: 6 }}>
                            {t.screenshotUrl && (
                              <button className="btn-edit" onClick={() => window.open(t.screenshotUrl, '_blank')} title="View Screenshot">
                                <ImageIcon size={12} />
                              </button>
                            )}
                            <button className="btn-edit" onClick={() => setEditTrade(t)}><Pencil size={12} /></button>
                            <button className="btn-danger" onClick={() => setDeleteConfirm(t.id)}><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editTrade && (
        <div className="modal-overlay" onClick={() => setEditTrade(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <TradeForm initialData={editTrade} onSubmit={(d) => { onUpdate(editTrade.id, d); setEditTrade(null); }} onCancel={() => setEditTrade(null)} isModal />
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete Trade?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>This action will permanently remove this record.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-edit" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn-danger" onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null); }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradeList
