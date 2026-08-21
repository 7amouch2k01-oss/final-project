import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuthStore } from '../../store/authStore';

export const AIAssistantModal = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `👋 Hi ${user?.name ? `**${user.name}**` : 'there'}! I'm **TuniGuide AI**, your intelligent assistant for **TuniStudy & TuniJob** 🇹🇳.\n\nAsk me anything about universities, internships (Stages), finding jobs, posting "Hire-Me" availability gigs, or navigating the platform!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await api.get('/ai/suggestions');
        setSuggestions(res.data.data.suggestions || []);
      } catch (e) {
        setSuggestions([
          '🎓 Find top universities & courses',
          '💼 Show active internship listings',
          '📢 How to post a Hire-Me gig?',
          '🎓 How does account graduation work?',
        ]);
      }
    };
    fetchSuggestions();
  }, [user]);

  const handleSendMessage = async (textToSend) => {
    const userText = (textToSend || input).trim();
    if (!userText || loading) return;

    const userMsg = {
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: userText,
        history: messages.slice(-6),
      });

      const aiReply = res.data.data.answer;
      const newSuggestions = res.data.data.suggestions;

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);

      if (newSuggestions && newSuggestions.length > 0) {
        setSuggestions(newSuggestions);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: '⚠️ Sorry, I encountered a temporary connection issue. Please try asking again in a moment.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Render markdown-like text with clickable links
  const renderFormattedText = (text) => {
    // Replace [label](url) with clickable buttons/links
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];
      parts.push(
        <button
          key={match.index}
          onClick={() => {
            if (url.startsWith('/')) {
              navigate(url);
              setIsOpen(false);
            } else {
              window.open(url, '_blank');
            }
          }}
          style={{
            background: 'var(--red)',
            color: '#fff',
            border: 'none',
            padding: '3px 10px',
            borderRadius: 'var(--r-full)',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
            margin: '2px 4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 8px var(--red-glow)',
          }}
        >
          {label}
        </button>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.map((p, i) => (typeof p === 'string' ? (
      <span key={i} dangerouslySetInnerHTML={{
        __html: p
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:4px;font-size:0.85em;">$1</code>')
          .replace(/\n/g, '<br/>')
      }} />
    ) : p));
  };

  return (
    <>
      {/* Floating Toggle Trigger Button (Bottom Right) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open TuniGuide AI Assistant"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          padding: isOpen ? '12px 18px' : '14px 22px',
          borderRadius: 'var(--r-full)',
          background: 'linear-gradient(135deg, var(--red), var(--red-hover))',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px var(--red-glow), 0 4px 12px rgba(0,0,0,0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 700,
          fontSize: '0.92rem',
          transition: 'all var(--t-fast)',
          transform: 'scale(1)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ fontSize: '1.25rem' }}>{isOpen ? '✕' : '🤖'}</span>
        <span>{isOpen ? 'Close Assistant' : 'Ask TuniGuide AI'}</span>
        {!isOpen && (
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }} />
        )}
      </button>

      {/* Interactive AI Chat Window */}
      {isOpen && (
        <div
          className="card glass animate-scale-in"
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '24px',
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.85), 0 0 32px var(--red-glow)',
            border: '1px solid var(--red-border)',
            borderRadius: 'var(--r-xl)',
            background: 'rgba(15, 15, 15, 0.94)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                color: '#fff',
                boxShadow: '0 0 12px var(--red-glow)',
              }}>
                🤖
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>TuniGuide AI</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#10b981' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Live Platform Copilot
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setMessages([{
                  sender: 'ai',
                  text: `Chat cleared. How can I help you today?`,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }])}
                title="Clear Chat"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: '4px 8px' }}
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '86%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: m.sender === 'user' ? 'var(--red)' : 'var(--bg-elevated)',
                    color: '#fff',
                    fontSize: '0.86rem',
                    lineHeight: 1.55,
                    border: m.sender === 'user' ? 'none' : '1px solid var(--glass-border)',
                    boxShadow: m.sender === 'user' ? '0 4px 14px var(--red-glow)' : 'none',
                    wordBreak: 'break-word',
                  }}
                >
                  {renderFormattedText(m.text)}
                </div>
                <span style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  padding: '0 4px',
                }}>
                  {m.time}
                </span>
              </div>
            ))}

            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '12px 18px',
                borderRadius: '18px 18px 18px 4px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
              }}>
                <div className="animate-spin" style={{ color: 'var(--red)' }}>⟳</div>
                <span>TuniGuide is analyzing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Chips Bar */}
          {suggestions.length > 0 && (
            <div style={{
              padding: '8px 12px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderTop: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.3)',
              scrollbarWidth: 'none',
            }}>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '6px 12px',
                    borderRadius: 'var(--r-full)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    transition: 'all var(--t-fast)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--red-border)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            style={{
              padding: '12px 16px',
              background: 'var(--bg-elevated)',
              borderTop: '1px solid var(--glass-border)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Ask anything about TuniStudy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--r-full)',
                background: 'var(--bg-base)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: input.trim() ? 'var(--red)' : 'var(--bg-base)',
                color: '#fff',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                transition: 'all var(--t-fast)',
                boxShadow: input.trim() ? '0 0 12px var(--red-glow)' : 'none',
              }}
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistantModal;
