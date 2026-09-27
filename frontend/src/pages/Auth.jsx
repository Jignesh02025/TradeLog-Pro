import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [isResetMode, setIsResetMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isResetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        alert('Password reset link sent! Check your email.')
        setIsResetMode(false)
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Check your email for the confirmation link!')
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: 'var(--bg-primary)', padding: '20px 16px'
    }}>
      <div className="glass-card fade-in" style={{ maxWidth: 400, width: '100%', padding: 'clamp(24px, 8vw, 40px)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(59,130,246,0.2)'
          }}>
            <TrendingUp size={24} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Trade<span className="gradient-text">Log</span> Pro
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
            {isResetMode ? 'Reset your password' : (isLogin ? 'Welcome back, trader' : 'Start your professional journal')}
          </p>
        </div>

        {error && (
          <div style={{ 
            marginBottom: 20, padding: '12px 16px', borderRadius: 10, 
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: 'var(--accent-red)', fontSize: 13, display: 'flex', gap: 10
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" required className="form-input" style={{ paddingLeft: 42 }}
                placeholder="trader@example.com" value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          {!isResetMode && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ fontSize: 12 }}>Password</label>
                {isLogin && (
                  <button 
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: 12, cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" required={!isResetMode} className="form-input" style={{ paddingLeft: 42 }}
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: 8, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }} disabled={loading}>
            {loading ? <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : 
              (isResetMode ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account'))}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          {isResetMode ? (
            <button 
              type="button"
              onClick={() => setIsResetMode(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer' }}
            >
              Back to Login
            </button>
          ) : (
            <>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer' }}
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default Auth
