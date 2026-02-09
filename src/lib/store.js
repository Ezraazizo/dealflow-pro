import { create } from 'zustand';
import { supabase } from './supabase';
import { ACQUISITION_CHECKLIST, DEVELOPMENT_CHECKLIST } from './constants';

export const useStore = create((set, get) => ({
  // ─── Auth ──────────────────────────────────
  user: null,
  profile: null,
  orgId: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', session.user.id)
        .limit(1)
        .single();

      set({
        user: session.user,
        profile,
        orgId: membership?.org_id || null,
        loading: false,
      });

      if (membership?.org_id) {
        get().fetchDeals();
        get().fetchContacts();
      }
    } else {
      set({ loading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', session.user.id)
          .limit(1)
          .single();

        set({ user: session.user, profile, orgId: membership?.org_id || null });

        if (membership?.org_id) {
          get().fetchDeals();
          get().fetchContacts();
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, orgId: null, deals: [], contacts: [] });
      }
    });
  },

  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;

    // Create org for new user
    if (data.user) {
      const { data: org } = await supabase
        .from('organizations')
        .insert({ name: `${fullName}'s Organization`, created_by: data.user.id })
        .select()
        .single();

      if (org) {
        await supabase.from('org_members').insert({
          org_id: org.id,
          user_id: data.user.id,
          role: 'owner',
        });

        // Create default notification prefs
        await supabase.from('notification_preferences').insert({
          user_id: data.user.id,
          email_digest: true,
          digest_frequency: 'daily',
        });

        set({ orgId: org.id });
      }
    }

    return data;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  // ─── Deals ─────────────────────────────────
  deals: [],

  fetchDeals: async () => {
    const orgId = get().orgId;
    if (!orgId) return;

    const { data: deals } = await supabase
      .from('deals')
      .select(`
        *,
        checklist_items (*),
        deadlines (*),
        documents (*),
        calendar_events (*),
        deal_contacts (
          contacts (*)
        )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    // Transform to flatten contacts
    const transformed = (deals || []).map((d) => ({
      ...d,
      contacts: (d.deal_contacts || []).map((dc) => dc.contacts).filter(Boolean),
      deal_contacts: undefined,
    }));

    set({ deals: transformed });
  },

  createDeal: async (dealData) => {
    const { orgId, user } = get();
    if (!orgId) throw new Error('No organization');

    const checklist =
      dealData.deal_type === 'Acquisition'
        ? ACQUISITION_CHECKLIST
        : DEVELOPMENT_CHECKLIST;

    const { data: deal, error } = await supabase
      .from('deals')
      .insert({ ...dealData, org_id: orgId, created_by: user.id })
      .select()
      .single();

    if (error) throw error;

    // Insert checklist items
    const checklistItems = checklist.map((text, i) => ({
      deal_id: deal.id,
      text,
      is_done: false,
      sort_order: i,
    }));

    await supabase.from('checklist_items').insert(checklistItems);

    // Log activity
    await supabase.from('activity_log').insert({
      deal_id: deal.id,
      user_id: user.id,
      action: 'created',
      details: { name: deal.name },
    });

    get().fetchDeals();
    return deal;
  },

  updateDeal: async (dealId, updates) => {
    const { error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', dealId);

    if (error) throw error;

    // Log activity
    const { user } = get();
    await supabase.from('activity_log').insert({
      deal_id: dealId,
      user_id: user.id,
      action: 'updated',
      details: updates,
    });

    get().fetchDeals();
  },

  deleteDeal: async (dealId) => {
    const { error } = await supabase.from('deals').delete().eq('id', dealId);
    if (error) throw error;
    get().fetchDeals();
  },

  // ─── Checklist ─────────────────────────────
  toggleChecklistItem: async (itemId, isDone) => {
    await supabase
      .from('checklist_items')
      .update({ is_done: isDone })
      .eq('id', itemId);
    get().fetchDeals();
  },

  addChecklistItem: async (dealId, text) => {
    const deal = get().deals.find((d) => d.id === dealId);
    const sortOrder = deal?.checklist_items?.length || 0;

    await supabase.from('checklist_items').insert({
      deal_id: dealId,
      text,
      is_done: false,
      sort_order: sortOrder,
    });
    get().fetchDeals();
  },

  // ─── Deadlines ─────────────────────────────
  addDeadline: async (dealId, deadlineData) => {
    const { error } = await supabase.from('deadlines').insert({
      deal_id: dealId,
      title: deadlineData.title,
      due_date: deadlineData.due_date,
    });
    if (error) throw error;
    get().fetchDeals();
  },

  toggleDeadline: async (deadlineId, isDone) => {
    await supabase
      .from('deadlines')
      .update({ is_done: isDone })
      .eq('id', deadlineId);
    get().fetchDeals();
  },

  // ─── Documents ─────────────────────────────
  uploadDocument: async (dealId, file) => {
    const { user, orgId } = get();
    const filePath = `${orgId}/${dealId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('deal-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    await supabase.from('documents').insert({
      deal_id: dealId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
    });

    get().fetchDeals();
  },

  getDocumentUrl: async (filePath) => {
    const { data } = await supabase.storage
      .from('deal-documents')
      .createSignedUrl(filePath, 3600); // 1hr expiry
    return data?.signedUrl;
  },

  // ─── Contacts ──────────────────────────────
  contacts: [],

  fetchContacts: async () => {
    const orgId = get().orgId;
    if (!orgId) return;

    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('org_id', orgId)
      .order('name');

    set({ contacts: data || [] });
  },

  createContact: async (contactData) => {
    const { orgId } = get();
    const { data, error } = await supabase
      .from('contacts')
      .insert({ ...contactData, org_id: orgId })
      .select()
      .single();

    if (error) throw error;
    get().fetchContacts();
    return data;
  },

  linkContactToDeal: async (dealId, contactId) => {
    const { error } = await supabase.from('deal_contacts').insert({ deal_id: dealId, contact_id: contactId });
    if (error) throw error;
    get().fetchDeals();
  },

  createAndLinkContact: async (dealId, contactData) => {
    const { orgId } = get();
    // Create the contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({ ...contactData, org_id: orgId })
      .select()
      .single();
    
    if (contactError) throw contactError;

    // Link to deal
    const { error: linkError } = await supabase
      .from('deal_contacts')
      .insert({ deal_id: dealId, contact_id: contact.id });
    
    if (linkError) throw linkError;

    get().fetchContacts();
    get().fetchDeals();
    return contact;
  },

  unlinkContact: async (dealId, contactId) => {
    const { error } = await supabase
      .from('deal_contacts')
      .delete()
      .eq('deal_id', dealId)
      .eq('contact_id', contactId);
    if (error) throw error;
    get().fetchDeals();
  },

  // ─── Calendar Events ─────────────────────────────
  addCalendarEvent: async (dealId, eventData) => {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        deal_id: dealId,
        title: eventData.title,
        date: eventData.date,
        time: eventData.time || null,
        type: eventData.type || 'other',
        notes: eventData.notes || '',
        reminder: eventData.reminder !== false,
      })
      .select()
      .single();
    
    if (error) throw error;
    get().fetchDeals();
    return data;
  },

  updateCalendarEvent: async (eventId, eventData) => {
    const { error } = await supabase
      .from('calendar_events')
      .update({
        title: eventData.title,
        date: eventData.date,
        time: eventData.time || null,
        type: eventData.type,
        notes: eventData.notes || '',
        reminder: eventData.reminder !== false,
      })
      .eq('id', eventId);
    
    if (error) throw error;
    get().fetchDeals();
  },

  deleteCalendarEvent: async (eventId) => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);
    
    if (error) throw error;
    get().fetchDeals();
  },
}));
