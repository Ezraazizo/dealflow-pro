// Gmail Integration Service
// OAuth2 flow + Gmail API for sending/receiving emails

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
].join(' ');

// ─── Token Management ──────────────────────────────────────

export function getStoredTokens() {
  const stored = localStorage.getItem('gmail_tokens');
  if (!stored) return null;
  
  try {
    const tokens = JSON.parse(stored);
    // Check if expired
    if (tokens.expires_at && Date.now() > tokens.expires_at) {
      localStorage.removeItem('gmail_tokens');
      return null;
    }
    return tokens;
  } catch {
    return null;
  }
}

export function storeTokens(tokens) {
  const toStore = {
    ...tokens,
    expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
  };
  localStorage.setItem('gmail_tokens', JSON.stringify(toStore));
}

export function clearTokens() {
  localStorage.removeItem('gmail_tokens');
  localStorage.removeItem('gmail_profile');
}

export function isGmailConnected() {
  return !!getStoredTokens();
}

export function getGmailProfile() {
  const stored = localStorage.getItem('gmail_profile');
  return stored ? JSON.parse(stored) : null;
}

// ─── OAuth Flow ────────────────────────────────────────────

export function initiateGmailAuth() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.');
  }

  const redirectUri = `${window.location.origin}/auth/google/callback`;
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: GMAIL_SCOPES,
    include_granted_scopes: 'true',
    prompt: 'consent',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function handleAuthCallback() {
  // Parse token from URL hash
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');
  const tokenType = params.get('token_type');
  
  if (!accessToken) {
    throw new Error('No access token received');
  }

  const tokens = {
    access_token: accessToken,
    token_type: tokenType,
    expires_in: parseInt(expiresIn) || 3600,
  };

  storeTokens(tokens);

  // Fetch user profile
  const profile = await fetchGmailProfile(accessToken);
  localStorage.setItem('gmail_profile', JSON.stringify(profile));

  // Clear URL hash
  window.history.replaceState(null, '', window.location.pathname);

  return { tokens, profile };
}

async function fetchGmailProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!response.ok) throw new Error('Failed to fetch profile');
  
  return response.json();
}

// ─── Gmail API Helpers ─────────────────────────────────────

async function gmailFetch(endpoint, options = {}) {
  const tokens = getStoredTokens();
  if (!tokens) throw new Error('Not authenticated with Gmail');

  const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearTokens();
    throw new Error('Gmail session expired. Please reconnect.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gmail API error: ${response.status}`);
  }

  return response.json();
}

// ─── Email Operations ──────────────────────────────────────

export async function listEmails({ query = '', maxResults = 20, pageToken = null, labelIds = ['INBOX'] } = {}) {
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    ...(query && { q: query }),
    ...(pageToken && { pageToken }),
  });
  
  labelIds.forEach(id => params.append('labelIds', id));

  const response = await gmailFetch(`/messages?${params}`);
  
  if (!response.messages) {
    return { messages: [], nextPageToken: null };
  }

  // Fetch full message details
  const messages = await Promise.all(
    response.messages.map(msg => getMessage(msg.id))
  );

  return {
    messages,
    nextPageToken: response.nextPageToken || null,
  };
}

export async function getMessage(messageId) {
  const message = await gmailFetch(`/messages/${messageId}?format=full`);
  return parseMessage(message);
}

export async function getThread(threadId) {
  const thread = await gmailFetch(`/threads/${threadId}?format=full`);
  return {
    id: thread.id,
    messages: thread.messages.map(parseMessage),
  };
}

function parseMessage(message) {
  const headers = message.payload?.headers || [];
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  // Extract body
  let body = '';
  let htmlBody = '';
  
  if (message.payload?.body?.data) {
    body = decodeBase64(message.payload.body.data);
  } else if (message.payload?.parts) {
    const textPart = findPart(message.payload.parts, 'text/plain');
    const htmlPart = findPart(message.payload.parts, 'text/html');
    
    if (textPart?.body?.data) {
      body = decodeBase64(textPart.body.data);
    }
    if (htmlPart?.body?.data) {
      htmlBody = decodeBase64(htmlPart.body.data);
    }
  }

  // Extract attachments
  const attachments = [];
  if (message.payload?.parts) {
    extractAttachments(message.payload.parts, attachments, message.id);
  }

  return {
    id: message.id,
    threadId: message.threadId,
    labelIds: message.labelIds || [],
    snippet: message.snippet || '',
    internalDate: parseInt(message.internalDate),
    date: new Date(parseInt(message.internalDate)),
    from: parseEmailAddress(getHeader('From')),
    to: parseEmailAddresses(getHeader('To')),
    cc: parseEmailAddresses(getHeader('Cc')),
    bcc: parseEmailAddresses(getHeader('Bcc')),
    subject: getHeader('Subject') || '(No Subject)',
    body,
    htmlBody,
    attachments,
    isUnread: message.labelIds?.includes('UNREAD'),
    isStarred: message.labelIds?.includes('STARRED'),
  };
}

