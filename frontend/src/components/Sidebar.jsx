import React, { useState } from 'react'
import {
  LayoutDashboard, PlusCircle, List, BarChart2,
  Settings, UploadCloud, LogOut, TrendingUp, User as UserIcon, Zap, ChevronRight, HelpCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Sidebar = ({ activePage, onNavigate, onOpenImport }) => {
  const { user, signOut } = useAuth()
  const [hoveredItem, setHoveredItem] = useState(null)

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },
    { id: 'add-trade', label: 'Add Trade', icon: PlusCircle,       color: '#10b981', glow: 'rgba(16,185,129,0.35)' },
    { id: 'trades',    label: 'History',   icon: List,             color: '#f59e0b', glow: 'rgba(245,158,11,0.35)' },
    { id: 'analytics', label: 'Analytics', icon: BarChart2,        color: '#8b5cf6', glow: 'rgba(139,92,246,0.35)' },
  ]

  const toolItems = [
    { id: 'import',      label: 'Import CSV',  icon: UploadCloud, action: onOpenImport, color: '#60a5fa' },
    { id: 'connect-mt5', label: 'Connect MT5', icon: Zap,          color: '#f97316' },
    { id: 'settings',    label: 'Settings',    icon: Settings,     color: '#94a3b8' },
    { id: 'help',        label: 'Help & Guide',icon: HelpCircle,   color: '#34d399' },
  ]

  return (
    <aside 
      className="sidebar"
      style={{
        background: 'linear-gradient(180deg, #0c1322 0%, #0a0f1e 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0,
      animation: 'fadeInLeft 0.45s cubic-bezier(0.22,1,0.36,1) both',
      overflow: 'hidden',
    }}>

      {/* Decorative glow blobs */}
      <div style={{
        position: 'absolute', top: -60, left: -60,
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 80, right: -80,
        width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ─── Logo ─── */}
      <div style={{
        padding: '22px 20px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        animation: 'fadeIn 0.5s ease both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Animated logo icon */}
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(59,130,246,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s',
            cursor: 'default',
            flexShrink: 0,
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'rotate(-8deg) scale(1.12)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.6), 0 0 0 1px rgba(255,255,255,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'rotate(0deg) scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.4), 0 0 0 1px rgba(255,255,255,0.1)'
            }}
          >
            <TrendingUp size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              Trade<span style={{
                background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Log</span> Pro
            </div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 2, fontWeight: 500, letterSpacing: '0.04em' }}>
              CLOUD EDITION
            </div>
          </div>
        </div>
      </div>

      {/* ─── Navigation ─── */}
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{
          fontSize: 9.5, fontWeight: 700, color: '#334155',
          letterSpacing: '0.12em', padding: '8px 10px 6px',
          textTransform: 'uppercase',
        }}>
          Menu
        </div>

        {menuItems.map((item, i) => {
          const isActive = activePage === item.id
          const isHovered = hoveredItem === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '10px 12px', borderRadius: 11,
                border: isActive
                  ? `1px solid ${item.color}28`
                  : '1px solid transparent',
                background: isActive
                  ? `linear-gradient(135deg, ${item.color}18, ${item.color}08)`
                  : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                cursor: 'pointer', width: '100%', textAlign: 'left',
                color: isActive ? item.color : isHovered ? '#e2e8f0' : '#94a3b8',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13.5,
                transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
                transform: isHovered && !isActive ? 'translateX(3px)' : 'translateX(0)',
                boxShadow: isActive ? `0 0 20px ${item.glow}22, inset 0 0 12px ${item.color}08` : 'none',
                position: 'relative', overflow: 'hidden',
                animation: `fadeIn 0.4s ease both`,
                animationDelay: `${i * 55 + 80}ms`,
              }}
            >
              {/* Active left bar */}
              <div style={{
                position: 'absolute', left: 0, top: '20%', bottom: '20%',
                width: 3, borderRadius: '0 3px 3px 0',
                background: isActive ? item.color : 'transparent',
                boxShadow: isActive ? `0 0 8px ${item.color}` : 'none',
                transition: 'all 0.25s ease',
              }} />

              {/* Icon container */}
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive
                  ? `linear-gradient(135deg, ${item.color}25, ${item.color}12)`
                  : isHovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                border: isActive ? `1px solid ${item.color}30` : '1px solid rgba(255,255,255,0.04)',
                transition: 'all 0.2s ease',
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                boxShadow: isActive ? `0 4px 12px ${item.glow}` : 'none',
                color: isActive ? item.color : 'inherit',
              }}>
                <Icon size={16} />
              </div>

              <span style={{ flex: 1, letterSpacing: '-0.01em' }}>{item.label}</span>

              {isActive && (
                <ChevronRight size={13} style={{
                  opacity: 0.6,
                  animation: 'fadeIn 0.2s ease',
                  color: item.color,
                }} />
              )}
            </button>
          )
        })}

        {/* Divider */}
        <div style={{
          margin: '12px 0 4px',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        }} />

        <div style={{
          fontSize: 9.5, fontWeight: 700, color: '#334155',
          letterSpacing: '0.12em', padding: '4px 10px 6px',
          textTransform: 'uppercase',
        }}>
          Tools
        </div>

        {toolItems.map((item, i) => {
          const isActive = activePage === item.id
          const isHovered = hoveredItem === item.id + '_tool'
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => item.action ? item.action() : onNavigate(item.id)}
              onMouseEnter={() => setHoveredItem(item.id + '_tool')}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '9px 12px', borderRadius: 10,
                border: isActive ? `1px solid ${item.color}28` : '1px solid transparent',
                background: isActive
                  ? `${item.color}14`
                  : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                cursor: 'pointer', width: '100%', textAlign: 'left',
                color: isActive ? item.color : isHovered ? '#cbd5e1' : '#64748b',
                fontWeight: isActive ? 600 : 500,
                fontSize: 13,
                transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
                transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                animation: `fadeIn 0.4s ease both`,
                animationDelay: `${i * 55 + 350}ms`,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isHovered || isActive ? `${item.color}18` : 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.04)',
                transition: 'all 0.2s ease',
                color: isHovered || isActive ? item.color : 'inherit',
              }}>
                <Icon size={14} />
              </div>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* ─── User section ─── */}
      <div style={{
        padding: '14px 14px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.15)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.6s ease both',
        animationDelay: '500ms',
      }}>
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 10px',
            borderRadius: 12,
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.12)',
            marginBottom: 10,
            transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
            cursor: 'default',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.1)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(59,130,246,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.06)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(59,130,246,0.4)',
              fontSize: 13, fontWeight: 700, color: 'white',
            }}>
              {user.email?.[0]?.toUpperCase() || <UserIcon size={15} />}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: '#e2e8f0',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user.email}
              </div>
              <div style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                {/* Pulsing dot */}
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#10b981', display: 'inline-block',
                  boxShadow: '0 0 6px #10b981',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }} />
                Active Session
              </div>
            </div>
          </div>
        )}

        <button
          onClick={signOut}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
            e.currentTarget.style.color = '#ef4444'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#64748b'
            e.currentTarget.style.borderColor = 'transparent'
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10,
            border: '1px solid transparent',
            background: 'transparent',
            cursor: 'pointer', width: '100%', textAlign: 'left',
            color: '#64748b', fontSize: 13, fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.15)',
          }}>
            <LogOut size={14} color="#ef4444" />
          </div>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
