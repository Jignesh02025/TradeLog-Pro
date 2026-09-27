import React, { useState, useEffect, useRef } from 'react'
import { X, Save, Calculator, TrendingUp, ImagePlus, Loader2 } from 'lucide-react'
import { calculatePips, calculateProfit, getPipValue, calculateRR, COMMON_PAIRS } from '../utils/forexCalculations'

const EMPTY = {
  date: new Date().toISOString().split('T')[0],
  pair: 'EUR/USD',
  type: 'Buy',
  entryPrice: '',
  exitPrice: '',
  lotSize: '0.1',
  stopLoss: '',
  takeProfit: '',
  pipValue: '1',
  isPipValueManual: false,
  profitLoss: '',
  manualOverride: false,
  tradeResult: '',
  notes: '',
  screenshots: [],
}

function validate(form) {
  const err = {}
  if (!form.date) err.date = 'Date is required'
  if (!form.pair.trim()) err.pair = 'Currency pair is required'
  if (!form.entryPrice || isNaN(Number(form.entryPrice)) || Number(form.entryPrice) <= 0)
    err.entryPrice = 'Enter a valid entry price'
  if (!form.exitPrice || isNaN(Number(form.exitPrice)) || Number(form.exitPrice) <= 0)
    err.exitPrice = 'Enter a valid exit price'
  if (!form.lotSize || isNaN(Number(form.lotSize)) || Number(form.lotSize) <= 0)
    err.lotSize = 'Enter a valid lot size'
  
  if (form.isPipValueManual && (!form.pipValue || isNaN(Number(form.pipValue))))
    err.pipValue = 'Enter valid pip value'
  
  if (form.manualOverride && (!form.profitLoss || isNaN(Number(form.profitLoss))))
    err.profitLoss = 'Enter valid profit/loss'
    
  return err
}