function findPart(parts, mimeType) {
  for (const part of parts) {
    if (part.mimeType === mimeType) return part;
    if (part.parts) {
      const found = findPart(part.parts, mimeType);
      if (found) return found;
    }
  }
  return null;
}

function extractAttachments(parts, attachments, messageId) {
  for (const part of parts) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        messageId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size,
      });
    }
    if (part.parts) {
      extractAttachments(part.parts, attachments, messageId);
    }
  }
}

function decodeBase64(data) {
  try {
    return decodeURIComponent(escape(atob(data.replace(/-/g, '+').replace(/_/g, '/'))));
  } catch {
    return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
  }
}

function parseEmailAddress(str) {
  if (!str) return { email: '', name: '' };
  
  const match = str.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
  if (match) {
    return { name: match[1]?.trim() || '', email: match[2]?.trim() || str };
  }
  return { email: str.trim(), name: '' };
}

function parseEmailAddresses(str) {
  if (!str) return [];
  return str.split(',').map(s => parseEmailAddress(s.trim())).filter(a => a.email);
}

// ─── Send Email ────────────────────────────────────────────

export async function sendEmail({ to, cc, bcc, subject, body, htmlBody, replyTo, threadId }) {
  const profile = getGmailProfile();
  const fromEmail = profile?.emailAddress || '';

  // Build MIME message
  const boundary = `boundary_${Date.now()}`;
  
  let mimeMessage = [
    `From: ${fromEmail}`,
    `To: ${Array.isArray(to) ? to.join(', ') : to}`,
    cc ? `Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}` : null,
    bcc ? `Bcc: ${Array.isArray(bcc) ? bcc.join(', ') : bcc}` : null,
    `Subject: ${subject}`,
    replyTo ? `In-Reply-To: ${replyTo}` : null,
    replyTo ? `References: ${replyTo}` : null,
    'MIME-Version: 1.0',
  ].filter(Boolean);

  if (htmlBody) {
    mimeMessage.push(
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      body || stripHtml(htmlBody),
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      htmlBody,
      `--${boundary}--`
    );
  } else {
    mimeMessage.push(
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      body
    );
  }

  const raw = btoa(unescape(encodeURIComponent(mimeMessage.join('\r\n'))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const endpoint = threadId ? `/messages/send?threadId=${threadId}` : '/messages/send';
  
  return gmailFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ raw, threadId }),
  });
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

// ─── Labels & Organization ─────────────────────────────────

export async function listLabels() {
  const response = await gmailFetch('/labels');
  return response.labels || [];
}

