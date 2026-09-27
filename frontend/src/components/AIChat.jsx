import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, Loader2, Plus, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your AI Trading Assistant. Ask me anything about your trades.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        handleImageSelect(items[i].getAsFile());
        break;
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e, suggestion) => {
    if (e) e.preventDefault();
    const userMessage = suggestion || input;
    if (!userMessage && !imageFile) return;

    let imageUrl = null;
    setIsLoading(true);

    // Upload image if exists
    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.secure_url) {
          imageUrl = data.secure_url;
        }
      } catch (err) {
        console.error('Image upload failed', err);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to upload image.' }]);
        setIsLoading(false);
        return;
      }
    }

    const newMessage = { 
      role: 'user', 
      content: userMessage,
      image: imageUrl
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setImageFile(null);
    setImagePreview(null);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: userMessage, 
          userId: user?.id,
          history: messages.slice(1),
          imageUrl: imageUrl
        }),
      });

      const data = await response.json();
      
      if (data.tradesFound) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.explanation,
          actions: [{ label: 'Confirm Sync All', trades: data.tradesFound }]
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.explanation || data.error || 'Sorry, I encountered an error.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I failed to connect to the assistant.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAdd = async (trades) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/trades/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, trades }),
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: `✅ Successfully added ${data.count} trades to your journal!` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Failed to add trades.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { label: "Why am I losing?", icon: "📉" },
    { label: "Analyze my performance", icon: "📊" },
    { label: "What is my RR ratio?", icon: "⚖️" },
    { label: "How to improve win rate?", icon: "📈" }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fade-in"
        style={{
          position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px', borderRadius: '28px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)', zIndex: 1000
        }}
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div
      className="glass-card fade-in ai-chat-panel"
      style={{
        position: 'fixed', bottom: '24px', right: '24px', width: '400px', height: '600px',
        display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px', background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
        borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bot size={20} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Trading Coach</div>
            <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> AI Analysis Active
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}>
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
              background: msg.role === 'user' ? '#3b82f6' : 'rgba(255,255,255,0.07)', color: 'white', fontSize: '13.5px',
              lineHeight: '1.6', border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {msg.image && (
                <a href={msg.image} target="_blank" rel="noreferrer">
                  <img src={msg.image} alt="User attachment" style={{ width: '100%', borderRadius: 8, marginBottom: 8, maxHeight: 150, objectFit: 'cover' }} />
                </a>
              )}
              {msg.content && <div>{msg.content}</div>}
              {msg.actions && msg.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleBulkAdd(action.trades)}
                  style={{
                    marginTop: '12px', width: '100%', padding: '10px', background: '#10b981', color: 'white',
                    borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Plus size={14} /> {action.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '12px' }}>
            <Loader2 size={14} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> Processing your request...
          </div>
        )}
      </div>

      {/* Image Preview & Input */}
      <div style={{ borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
        {imagePreview && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative', width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button 
                type="button" 
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', padding: 2, cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Image attached</span>
          </div>
        )}
        
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '10px', padding: '16px' }}>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) handleImageSelect(e.target.files[0]);
            }}
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Upload Image"
          >
            <ImageIcon size={18} />
          </button>
          
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)} 
            onPaste={handlePaste}
            placeholder="Ask or paste image here..."
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '13px', outline: 'none' }}
          />
          
          <button type="submit" disabled={isLoading || (!input.trim() && !imageFile)} style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isLoading || (!input.trim() && !imageFile) ? 0.5 : 1 }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
