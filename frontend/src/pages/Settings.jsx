import React, { useState } from 'react'
import { Settings as SettingsIcon, Trash2, Globe, CreditCard, Shield, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'

const Settings = ({ settings, onUpdateSettings, onClearData }) => {
  const currencies = ['USD', 'INR', 'EUR', 'GBP']
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const setCurrency = (c) => {
    onUpdateSettings({ ...settings, defaultCurrency: c })
  }

  const setRisk = (val) => {
    const num = parseFloat(val) || 0
    onUpdateSettings({ ...settings, riskPercentage: num })
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters' })
      return
    }

    setIsUpdatingPassword(true)
    setPasswordStatus(null)

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    setIsUpdatingPassword(false)

    if (error) {
      setPasswordStatus({ type: 'error', message: error.message })
    } else {
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="fade-in page-content" style={{ padding: '32px 36px', maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <SettingsIcon size={24} /> Account Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
          Manage your account currency and application preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Currency Setting */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Base Currency</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>The default currency for your trading account calculations.</p>
            </div>
          </div>
          
          <div className="currency-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {currencies.map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                style={{
                  padding: '12px 0',
                  borderRadius: 10,
                  border: '1px solid',
                  borderColor: settings.defaultCurrency === c ? 'var(--accent-blue)' : 'var(--border-color)',
                  background: settings.defaultCurrency === c ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                  color: settings.defaultCurrency === c ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  fontWeight: settings.defaultCurrency === c ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: 14,
                  minHeight: 44,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Percentage Setting */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(167,139,250,0.1)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Risk Management</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Set your default risk percentage per trade.</p>
            </div>
          </div>
          
          <div style={{ maxWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input 
                type="number" 
                step="0.1"
                className="form-input" 
                value={settings.riskPercentage} 
                onChange={(e) => setRisk(e.target.value)} 
              />
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>%</span>
            </div>
          </div>
        </div>

        {/* Password Reset */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Change Password</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Update your account password securely.</p>
            </div>
          </div>
          
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300 }}>
            <input 
              type="password" 
              className="form-input" 
              placeholder="New Password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input 
              type="password" 
              className="form-input" 
              placeholder="Confirm New Password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {passwordStatus && (
              <div style={{ 
                padding: '8px 12px', 
                borderRadius: 6, 
                fontSize: 13, 
                background: passwordStatus.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                color: passwordStatus.type === 'error' ? 'var(--accent-red)' : '#22c55e',
                border: `1px solid ${passwordStatus.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`
              }}>
                {passwordStatus.message}
              </div>
            )}
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isUpdatingPassword}
              style={{ padding: '10px 16px', opacity: isUpdatingPassword ? 0.7 : 1 }}
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Security & Data */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Data Management</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Backup, restore or reset your trade history.</p>
            </div>
          </div>

          <div className="settings-data-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button 
              onClick={onClearData}
              className="btn-danger" 
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
            >
              <Trash2 size={16} /> Clear All Trade History
            </button>
            
            <button 
              className="btn-edit" 
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
              onClick={() => alert('Exporting data as JSON...')}
            >
              <Globe size={16} /> Export Data (JSON)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
