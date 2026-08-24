import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuthStore } from '../../store/authStore';

// Markdown-lite renderer: bold, italic, code, line-breaks, links
const renderText = (text, navigate, closeChat) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'link', label: match[1], url: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: 'text', content: text.substring(lastIndex) });

  return parts.map((part, i) => {
    if (part.type === 'link') {
      return (
        <button
          key={i}
          onClick={() => {
            if (part.url.startsWith('/')) { navigate(part.url); closeChat(); }
            else window.open(part.url, '_blank');
          }}
          style={{
            background: 'var(--red)', color: '#fff', border: 'none',
            padding: '2px 10px', borderRadius: 'var(--r-full)', fontWeight: 700,
            fontSize: '0.8rem', cursor: 'pointer', margin: '1px 3px',
            display: 'inline-flex', alignItems: 'center',
            boxShadow: '0 2px 8px var(--red-glow)', verticalAlign: 'middle',
          }}
        >{part.label}</button>
      );
    }
    const html = part.content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-size:0.85em;font-family:monospace">$1</code>')
      .replace(/\n/g, '<br/>');
    return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
  });
};

const MessageBubble = ({ msg, navigate, closeChat }) => {
  const isUser = msg.sender === 'user';
  return (
    <div style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '88%',
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      animation: 'fadeInUp 0.2s ease',
    }}>
      {!isUser && (
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', paddingLeft: '4px', fontWeight: 600 }}>
          TuniGuide AI
        </span>
      )}
      <div style={{
        padding: '11px 15px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
        background: isUser
          ? 'linear-gradient(135deg, var(--red), var(--red-hover))'
          : 'var(--bg-elevated)',
        color: '#fff',
        fontSize: '0.87rem',
        lineHeight: 1.6,
        border: isUser ? 'none' : '1px solid var(--glass-border)',
        boxShadow: isUser ? '0 4px 16px var(--red-glow)' : '0 2px 8px rgba(0,0,0,0.3)',
        wordBreak: 'break-word',
      }}>
        {renderText(msg.text, navigate, closeChat)}
      </div>
      <span style={{
        fontSize: '0.62rem',
        color: 'var(--text-muted)',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        padding: '0 4px',
      }}>
        {msg.time}
      </span>
    </div>
  );
};

