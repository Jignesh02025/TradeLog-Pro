import React from 'react'
import { BookOpen, Camera, Calculator, BarChart3, Bot, Cloud, CheckCircle, Smartphone } from 'lucide-react'

const HelpGuide = () => {
  const features = [
    {
      icon: <Calculator size={24} color="#60a5fa" />,
      title: "Smart Trade Logging",
      desc: "Log your trades manually with automated calculations. Pips, Pip Values, Risk/Reward Ratios, and P&L are calculated instantly based on the currency pair and lot size. You can also manually override any value."
    },
    {
      icon: <Camera size={24} color="#34d399" />,
      title: "Multiple Screenshots",
      desc: "Attach multiple screenshots to each trade setup. The app securely uploads them to Cloudinary and displays them as a beautiful gallery inside your full-screen trade detail view."
    },
    {
      icon: <BarChart3 size={24} color="#a78bfa" />,
      title: "Advanced Analytics",
      desc: "Track your performance over time. View your win rate, average win/loss, risk-to-reward averages, and your maximum drawdown. Filter your trade history by date, pair, or profitability."
    },
    {
      icon: <Bot size={24} color="#f472b6" />,
      title: "AI Trading Assistant",
      desc: "Use the built-in AI Chat to analyze your trades. You can ask for trading advice or upload a chart screenshot directly in the chat to get instant technical analysis."
    },
    {
      icon: <Cloud size={24} color="#fbbf24" />,
      title: "Cloud Sync & Security",
      desc: "Your data is automatically synced to the cloud via Supabase. Access your journal from any device without worrying about losing your trading history."
    },
    {
      icon: <Smartphone size={24} color="#38bdf8" />,
      title: "MT5 Integration (Beta)",
      desc: "Connect your MetaTrader 5 terminal directly to TradeLog Pro using our EA script. Automatically sync open and closed positions without manual data entry."
    }
  ]

  return (
    <div className="page-content" style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="fade-in" style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ 
          width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(59,130,246,0.3)'
        }}>
          <BookOpen size={32} color="white" />
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
          Welcome to <span className="gradient-text">TradeLog Pro</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
          Your professional cloud-based trading journal. Explore the features below to make the most out of your trading analytics.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }} className="stagger-1">
        {features.map((feat, i) => (
          <div key={i} className="glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, transition: 'transform 0.2s', cursor: 'default' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {feat.icon}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{feat.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              {feat.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card stagger-2" style={{ marginTop: 40, padding: 32, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Ready to start journaling?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
            The best time to start analyzing your trading edge is today. Head over to the Dashboard or log your first trade to populate your stats!
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}><CheckCircle size={16} color="#10b981" /> No more spreadsheets</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}><CheckCircle size={16} color="#10b981" /> Interactive UI with instant metrics</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}><CheckCircle size={16} color="#10b981" /> Data stored securely</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default HelpGuide