const TradeForm = ({ initialData, onSubmit, onCancel, isModal }) => {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        date: initialData.date,
        pair: initialData.pair || '',
        type: initialData.type,
        entryPrice: String(initialData.entryPrice),
        exitPrice: String(initialData.exitPrice),
        lotSize: String(initialData.lotSize),
        stopLoss: String(initialData.stopLoss || ''),
        takeProfit: String(initialData.takeProfit || ''),
        pipValue: String(initialData.pipValue || ''),
        isPipValueManual: false,
        profitLoss: String(initialData.profitLoss || ''),
        manualOverride: initialData.manualOverride || false,
        tradeResult: initialData.tradeResult || '',
        notes: initialData.notes || '',
        screenshots: initialData.screenshots || [],
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
    setSubmitted(false)
  }, [initialData])

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    const next = { ...form, [field]: value }
    setForm(next)
    if (submitted) setErrors(validate(next))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImage(true);
    
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        return data.secure_url;
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(url => Boolean(url));
      
      if (validUrls.length > 0) {
        setForm(prev => ({ 
          ...prev, 
          screenshots: [...(prev.screenshots || []), ...validUrls] 
        }));
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const pips = calculatePips(form.pair, parseFloat(form.entryPrice), parseFloat(form.exitPrice), form.type)
  const rr = calculateRR(parseFloat(form.entryPrice), parseFloat(form.stopLoss), parseFloat(form.takeProfit), form.type)
  
  const autoPipValue = getPipValue(form.pair, parseFloat(form.lotSize))
  const currentPipValue = form.isPipValueManual ? parseFloat(form.pipValue) : autoPipValue
  const autoPnl = calculateProfit(pips, currentPipValue)
  const currentPnl = form.manualOverride ? parseFloat(form.profitLoss) : autoPnl

  const getRrColor = (val) => {
    if (val >= 2) return 'var(--accent-green)'
    if (val >= 1) return 'var(--accent-yellow)'
    return 'var(--accent-red)'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    
    setIsSubmitting(true)
    try {
      await onSubmit(form)
      if (!initialData) { 
        setForm(EMPTY)
        setSubmitted(false) 
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {isModal && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Edit Trade</h2>
          {onCancel && (
            <button type="button" onClick={onCancel}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          )}
        </div>
      )}

      <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Date */}
        <div>
          <label className="form-label">Trade Date</label>
          <input id="field-date" type="date" className="form-input" value={form.date} onChange={set('date')} />
          {errors.date && <div className="form-error">{errors.date}</div>}
        </div>

        {/* Currency Pair */}
        <div>
          <label className="form-label">Currency Pair</label>
          <input 
            id="field-pair" 
            list="pairs-list-pro"
            type="text" 
            className="form-input" 
            placeholder="e.g. EUR/USD" 
            value={form.pair} 
            onChange={set('pair')} 
          />
          <datalist id="pairs-list-pro">
            {COMMON_PAIRS.map(p => <option key={p} value={p} />)}
          </datalist>
          {errors.pair && <div className="form-error">{errors.pair}</div>}
        </div>

        {/* Type */}
        <div>
          <label className="form-label">Trade Type</label>
          <select id="field-type" className="form-input" value={form.type} onChange={set('type')}>
            <option value="Buy">Buy (Long)</option>
            <option value="Sell">Sell (Short)</option>
          </select>
        </div>

        {/* Lot Size */}
        <div>
          <label className="form-label">Lot Size</label>
          <input id="field-lots" type="number" step="0.01" className="form-input" placeholder="0.10" value={form.lotSize} onChange={set('lotSize')} />
          {errors.lotSize && <div className="form-error">{errors.lotSize}</div>}
        </div>

        {/* Entry Price */}
        <div>
          <label className="form-label">Entry Price</label>
          <input id="field-entry" type="number" step="any" className="form-input" placeholder="0.00000" value={form.entryPrice} onChange={set('entryPrice')} />
          {errors.entryPrice && <div className="form-error">{errors.entryPrice}</div>}
        </div>

        {/* Exit Price */}
        <div>
          <label className="form-label">Exit Price</label>
          <input id="field-exit" type="number" step="any" className="form-input" placeholder="0.00000" value={form.exitPrice} onChange={set('exitPrice')} />
          {errors.exitPrice && <div className="form-error">{errors.exitPrice}</div>}
        </div>

        {/* Stop Loss */}
        <div>
          <label className="form-label">Stop Loss</label>
          <input id="field-sl" type="number" step="any" className="form-input" placeholder="0.00000" value={form.stopLoss} onChange={set('stopLoss')} />
        </div>

        {/* Take Profit */}
        <div>
          <label className="form-label">Take Profit</label>
          <input id="field-tp" type="number" step="any" className="form-input" placeholder="0.00000" value={form.takeProfit} onChange={set('takeProfit')} />
        </div>
      </div>

      {/* Risk Reward Preview */}
      <div style={{ 
        marginTop: 16, padding: '12px 16px', borderRadius: 10, 
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
          <TrendingUp size={14} /> Risk/Reward Ratio
        </div>
        <div style={{ fontWeight: 800, fontSize: 16, color: getRrColor(rr) }}>
          1 : {rr > 0 ? rr : '—'}
        </div>
      </div>

      {/* Calculations Panel */}
      <div className="calc-panel" style={{ marginTop: 16, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          <Calculator size={14} /> Calculations
        </h3>
        
        <div className="calc-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Pip Value */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Pip Value</label>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isPipValueManual} onChange={set('isPipValueManual')} /> Manual
              </label>
            </div>
            <input 
              type="number" step="any" 
              className={`form-input ${form.isPipValueManual ? 'input-manual' : ''}`}
              value={form.isPipValueManual ? form.pipValue : autoPipValue.toFixed(2)} 
              onChange={set('pipValue')}
              disabled={!form.isPipValueManual}
            />
          </div>

          {/* Pips */}
          <div>
            <label className="form-label">Pips Gained/Lost</label>
            <div style={{ padding: '11px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', color: pips >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>
              {pips >= 0 ? '+' : ''}{pips.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Profit Override */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Final Profit / Loss</label>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.manualOverride} onChange={set('manualOverride')} /> Override
            </label>
          </div>
          <input 
            type="number" step="any" 
            className={`form-input ${form.manualOverride ? 'input-manual' : ''}`}
            value={form.manualOverride ? form.profitLoss : autoPnl.toFixed(2)} 
            onChange={set('profitLoss')}
            disabled={!form.manualOverride}
            style={{ color: currentPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 800, fontSize: 18 }}
          />
        </div>
      </div>

      {/* Screenshots Upload */}
      <div style={{ marginTop: 24 }}>
        <label className="form-label">Trade Screenshots (optional)</label>
        
        {form.screenshots && form.screenshots.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, marginBottom: 12 }}>
            {form.screenshots.map((url, idx) => (
              <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img src={url} alt={`Screenshot ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => {
                    const newScreenshots = [...form.screenshots];
                    newScreenshots.splice(idx, 1);
                    setForm(prev => ({ ...prev, screenshots: newScreenshots }));
                  }}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white',
                    borderRadius: '50%', width: 24, height: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{
          border: '1px dashed var(--border-color)',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          background: 'rgba(255,255,255,0.01)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {uploadingImage ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 10 }}>
              <Loader2 size={24} style={{ color: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Uploading images...</span>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{
                  position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', zIndex: 10
                }}
              />
              <ImagePlus size={28} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>Click to upload screenshots</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>You can select multiple images</div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginTop: 16 }}>
        <label className="form-label">Notes (optional)</label>
        <textarea
          id="field-notes"
          className="form-input"
          rows={3}
          placeholder="Strategy, observations, emotions…"
          value={form.notes}
          onChange={set('notes')}
          style={{ resize: 'vertical', minHeight: 80 }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: isModal ? 'flex-end' : 'flex-start' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-edit" id="btn-cancel" disabled={isSubmitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" id="btn-submit-trade" style={{ display: 'flex', alignItems: 'center', gap: 8 }} disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : <Save size={15} />}
          {initialData ? 'Update Trade' : 'Save Trade'}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  )
}

export default TradeForm
