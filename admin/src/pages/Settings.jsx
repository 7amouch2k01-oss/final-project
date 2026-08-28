import React, { useState } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export default function Settings() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [link, setLink] = useState('/');
  const [sending, setSending] = useState(false);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/admin/broadcast', { title, message, targetRole, link });
      toast.success(`📢 Broadcast sent successfully! (${res.data.data.sent} users received it)`);
      setTitle('');
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">Platform Settings & Control</h1>
        <p className="page-subtitle">Global announcements, broadcast notifications, and system parameters</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        
        {/* Broadcast Notifications Widget */}
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.6rem' }}>📢</span>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>System-wide Broadcast Notification</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', margin: 0 }}>Send real-time alerts to all registered students, citizens, and recruiters</p>
            </div>
          </div>

          <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Target Audience</label>
              <select 
                value={targetRole} 
                onChange={e => setTargetRole(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
              >
                <option value="all">👥 All Users (Everyone)</option>
                <option value="student">🎓 Students Only</option>
                <option value="citizen">💼 Citizens & Job Seekers Only</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Notification Title *</label>
              <input 
                type="text" 
                placeholder="e.g. 📢 Important Update: New University Orientations Open"
                value={title} 
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Message Content *</label>
              <textarea 
                rows="4" 
                placeholder="Write the announcement or alert message here..."
                value={message} 
                onChange={e => setMessage(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Action Link (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. /universities or /jobs"
                value={link} 
                onChange={e => setLink(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={sending}
              className="btn btn-primary"
              style={{ marginTop: '8px', justifyContent: 'center' }}
            >
              {sending ? 'Sending Broadcast...' : '🚀 Send Push Broadcast'}
            </button>
          </form>
        </div>

        {/* Platform Info & Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>⚡ System Environment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-sec)' }}>
              <div>Platform: <strong>TuniVerse Enterprise</strong></div>
              <div>Database: <strong>MongoDB Atlas (Connected)</strong></div>
              <div>Realtime: <strong>Socket.io Active</strong></div>
              <div>Single-Service: <strong>Unified Express Container</strong></div>
              <div>Cloud Storage: <strong>Cloudinary Engine</strong></div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>🔒 Security Policy</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', lineHeight: 1.6 }}>
              All administrative operations are protected with role-based JWT guards, strict rate-limiters, and immutable audit logs.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
