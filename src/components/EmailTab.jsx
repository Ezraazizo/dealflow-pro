import { useState, useEffect } from 'react';
import { GmailAPI, EMAIL_TEMPLATES, fillTemplate } from '../lib/gmailAPI';
import {
  Mail, Send, Inbox, RefreshCw, Loader, AlertTriangle, Check, Star, Paperclip,
  ChevronDown, ChevronUp, X, Plus, Clock, Archive, Trash2, Reply, ExternalLink,
  FileText, User, Search, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmailTab({ deal, theme }) {
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composing, setComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    replyTo: null,
    threadId: null,
  });

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (connected && deal) {
      fetchDealEmails();
    }
  }, [connected, deal?.id]);

  const checkConnection = () => {
    const isConnected = GmailAPI.isGmailConnected();
    setConnected(isConnected);
    if (isConnected) {
      setProfile(GmailAPI.getGmailProfile());
    }
    setLoading(false);
  };

  const handleConnect = () => {
    try {
      GmailAPI.initiateGmailAuth();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDisconnect = () => {
    GmailAPI.clearTokens();
    setConnected(false);
    setProfile(null);
    setEmails([]);
    toast.success('Gmail disconnected');
  };

  const fetchDealEmails = async () => {
    setLoading(true);
    try {
      const result = await GmailAPI.searchDealEmails(deal);
      setEmails(result.messages || []);
    } catch (err) {
      if (err.message.includes('expired')) {
        setConnected(false);
        toast.error('Gmail session expired. Please reconnect.');
      } else {
        toast.error('Failed to fetch emails');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchDealEmails();
      return;
    }

    setLoading(true);
    try {
      const result = await GmailAPI.listEmails({
        query: searchQuery,
        maxResults: 30,
      });
      setEmails(result.messages || []);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const openCompose = (template = null, replyTo = null) => {
    let data = {
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      body: '',
      replyTo: null,
      threadId: null,
    };

    // Pre-fill recipient from deal contacts
    const primaryContact = deal.contacts?.find(c => c.email);
    if (primaryContact) {
      data.to = primaryContact.email;
    }

    // Apply template
    if (template) {
      const variables = {
        address: deal.address || deal.name || '',
        contact_name: primaryContact?.name?.split(' ')[0] || '',
        purchase_price: deal.purchase_price ? `$${deal.purchase_price.toLocaleString()}` : '[PRICE]',
        sender_name: profile?.emailAddress?.split('@')[0] || '',
        financing_type: 'Cash / Conventional',
        next_steps: '[next steps]',
      };
      const filled = fillTemplate(template, variables);
      data.subject = filled.subject;
      data.body = filled.body;
    }

    // Handle reply
    if (replyTo) {
      data.to = replyTo.from.email;
      data.subject = replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`;
      data.replyTo = replyTo.id;
      data.threadId = replyTo.threadId;
      data.body = `\n\n---\nOn ${replyTo.date.toLocaleDateString()}, ${replyTo.from.name || replyTo.from.email} wrote:\n\n${replyTo.body}`;
    }

    setComposeData(data);
    setShowCompose(true);
    setShowTemplates(false);
  };

  const handleSend = async () => {
    if (!composeData.to.trim()) {
      toast.error('Please enter a recipient');
      return;
    }

    setComposing(true);
    try {
      await GmailAPI.sendEmail({
        to: composeData.to,
        cc: composeData.cc || undefined,
        bcc: composeData.bcc || undefined,
        subject: composeData.subject,
        body: composeData.body,
        replyTo: composeData.replyTo,
        threadId: composeData.threadId,
      });
      
      toast.success('Email sent!');
      setShowCompose(false);
      setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '', replyTo: null, threadId: null });
      
      // Refresh emails
      setTimeout(fetchDealEmails, 2000);
    } catch (err) {
      toast.error(err.message || 'Failed to send email');
    } finally {
      setComposing(false);
    }
  };

  const handleArchive = async (emailId) => {
    try {
      await GmailAPI.archiveMessage(emailId);
      setEmails(emails.filter(e => e.id !== emailId));
      toast.success('Email archived');
    } catch (err) {
      toast.error('Failed to archive');
    }
  };

  const handleStar = async (email) => {
    try {
      if (email.isStarred) {
        await GmailAPI.unstarMessage(email.id);
      } else {
        await GmailAPI.starMessage(email.id);
      }
      setEmails(emails.map(e => e.id === email.id ? { ...e, isStarred: !e.isStarred } : e));
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const d = new Date(date);
    
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    }
    
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const cardStyle = {
    background: theme.bgCard,
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: 20,
  };

  const inputStyle = {
    background: theme.bgElevated,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: '10px 14px',
    color: theme.text,
    fontSize: 14,
    outline: 'none',
    width: '100%',
  };

  // Not connected state
  if (!connected) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: `${theme.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: theme.accent }}>
          <Mail size={40} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Connect Gmail</h3>
        <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
          Connect your Gmail account to send and receive emails directly from DealFlow Pro. Emails will be automatically linked to this deal.
        </p>
        <button
          onClick={handleConnect}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 28px',
            background: '#4285f4',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Connect with Google
        </button>
        <p style={{ fontSize: 11, color: theme.textDim, marginTop: 16 }}>
          We only request permission to read and send emails. Your data stays secure.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${theme.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent }}>
            <Mail size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Email</h4>
            <p style={{ fontSize: 11, color: theme.textDim, margin: 0 }}>{profile?.emailAddress}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchDealEmails}
            disabled={loading}
            style={{ padding: '8px 12px', background: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12, color: theme.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              style={{ padding: '8px 12px', background: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12, color: theme.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <FileText size={14} /> Templates
              <ChevronDown size={12} />
            </button>
            {showTemplates && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 8, minWidth: 200, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => openCompose(template)}
                    style={{ display: 'block', width: '100%', padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: theme.text, cursor: 'pointer', borderRadius: 6 }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => openCompose()}
            style={{ padding: '8px 14px', background: theme.accent, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Compose
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textDim }} />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ ...inputStyle, paddingLeft: 38 }}
          />
        </div>
        <button
          onClick={handleSearch}
          style={{ padding: '10px 16px', background: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 13, color: theme.text, cursor: 'pointer' }}
        >
          Search
        </button>
      </div>

      {/* Email List */}
      {loading && emails.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Loader size={32} style={{ marginBottom: 16, color: theme.accent, animation: 'spin 1s linear infinite' }} />
          <p style={{ color: theme.textDim }}>Loading emails...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : emails.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: theme.textDim }}>
          <Inbox size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: theme.text }}>No Emails Found</p>
          <p style={{ fontSize: 13 }}>No emails matching this deal were found. Try composing a new email or adjusting your search.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Email List */}
          <div style={{ width: selectedEmail ? 320 : '100%', transition: 'width 0.2s' }}>
            {emails.map((email) => (
              <div
                key={email.id}
                onClick={() => {
                  setSelectedEmail(email);
                  if (email.isUnread) {
                    GmailAPI.markAsRead(email.id);
                    setEmails(emails.map(e => e.id === email.id ? { ...e, isUnread: false } : e));
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 16px',
                  background: selectedEmail?.id === email.id ? theme.accentDim : email.isUnread ? theme.bgElevated : theme.bgCard,
                  border: `1px solid ${selectedEmail?.id === email.id ? theme.accent : theme.border}`,
                  borderRadius: 10,
                  marginBottom: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); handleStar(email); }}
                  style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: email.isStarred ? '#f59e0b' : theme.textDim }}
                >
                  <Star size={16} fill={email.isStarred ? '#f59e0b' : 'none'} />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: email.isUnread ? 700 : 500, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email.from.name || email.from.email}
                    </span>
                    <span style={{ fontSize: 11, color: theme.textDim, flexShrink: 0, marginLeft: 8 }}>{formatDate(email.date)}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: email.isUnread ? 600 : 400, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.subject}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.snippet}
                  </div>
                  {email.attachments?.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, color: theme.textDim }}>
                      <Paperclip size={12} />
                      <span style={{ fontSize: 11 }}>{email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Email Detail */}
          {selectedEmail && (
            <div style={{ flex: 1, ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 8 }}>{selectedEmail.subject}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600 }}>
                      {(selectedEmail.from.name || selectedEmail.from.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{selectedEmail.from.name || selectedEmail.from.email}</div>
                      <div style={{ fontSize: 11, color: theme.textDim }}>
                        to {selectedEmail.to.map(t => t.name || t.email).join(', ')}
                        {selectedEmail.cc?.length > 0 && `, cc: ${selectedEmail.cc.map(t => t.email).join(', ')}`}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openCompose(null, selectedEmail)} style={{ padding: 8, background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', borderRadius: 6 }} title="Reply">
                    <Reply size={16} />
                  </button>
                  <button onClick={() => handleArchive(selectedEmail.id)} style={{ padding: 8, background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', borderRadius: 6 }} title="Archive">
                    <Archive size={16} />
                  </button>
                  <button onClick={() => setSelectedEmail(null)} style={{ padding: 8, background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', borderRadius: 6 }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div style={{ padding: 20, maxHeight: 400, overflowY: 'auto' }}>
                <div style={{ fontSize: 11, color: theme.textDim, marginBottom: 16 }}>
                  {selectedEmail.date.toLocaleString()}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {selectedEmail.body || <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} />}
                </div>
                {selectedEmail.attachments?.length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Attachments</div>
                    {selectedEmail.attachments.map((att, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: theme.bgElevated, borderRadius: 6, marginBottom: 4 }}>
                        <Paperclip size={14} color={theme.textDim} />
                        <span style={{ fontSize: 13 }}>{att.filename}</span>
                        <span style={{ fontSize: 11, color: theme.textDim }}>({Math.round(att.size / 1024)} KB)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowCompose(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, width: 600, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                {composeData.replyTo ? 'Reply' : 'New Email'}
              </h3>
              <button onClick={() => setShowCompose(false)} style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: theme.textDim, marginBottom: 4, display: 'block' }}>To</label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  style={inputStyle}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: theme.textDim, marginBottom: 4, display: 'block' }}>CC</label>
                  <input
                    type="email"
                    placeholder="cc@example.com"
                    value={composeData.cc}
                    onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: theme.textDim, marginBottom: 4, display: 'block' }}>BCC</label>
                  <input
                    type="email"
                    placeholder="bcc@example.com"
                    value={composeData.bcc}
                    onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: theme.textDim, marginBottom: 4, display: 'block' }}>Subject</label>
                <input
                  type="text"
                  placeholder="Email subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  style={inputStyle}
                />
              </div>
              
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: theme.textDim, marginBottom: 4, display: 'block' }}>Message</label>
                <textarea
                  placeholder="Write your message..."
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  style={{ ...inputStyle, minHeight: 250, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                />
              </div>
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: theme.textDim }}>
                Sending as {profile?.emailAddress}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowCompose(false)}
                  style={{ padding: '10px 18px', background: 'none', border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 14, color: theme.textSecondary, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={composing}
                  style={{ padding: '10px 18px', background: theme.accent, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {composing ? <Loader size={16} className="spin" /> : <Send size={16} />}
                  {composing ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect option */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: theme.textDim }}>
          Connected to {profile?.emailAddress}
        </span>
        <button
          onClick={handleDisconnect}
          style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Disconnect Gmail
        </button>
      </div>
    </div>
  );
}
