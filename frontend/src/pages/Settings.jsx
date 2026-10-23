import React, { useState } from 'react'
import {
  Settings as SettingsIcon, Trash2, Globe, CreditCard, Shield, Lock,
  Palette, Sparkles, Check, Sliders, Sun, Moon, RotateCcw,
  Wand2, Layers, Eye, CheckCircle2, Droplets
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  THEME_PRESETS,
  DEFAULT_CUSTOM_THEME,
  generateCustomThemeVars,
  applyTheme
} from '../utils/themes'

const ACCENT_COLOR_OPTIONS = [
  { name: 'Electric Blue', hex: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
  { name: 'Emerald Mint', hex: '#10b981', glow: 'rgba(16,185,129,0.4)' },
  { name: '24K Royal Gold', hex: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
  { name: 'Cyber Violet', hex: '#a855f7', glow: 'rgba(168,85,247,0.4)' },
  { name: 'Electric Pink', hex: '#ec4899', glow: 'rgba(236,72,153,0.4)' },
  { name: 'Crimson Red', hex: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
  { name: 'Sunset Amber', hex: '#f97316', glow: 'rgba(249,115,22,0.4)' },
  { name: 'Arctic Cyan', hex: '#06b6d4', glow: 'rgba(6,182,212,0.4)' },
]

const SECONDARY_COLOR_OPTIONS = [
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Teal', hex: '#14b8a6' },
]

const CANVAS_OPTIONS = [
  { id: 'dark-slate', label: 'Dark Slate', desc: 'Titanium navy & deep glass', hex: '#0a0f1e', icon: Moon },
  { id: 'pitch-black', label: 'OLED Pure', desc: '100% deep infinite black', hex: '#000000', icon: Moon },
  { id: 'deep-midnight', label: 'Midnight', desc: 'Cosmic indigo charcoal', hex: '#080811', icon: Moon },
  { id: 'espresso', label: 'Espresso', desc: 'Warm roasted obsidian', hex: '#100c0a', icon: Moon },
  { id: 'light', label: 'Platinum Light', desc: 'Crisp Swiss daylight', hex: '#f8fafc', icon: Sun },
  { id: 'custom', label: 'Custom Canvas', desc: 'Choose any background color', hex: 'custom', icon: Droplets },
]

const Settings = ({ settings, onUpdateSettings, onClearData }) => {
  const currencies = ['USD', 'INR', 'EUR', 'GBP']
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  
  // Theme sub-tab: 'presets' | 'custom'
  const [themeTab, setThemeTab] = useState(settings?.theme === 'custom' ? 'custom' : 'presets')
  
  // Custom theme editor state
  const [customTheme, setCustomTheme] = useState(settings?.customTheme || DEFAULT_CUSTOM_THEME)
  const [customSavedToast, setCustomSavedToast] = useState(false)

  const currentThemeId = settings?.theme || 'midnight'

  const selectPresetTheme = (themeId) => {
    onUpdateSettings({ ...settings, theme: themeId })
    applyTheme(themeId, settings?.customTheme)
  }

  const handleUpdateCustomField = (key, value) => {
    const updated = { ...customTheme, [key]: value }
    setCustomTheme(updated)
    
    // If custom theme is already active, live update immediately
    if (settings?.theme === 'custom') {
      onUpdateSettings({ ...settings, theme: 'custom', customTheme: updated })
      applyTheme('custom', updated)
    }
  }

  const applyCustomThemeNow = () => {
    onUpdateSettings({ ...settings, theme: 'custom', customTheme })
    applyTheme('custom', customTheme)
    setCustomSavedToast(true)
    setTimeout(() => setCustomSavedToast(false), 3000)
  }

  const resetCustomTheme = () => {
    setCustomTheme(DEFAULT_CUSTOM_THEME)
    if (settings?.theme === 'custom') {
      onUpdateSettings({ ...settings, theme: 'custom', customTheme: DEFAULT_CUSTOM_THEME })
      applyTheme('custom', DEFAULT_CUSTOM_THEME)
    }
  }

  const loadPresetIntoCustomizer = (presetId) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    const loaded = {
      base: presetId === 'platinum' ? 'light' : presetId === 'stealth' ? 'pitch-black' : 'dark-slate',
      customBg: preset.preview.bg,
      primaryColor: preset.preview.primary,
      secondaryColor: preset.preview.secondary,
      cardStyle: 'glass',
      glowIntensity: 'medium',
    }
    setCustomTheme(loaded)
    setThemeTab('custom')
    onUpdateSettings({ ...settings, theme: 'custom', customTheme: loaded })
    applyTheme('custom', loaded)
  }

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

  // Generate live preview variables for custom theme preview card
  const previewCustomVars = generateCustomThemeVars(customTheme)

  return (
    <div className="fade-in page-content" style={{ padding: '32px 36px', maxWidth: 1050 }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 12 }}>
              <SettingsIcon size={26} color="var(--accent-blue)" /> Preferences & Settings
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
              Customize your trading journal appearance, currency, risk limits, and account security.
            </p>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 100,
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-color)',
            fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)'
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--accent-blue)',
              boxShadow: '0 0 10px var(--accent-glow)'
            }} />
            Active Theme: <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
              {currentThemeId === 'custom' ? 'Custom Studio' : (THEME_PRESETS.find(p => p.id === currentThemeId)?.name || 'Midnight Obsidian')}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        
        {/* ════════════════════════════════════════════════════════════════════════
            PREMIUM THEME SELECTION & CUSTOM THEME STUDIO
        ════════════════════════════════════════════════════════════════════════ */}
        <div className="glass-card" style={{ padding: '28px 30px', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle Ambient Glow */}
          <div style={{
            position: 'absolute', top: -80, right: -80, width: 240, height: 240,
            borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
            pointerEvents: 'none', opacity: 0.6
          }} />

          {/* Section Header with Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px var(--accent-glow)', flexShrink: 0
              }}>
                <Palette size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    Visual Theme & Atmosphere
                  </h3>
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                    padding: '2px 8px', borderRadius: 6,
                    background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)',
                    border: '1px solid var(--accent-glow)', textTransform: 'uppercase'
                  }}>
                    PRO SUITE
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  Institutional presets designed for focused trading, or create your bespoke custom studio.
                </p>
              </div>
            </div>

            {/* Presets vs Custom Tabs */}
            <div style={{
              display: 'flex', background: 'rgba(0,0,0,0.25)', padding: 4, borderRadius: 12,
              border: '1px solid var(--card-border)', gap: 4
            }}>
              <button
                type="button"
                onClick={() => setThemeTab('presets')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  background: themeTab === 'presets' ? 'var(--accent-gradient)' : 'transparent',
                  color: themeTab === 'presets' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: themeTab === 'presets' ? '0 2px 10px var(--accent-glow)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)'
                }}
              >
                <Sparkles size={14} /> Curated Presets ({THEME_PRESETS.length})
              </button>
              <button
                type="button"
                onClick={() => setThemeTab('custom')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  background: themeTab === 'custom' ? 'var(--accent-gradient)' : 'transparent',
                  color: themeTab === 'custom' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: themeTab === 'custom' ? '0 2px 10px var(--accent-glow)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)'
                }}
              >
                <Sliders size={14} /> Custom Studio
                {currentThemeId === 'custom' && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                )}
              </button>
            </div>
          </div>

          {/* TAB 1: CURATED PRESETS */}
          {themeTab === 'presets' && (
            <div className="fade-in">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: 16
              }}>
                {THEME_PRESETS.map((preset) => {
                  const isActive = currentThemeId === preset.id
                  return (
                    <div
                      key={preset.id}
                      onClick={() => selectPresetTheme(preset.id)}
                      style={{
                        borderRadius: 14,
                        padding: 18,
                        background: preset.vars['--bg-card'],
                        border: '2px solid',
                        borderColor: isActive ? preset.preview.primary : 'var(--card-border)',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                        position: 'relative',
                        boxShadow: isActive
                          ? `0 8px 28px ${preset.vars['--accent-glow']}, 0 0 0 1px ${preset.preview.primary}`
                          : '0 4px 16px rgba(0,0,0,0.2)',
                        transform: isActive ? 'scale(1.015)' : 'scale(1)',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = preset.preview.border
                          e.currentTarget.style.transform = 'translateY(-3px)'
                          e.currentTarget.style.boxShadow = `0 10px 24px rgba(0,0,0,0.3), 0 0 16px ${preset.preview.primary}33`
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = 'var(--card-border)'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'
                        }
                      }}
                    >
                      {/* Top Row: Badge & Active Indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                          padding: '3px 9px', borderRadius: 6,
                          background: `${preset.preview.primary}18`,
                          color: preset.preview.primary,
                          border: `1px solid ${preset.preview.primary}33`,
                          textTransform: 'uppercase'
                        }}>
                          {preset.tag}
                        </span>

                        {isActive ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: preset.preview.primary, color: '#ffffff',
                            padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                            boxShadow: `0 2px 8px ${preset.preview.primary}66`
                          }}>
                            <Check size={12} strokeWidth={3} /> Active
                          </div>
                        ) : (
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>
                            Click to activate
                          </span>
                        )}
                      </div>

                      {/* Theme Name */}
                      <h4 style={{
                        fontSize: 16, fontWeight: 700,
                        color: preset.vars['--text-primary'],
                        letterSpacing: '-0.02em', marginBottom: 6
                      }}>
                        {preset.name}
                      </h4>

                      <p style={{
                        fontSize: 12, color: preset.vars['--text-muted'],
                        lineHeight: 1.45, marginBottom: 16, minHeight: 34
                      }}>
                        {preset.description}
                      </p>

                      {/* Mini Live Preview Window */}
                      <div style={{
                        borderRadius: 10,
                        background: preset.preview.bg,
                        border: `1px solid ${preset.preview.border}`,
                        padding: 12,
                        marginBottom: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: preset.preview.primary }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: preset.vars['--text-primary'] }}>
                              EURUSD Long
                            </span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>
                            +$1,450.00
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <div style={{
                            flex: 1, height: 6, borderRadius: 3,
                            background: preset.vars['--accent-gradient']
                          }} />
                          <div style={{
                            width: 24, height: 6, borderRadius: 3,
                            background: `${preset.preview.secondary}66`
                          }} />
                        </div>
                      </div>

                      {/* Color Palette Swatches */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${preset.preview.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Palette:</span>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <div title="Background" style={{ width: 14, height: 14, borderRadius: '50%', background: preset.preview.bg, border: '1px solid rgba(255,255,255,0.2)' }} />
                            <div title="Card Surface" style={{ width: 14, height: 14, borderRadius: '50%', background: preset.preview.card, border: '1px solid rgba(255,255,255,0.2)' }} />
                            <div title="Primary Accent" style={{ width: 14, height: 14, borderRadius: '50%', background: preset.preview.primary }} />
                            <div title="Secondary Accent" style={{ width: 14, height: 14, borderRadius: '50%', background: preset.preview.secondary }} />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            loadPresetIntoCustomizer(preset.id)
                          }}
                          style={{
                            background: 'transparent', border: 'none',
                            color: 'var(--accent-blue)', fontSize: 11.5, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                          }}
                          title="Tweak this preset in the Custom Studio"
                        >
                          Customize <Wand2 size={11} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM THEME STUDIO 🎨 */}
          {themeTab === 'custom' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Studio Banner & Actions */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: 12, padding: '16px 20px',
                borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Wand2 size={18} color="var(--accent-blue)" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Interactive Theme Customizer
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Changes preview below instantly in real-time.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={resetCustomTheme}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={13} /> Reset
                  </button>

                  <button
                    type="button"
                    onClick={applyCustomThemeNow}
                    className="btn-primary"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 20px', fontSize: 13, fontWeight: 700
                    }}
                  >
                    <CheckCircle2 size={15} />
                    {currentThemeId === 'custom' ? 'Save & Sync Theme' : 'Activate Custom Theme'}
                  </button>
                </div>
              </div>

              {customSavedToast && (
                <div className="fade-in" style={{
                  padding: '10px 16px', borderRadius: 8,
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#34d399', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <Check size={16} /> Custom theme applied successfully to all journal screens!
                </div>
              )}

              {/* Two Column Layout: Controls on Left, Live Preview on Right */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                
                {/* LEFT: CONTROLS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* 1. Base Canvas Atmosphere */}
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                      1. Base Atmosphere & Background Mood
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {CANVAS_OPTIONS.map((opt) => {
                        const isSelected = customTheme.base === opt.id
                        const Icon = opt.icon
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleUpdateCustomField('base', opt.id)}
                            style={{
                              padding: '12px 10px',
                              borderRadius: 10,
                              background: opt.hex === 'custom' ? customTheme.customBg : opt.hex,
                              border: isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--card-border)',
                              color: opt.id === 'light' ? '#0f172a' : '#f8fafc',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 6,
                              textAlign: 'center',
                              transition: 'all 0.2s',
                              boxShadow: isSelected ? '0 0 14px var(--accent-glow)' : 'none'
                            }}
                          >
                            <Icon size={16} color={opt.id === 'light' ? '#2563eb' : isSelected ? 'var(--accent-blue)' : 'var(--text-muted)'} />
                            <span style={{ fontSize: 11.5, fontWeight: 700 }}>{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Custom Background Color Picker if 'custom' is selected */}
                    {customTheme.base === 'custom' && (
                      <div className="fade-in" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Custom Canvas Hex:</span>
                        <input
                          type="color"
                          value={customTheme.customBg}
                          onChange={(e) => handleUpdateCustomField('customBg', e.target.value)}
                          style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ width: 110, padding: '6px 10px', fontSize: 13 }}
                          value={customTheme.customBg}
                          onChange={(e) => handleUpdateCustomField('customBg', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* 2. Primary Brand Accent Color */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label className="form-label" style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                        2. Primary Accent Color
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Hex:</span>
                        <input
                          type="color"
                          value={customTheme.primaryColor}
                          onChange={(e) => handleUpdateCustomField('primaryColor', e.target.value)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent' }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ width: 85, padding: '4px 8px', fontSize: 12 }}
                          value={customTheme.primaryColor}
                          onChange={(e) => handleUpdateCustomField('primaryColor', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Quick Swatches */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {ACCENT_COLOR_OPTIONS.map((c) => {
                        const isSelected = customTheme.primaryColor.toLowerCase() === c.hex.toLowerCase()
                        return (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => handleUpdateCustomField('primaryColor', c.hex)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '8px 10px', borderRadius: 8,
                              background: isSelected ? `${c.hex}22` : 'rgba(255,255,255,0.03)',
                              border: isSelected ? `2px solid ${c.hex}` : '1px solid var(--card-border)',
                              color: isSelected ? c.hex : 'var(--text-secondary)',
                              cursor: 'pointer', fontSize: 11, fontWeight: 600,
                              transition: 'all 0.15s',
                              boxShadow: isSelected ? `0 0 12px ${c.glow}` : 'none'
                            }}
                          >
                            <span style={{ width: 12, height: 12, borderRadius: '50%', background: c.hex, flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.name.split(' ')[0]}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 3. Secondary Gradient Accent */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label className="form-label" style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                        3. Secondary Gradient Companion
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="color"
                          value={customTheme.secondaryColor}
                          onChange={(e) => handleUpdateCustomField('secondaryColor', e.target.value)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent' }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ width: 85, padding: '4px 8px', fontSize: 12 }}
                          value={customTheme.secondaryColor}
                          onChange={(e) => handleUpdateCustomField('secondaryColor', e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {SECONDARY_COLOR_OPTIONS.map((c) => {
                        const isSelected = customTheme.secondaryColor.toLowerCase() === c.hex.toLowerCase()
                        return (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => handleUpdateCustomField('secondaryColor', c.hex)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '6px 12px', borderRadius: 8,
                              background: isSelected ? `${c.hex}22` : 'rgba(255,255,255,0.03)',
                              border: isSelected ? `2px solid ${c.hex}` : '1px solid var(--card-border)',
                              color: isSelected ? c.hex : 'var(--text-secondary)',
                              cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
                              transition: 'all 0.15s'
                            }}
                          >
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.hex }} />
                            {c.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 4. Glassmorphism & Glow Styles */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                        Surface Finish
                      </label>
                      <select
                        className="form-input"
                        value={customTheme.cardStyle}
                        onChange={(e) => handleUpdateCustomField('cardStyle', e.target.value)}
                        style={{ padding: '8px 12px', fontSize: 12.5 }}
                      >
                        <option value="glass">Frosted Glass (Blur)</option>
                        <option value="solid">High-Contrast Solid</option>
                        <option value="tinted">Tinted Accent Glass</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                        Glow & Lighting
                      </label>
                      <select
                        className="form-input"
                        value={customTheme.glowIntensity}
                        onChange={(e) => handleUpdateCustomField('glowIntensity', e.target.value)}
                        style={{ padding: '8px 12px', fontSize: 12.5 }}
                      >
                        <option value="subtle">Subtle Minimalist</option>
                        <option value="medium">Balanced Executive</option>
                        <option value="vivid">Vivid High-Glow</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* RIGHT: REAL-TIME INTERACTIVE PREVIEW */}
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8
                  }}>
                    <Eye size={15} color="var(--accent-blue)" /> Live Interface Preview
                  </div>

                  {/* Preview Container applying the custom variables */}
                  <div style={{
                    borderRadius: 16,
                    padding: 20,
                    background: previewCustomVars['--bg-primary'],
                    border: `1px solid ${previewCustomVars['--card-border']}`,
                    boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                  }}>
                    {/* Mock Navigation Header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingBottom: 12, borderBottom: `1px solid ${previewCustomVars['--border-color']}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 6,
                          background: previewCustomVars['--accent-gradient'],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 11, fontWeight: 800
                        }}>
                          TL
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: previewCustomVars['--text-primary'] }}>
                          Trade<span style={{ color: previewCustomVars['--accent-blue'] }}>Log</span> Pro
                        </span>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                        background: previewCustomVars['--table-row-hover'],
                        color: previewCustomVars['--accent-blue'],
                        border: `1px solid ${previewCustomVars['--border-color']}`
                      }}>
                        {customTheme.base.toUpperCase()}
                      </span>
                    </div>

                    {/* Mock Stat Card */}
                    <div style={{
                      borderRadius: 12,
                      padding: 16,
                      background: previewCustomVars['--glass-bg'],
                      border: `1px solid ${previewCustomVars['--card-border']}`,
                      backdropFilter: 'blur(10px)',
                      boxShadow: `0 4px 16px ${previewCustomVars['--accent-glow']}`
                    }}>
                      <div style={{ fontSize: 11, color: previewCustomVars['--text-muted'], fontWeight: 600, textTransform: 'uppercase' }}>
                        Net Profit · EUR/USD
                      </div>
                      <div style={{
                        fontSize: 24, fontWeight: 800, color: '#10b981',
                        letterSpacing: '-0.02em', marginTop: 4
                      }}>
                        +$3,840.50
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: 'rgba(16,185,129,0.15)', color: '#10b981'
                        }}>
                          +18.4% PnL
                        </span>
                        <span style={{ fontSize: 11, color: previewCustomVars['--text-muted'] }}>
                          Win Rate: 72%
                        </span>
                      </div>
                    </div>

                    {/* Mock Trade Row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10,
                      background: previewCustomVars['--table-row-hover'],
                      border: `1px solid ${previewCustomVars['--border-color']}`
                    }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: previewCustomVars['--text-primary'] }}>
                          GBP/JPY · 1.50 Lots
                        </div>
                        <div style={{ fontSize: 10.5, color: previewCustomVars['--text-muted'] }}>
                          Entry: 198.420 · Target: 199.650
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: previewCustomVars['--accent-blue'] }}>
                        +82.0 Pips
                      </span>
                    </div>

                    {/* Mock Button */}
                    <button
                      type="button"
                      style={{
                        padding: '10px 16px', borderRadius: 10, border: 'none',
                        background: previewCustomVars['--accent-gradient'],
                        color: '#ffffff', fontWeight: 700, fontSize: 13,
                        boxShadow: `0 4px 14px ${previewCustomVars['--accent-glow']}`,
                        cursor: 'default', textAlign: 'center'
                      }}
                    >
                      Instant Order Execution
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

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
                type="button"
                onClick={() => setCurrency(c)}
                style={{
                  padding: '12px 0',
                  borderRadius: 10,
                  border: '1px solid',
                  borderColor: settings.defaultCurrency === c ? 'var(--accent-blue)' : 'var(--border-color)',
                  background: settings.defaultCurrency === c ? 'var(--table-row-hover, rgba(59,130,246,0.1))' : 'rgba(255,255,255,0.02)',
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
              type="button"
              onClick={onClearData}
              className="btn-danger" 
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
            >
              <Trash2 size={16} /> Clear All Trade History
            </button>
            
            <button 
              type="button"
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