export async function createLabel(name, color = null) {
  const body = {
    name,
    labelListVisibility: 'labelShow',
    messageListVisibility: 'show',
  };

  if (color) {
    body.color = {
      backgroundColor: color,
      textColor: '#ffffff',
    };
  }

  return gmailFetch('/labels', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function modifyMessageLabels(messageId, addLabelIds = [], removeLabelIds = []) {
  return gmailFetch(`/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({ addLabelIds, removeLabelIds }),
  });
}

export async function markAsRead(messageId) {
  return modifyMessageLabels(messageId, [], ['UNREAD']);
}

export async function markAsUnread(messageId) {
  return modifyMessageLabels(messageId, ['UNREAD'], []);
}

export async function starMessage(messageId) {
  return modifyMessageLabels(messageId, ['STARRED'], []);
}

export async function unstarMessage(messageId) {
  return modifyMessageLabels(messageId, [], ['STARRED']);
}

export async function archiveMessage(messageId) {
  return modifyMessageLabels(messageId, [], ['INBOX']);
}

export async function trashMessage(messageId) {
  return gmailFetch(`/messages/${messageId}/trash`, { method: 'POST' });
}

// ─── Search Helpers ────────────────────────────────────────

export function buildSearchQuery({ from, to, subject, hasAttachment, after, before, labels, terms }) {
  const parts = [];
  
  if (from) parts.push(`from:${from}`);
  if (to) parts.push(`to:${to}`);
  if (subject) parts.push(`subject:${subject}`);
  if (hasAttachment) parts.push('has:attachment');
  if (after) parts.push(`after:${formatDate(after)}`);
  if (before) parts.push(`before:${formatDate(before)}`);
  if (labels?.length) labels.forEach(l => parts.push(`label:${l}`));
  if (terms) parts.push(terms);

  return parts.join(' ');
}

function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

// Search for emails related to a deal
export async function searchDealEmails(deal) {
  const queries = [];
  
  // Search by address
  if (deal.address) {
    queries.push(deal.address);
  }
  
  // Search by deal name
  if (deal.name) {
    queries.push(`"${deal.name}"`);
  }
  
  // Search by contact emails
  const contactEmails = (deal.contacts || [])
    .map(c => c.email)
    .filter(Boolean);
  
  if (contactEmails.length > 0) {
    queries.push(`{from:${contactEmails.join(' OR from:')} to:${contactEmails.join(' OR to:')}}`);
  }

  // Combine with OR
  const query = queries.join(' OR ');
  
  return listEmails({ query, maxResults: 50 });
}

// ─── Email Templates ───────────────────────────────────────

export const EMAIL_TEMPLATES = {
  loi: {
    name: 'Letter of Intent',
    subject: 'Letter of Intent - {{address}}',
    body: `Dear {{contact_name}},

Please find attached our Letter of Intent for the property located at {{address}}.

Key terms:
- Purchase Price: {{purchase_price}}
- Due Diligence Period: 30 days
- Closing: 60 days from contract execution

We are prepared to move quickly and have financing in place. Please let us know if you have any questions.

Best regards,
{{sender_name}}`,
  },
  
  follow_up: {
    name: 'Follow Up',
    subject: 'Following Up - {{address}}',
    body: `Hi {{contact_name}},

I wanted to follow up on our conversation regarding {{address}}. 

Are there any updates on the property? We remain very interested and would love to schedule a time to discuss further.

Best,
{{sender_name}}`,
  },
  
  broker_outreach: {
    name: 'Broker Outreach',
    subject: 'Acquisition Interest - {{address}}',
    body: `Hi {{contact_name}},

I hope this email finds you well. I'm reaching out regarding the property at {{address}}.

We are an active buyer in the area and this property fits our acquisition criteria. Would the owner be interested in discussing a potential sale?

A few things about us:
- We can close quickly (30-45 days)
- We have financing in place
- We are flexible on deal structure

Please let me know if this is something worth exploring.

Best regards,
{{sender_name}}`,
  },
  
  due_diligence_request: {
    name: 'Due Diligence Request',
    subject: 'Due Diligence Documents Request - {{address}}',
    body: `Hi {{contact_name}},

As we proceed with our due diligence on {{address}}, we would appreciate receiving the following documents:

1. Rent roll (current)
2. Operating statements (last 3 years)
3. Property tax bills
4. Utility bills (last 12 months)
5. Service contracts
6. Certificate of Occupancy
7. Building plans/surveys (if available)
8. Environmental reports (if any)

Please let us know if you need any additional information from our side.

Thank you,
{{sender_name}}`,
  },
  
  thank_you_meeting: {
    name: 'Thank You (After Meeting)',
    subject: 'Thank You - {{address}} Meeting',
    body: `Hi {{contact_name}},

Thank you for taking the time to meet with us today regarding {{address}}. We enjoyed learning more about the property and appreciate you sharing the details.

As discussed, we will {{next_steps}}.

Please don't hesitate to reach out if you have any questions in the meantime.

Best regards,
{{sender_name}}`,
  },

  offer_submission: {
    name: 'Offer Submission',
    subject: 'Formal Offer - {{address}}',
    body: `Dear {{contact_name}},

Please find our formal offer for the property at {{address}}.

Offer Details:
- Purchase Price: {{purchase_price}}
- Earnest Money: 5% at contract signing
- Due Diligence Period: 30 days
- Closing: 60 days from contract execution
- Financing: {{financing_type}}

This offer is subject to satisfactory due diligence and final approval of financing terms.

We look forward to your response.

Best regards,
{{sender_name}}`,
  },
};

export function fillTemplate(template, variables) {
  let { subject, body } = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value || '');
    body = body.replace(regex, value || '');
  });
  
  return { subject, body };
}

// ─── Export ────────────────────────────────────────────────

export const GmailAPI = {
  // Auth
  initiateGmailAuth,
  handleAuthCallback,
  isGmailConnected,
  getGmailProfile,
  clearTokens,
  
  // Messages
  listEmails,
  getMessage,
  getThread,
  sendEmail,
  searchDealEmails,
  
  // Labels
  listLabels,
  createLabel,
  modifyMessageLabels,
  markAsRead,
  markAsUnread,
  starMessage,
  unstarMessage,
  archiveMessage,
  trashMessage,
  
  // Helpers
  buildSearchQuery,
  
  // Templates
  EMAIL_TEMPLATES,
  fillTemplate,
};

export default GmailAPI;
