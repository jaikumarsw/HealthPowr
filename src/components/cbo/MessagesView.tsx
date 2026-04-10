import { useState, useEffect, useRef } from 'react';
import { 
  Send, Search, User, ArrowLeft
} from 'lucide-react';
import { messagesApi } from '../../api/messages';
import { useAuth } from '../../contexts/AuthContext';

export function MessagesView() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    async function loadConversations() {
      try {
        setLoading(true);
        const data = await messagesApi.getMyOrgConversations();
        setConversations(data);
        if (data.length > 0) {
          setSelectedConversationId(data[0].id);
        }
      } catch {
        // Failed to load conversations
      } finally {
        setLoading(false);
      }
    }
    void loadConversations();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedConversationId) return;

    async function loadMessages() {
      try {
        const data = await messagesApi.getMessages(selectedConversationId!);
        setMessages(data);
      } catch {
        // Failed to load messages
      }
    }
    loadMessages();

    const subscription = messagesApi.subscribeToMessages(selectedConversationId!, (newMsg) => {
      setMessages(prev => [...prev.filter(m => m.id !== newMsg.id), newMsg]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedConversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedConversationId) {
      try {
        const content = newMessage;
        setNewMessage('');
        await messagesApi.send(selectedConversationId, content);
      } catch {
        // Failed to send message
      }
    }
  };

  const currentConversation = conversations.find(c => c.id === selectedConversationId);
  const filteredConversations = conversations.filter(conv =>
    conv.member?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-[24px] font-bold tracking-tight text-gray-900 mb-1 leading-tight uppercase">Messages</h1>
        <p className="text-[14px] text-gray-500 uppercase tracking-tight">Communicate with clients and track case progress</p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-gray-200 h-[600px] flex overflow-hidden">
        {/* Conversations List */}
        <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[360px] border-r border-gray-200 flex-col flex-shrink-0`}>
          <div className="p-4 border-b border-gray-100">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 h-10 bg-gray-50 border border-gray-200 rounded-lg focus:border-teal-600 focus:ring-4 focus:ring-teal-50 outline-none text-sm placeholder-gray-400 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversationId(conversation.id)}
                className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-teal-50 border-l-4 border-l-teal-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[14px] font-bold text-gray-900 truncate uppercase tracking-tight">{conversation.member?.full_name || 'Member'}</p>
                      <span className="text-[10px] text-gray-400">
                        {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 truncate">{conversation.last_message?.[0]?.content || 'Start chatting...'}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-400 text-sm">No active conversations</div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversationId ? (
          <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 bg-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedConversationId(null)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-50">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-gray-900 truncate uppercase tracking-tight">{currentConversation?.member?.full_name}</p>
                    <p className="text-[11px] text-teal-600 font-bold uppercase tracking-wider">Community Member</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isMe = message.sender_id === user?.id;
                return (
                  <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%] md:max-w-[65%]">
                      <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-teal-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none'
                      }`}>
                        <p>{message.content}</p>
                      </div>
                      <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-teal-600 focus:ring-4 focus:ring-teal-50 outline-none transition-all placeholder-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="absolute right-2 top-1.5 p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-center p-8 bg-gray-50">
            <div>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                <Send className="w-8 h-8 text-teal-600/30" />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 mb-1 uppercase tracking-tight">Select a conversation</h3>
              <p className="text-[13px] text-gray-400 max-w-xs uppercase tracking-tight">Choose a client from the list to start communicating</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}