const TypingIndicator = () => (
  <div style={{
    alignSelf: 'flex-start', display: 'flex', alignItems: 'center',
    gap: '8px', padding: '10px 14px',
    background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
    borderRadius: '4px 18px 18px 18px', animation: 'fadeInUp 0.2s ease',
  }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: 'var(--red)', display: 'inline-block',
        animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out`,
      }} />
    ))}
  </div>
);

export const AIAssistantModal = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    const greet = user?.name
      ? `Hey **${user.name}**! I'm **TuniGuide AI**, your assistant for TuniStudy & TuniJob.\n\nAsk me anything about universities, internships, jobs, or navigating the platform. I communicate in English, French, and Tunisian Arabic.`
      : `Welcome! I'm **TuniGuide AI**, your assistant for **TuniStudy & TuniJob**.\n\nAsk me anything about universities, internships (Stages), jobs, or platform features.`;

    setMessages([{ sender: 'ai', text: greet, time: now() }]);
  }, [user]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, loading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    api.get('/ai/suggestions')
      .then(r => setSuggestions(r.data.data.suggestions || []))
      .catch(() => setSuggestions([
        'Find accredited universities in Tunisia',
        'What PFE internships are available?',
        'How do I post a Hire-Me listing?',
        'How does Baccalaureate verification work?',
      ]));
  }, [user]);

  const sendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = { sender: 'user', text, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: text,
        history: messages.slice(-8),
      });

      const { answer, suggestions: newSuggestions } = res.data.data;
      setMessages(prev => [...prev, { sender: 'ai', text: answer, time: now() }]);
      if (newSuggestions?.length) setSuggestions(newSuggestions);
    } catch {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `I encountered an issue reaching the server. Please try asking again in a moment.`,
        time: now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      sender: 'ai',
      text: `Chat cleared. What can I assist you with today?`,
      time: now(),
    }]);
  };

  return (
    <>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 70%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
      `}</style>

      {/* Floating Launcher Button */}
      <button
        onClick={() => { setIsOpen(o => !o); setHasUnread(false); }}
        aria-label="Open TuniGuide AI"
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          padding: '12px 18px', borderRadius: 'var(--r-full)',
          background: 'linear-gradient(135deg, var(--red), var(--red-hover))',
          color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px var(--red-glow), 0 4px 12px rgba(0,0,0,0.5)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          fontWeight: 700, fontSize: '0.86rem', transition: 'all 0.2s ease',
          animation: hasUnread ? 'pulse 1.5s infinite' : 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
      >
        <span style={{ fontWeight: 800 }}>AI</span>
        <span>{isOpen ? 'Close' : 'TuniGuide AI'}</span>
        {!isOpen && (
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="card glass"
          style={{
            position: 'fixed', bottom: '82px', right: '24px',
            width: '400px', maxWidth: 'calc(100vw - 32px)',
            height: '580px', maxHeight: 'calc(100vh - 110px)',
            zIndex: 9998, display: 'flex', flexDirection: 'column',
            padding: 0, overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.85), 0 0 32px var(--red-glow)',
            border: '1px solid var(--red-border)', borderRadius: '20px',
            background: 'rgba(12, 12, 12, 0.96)', backdropFilter: 'blur(24px)',
            animation: 'fadeInUp 0.25s ease',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 18px', background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--red), var(--red-hover))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 800, color: '#fff',
                boxShadow: '0 0 14px var(--red-glow)', flexShrink: 0,
              }}>AI</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>TuniGuide AI</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: '#10b981' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Always online · EN, FR, عربي
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={clearChat} title="Clear chat" style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.78rem', padding: '4px 8px', borderRadius: '6px',
                transition: 'color 0.2s', fontWeight: 600,
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >Clear</button>
              <button onClick={() => setIsOpen(false)} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '1.1rem', padding: '4px 8px', borderRadius: '6px',
              }}>✕</button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px', display: 'flex',
            flexDirection: 'column', gap: '12px',
            scrollbarWidth: 'thin', scrollbarColor: 'var(--glass-border) transparent',
          }}>
            {messages.map((m, i) => (
              <MessageBubble key={i} msg={m} navigate={navigate} closeChat={() => setIsOpen(false)} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {suggestions.length > 0 && !loading && (
            <div style={{
              padding: '8px 12px', display: 'flex', gap: '6px', overflowX: 'auto',
              borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.4)',
              scrollbarWidth: 'none', flexShrink: 0,
            }}>
              {suggestions.slice(0, 4).map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  style={{
                    whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: 'var(--r-full)',
                    background: 'var(--bg-base)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)', fontSize: '0.74rem', cursor: 'pointer',
                    transition: 'all 0.15s', flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--red-border)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'rgba(220,38,38,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'var(--bg-base)';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(); }}
            style={{
              padding: '12px 14px', background: 'var(--bg-elevated)',
              borderTop: '1px solid var(--glass-border)',
              display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask anything... (English, French, or Arabic)"
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '14px',
                background: 'var(--bg-base)', border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)', fontSize: '0.87rem', outline: 'none',
                resize: 'none', maxHeight: '100px', lineHeight: 1.5,
                fontFamily: 'inherit', transition: 'border-color 0.2s',
                scrollbarWidth: 'thin',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--red-border)'}
              onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: input.trim() && !loading ? 'var(--red)' : 'var(--bg-base)',
                color: '#fff', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', transition: 'all 0.2s', flexShrink: 0,
                boxShadow: input.trim() && !loading ? '0 0 14px var(--red-glow)' : 'none',
                transform: input.trim() && !loading ? 'scale(1)' : 'scale(0.9)',
              }}
              onMouseEnter={e => { if (input.trim()) e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading ? '⟳' : '→'}
            </button>
          </form>

          {/* Footer hint */}
          <div style={{
            textAlign: 'center', padding: '6px', fontSize: '0.65rem',
            color: 'var(--text-muted)', background: 'var(--bg-elevated)',
            borderTop: '1px solid var(--glass-border)', flexShrink: 0,
          }}>
            Press <kbd style={{ background: 'var(--bg-base)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.65rem' }}>Enter</kbd> to send · <kbd style={{ background: 'var(--bg-base)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.65rem' }}>Shift+Enter</kbd> for new line
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantModal;
