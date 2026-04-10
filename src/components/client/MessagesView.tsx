import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  User
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    async function loadConversations() {
      try {
        setLoading(true);
        const data = await messagesApi.getMyConversations();
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

    // Subscribe to new messages
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-160px)]">
      <div className="mb-4">
        <h1 className="text-[24px] font-bold tracking-tight text-gray-900 mb-1">Messages</h1>
        <p className="text-gray-500 text-sm">Communicate with service providers and case managers</p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-gray-200 h-full flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col min-w-[300px]">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversationId(conversation.id)}
                className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-teal-50 border-teal-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    {conversation.organization?.logo_url ? (
                        <img src={conversation.organization.logo_url} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className="w-6 h-6 text-teal-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 truncate">{conversation.organization?.name || 'Organization'}</p>
                      <span className="text-[10px] text-gray-400">
                        {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                        {conversation.last_message?.[0]?.content || 'Click to start chatting'}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                No active conversations
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConversationId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{currentConversation?.organization?.name}</p>
                      <p className="text-[11px] text-teal-600 font-medium uppercase tracking-wider">Service Provider</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isMe = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md`}>
                        <div className={`px-4 py-2.5 rounded-2xl ${
                          isMe 
                            ? 'bg-teal-600 text-white rounded-tr-none' 
                            : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none shadow-sm'
                        }`}>
                          <p className="text-sm">{message.content}</p>
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
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-transparent outline-none text-sm transition-all"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="absolute right-2 top-1.5 p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:bg-gray-400"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-gray-400 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Send className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}