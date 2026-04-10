import { supabase } from '../lib/supabase'

export const messagesApi = {

  // Get or create conversation for a request
  async getOrCreateConversation(requestId: string) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('request_id', requestId)
      .maybeSingle()

    if (existing) return existing

    const { data: request } = await supabase
      .from('service_requests')
      .select('member_id, assigned_org_id')
      .eq('id', requestId)
      .single()

    if (!request?.assigned_org_id) {
        throw new Error('Cannot start conversation for unassigned request')
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        request_id: requestId,
        member_id: request.member_id,
        organization_id: request.assigned_org_id
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Get messages in a conversation
  async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(full_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  // Send a message
  async send(conversationId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Get all conversations for current user
  async getMyConversations() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        organization:organizations(id, name, logo_url),
        last_message:messages(content, created_at)
      `)
      .eq('member_id', user!.id)
      // Note: order by last_message_at would require a field in conversations
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get all conversations for current organization
  async getMyOrgConversations() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle()
    
    if (!membership?.organization_id) return []

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        member:profiles!member_id(id, full_name, avatar_url),
        last_message:messages(content, created_at)
      `)
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Subscribe to new messages (realtime)
  subscribeToMessages(
    conversationId: string,
    onMessage: (msg: Record<string, unknown>) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, payload => onMessage(payload.new))
      .subscribe()
  }
}
