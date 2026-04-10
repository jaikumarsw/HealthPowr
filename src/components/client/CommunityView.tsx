import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, Search, X, Send } from 'lucide-react';
import { forumApi } from '../../api/forum';
import { useAuth } from '../../contexts/AuthContext';

type Thread = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  created_at: string;
  comment_count?: number;
  author?: {
    full_name?: string;
  };
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  author?: {
    full_name?: string;
  };
};

export function CommunityView() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [boroughFilter, setBoroughFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', body: '', category: 'housing' });

  useEffect(() => {
    if (!user) return;
    void loadThreads();
  }, [categoryFilter, boroughFilter, user]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const data = await forumApi.getThreads({
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        borough: boroughFilter === 'all' ? undefined : boroughFilter
      });
      setThreads(data);
    } catch {
      // Failed to load threads; UI shows empty list
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !selectedThreadId) return;
    void loadComments(selectedThreadId);
  }, [selectedThreadId, user]);

  const loadComments = async (id: string) => {
    try {
      const data = await forumApi.getComments(id);
      setComments(data);
    } catch {
      // Failed to load comments
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forumApi.createThread(newThread);
      setShowCreateModal(false);
      setNewThread({ title: '', body: '', category: 'housing' });
      loadThreads();
    } catch {
      // Failed to create thread
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedThreadId) return;
    try {
      await forumApi.addComment(selectedThreadId, newComment);
      setNewComment('');
      loadComments(selectedThreadId);
    } catch {
      // Failed to add comment
    }
  };

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 mb-1 uppercase tracking-tight">Community Forum</h1>
          <p className="text-[14px] text-gray-500 uppercase tracking-tight">Connect with others and share information</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-tight hover:bg-teal-700 shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Thread</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 h-12 bg-white border border-gray-200 rounded-2xl shadow-sm focus:border-teal-600 focus:ring-4 focus:ring-teal-50 outline-none transition-all placeholder-gray-400 uppercase tracking-tight"
            />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-12 border border-gray-200 rounded-2xl px-3">
              <option value="all">All Categories</option>
              <option value="housing">Housing</option>
              <option value="food">Food</option>
              <option value="legal">Legal</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="mental_health">Mental Health</option>
              <option value="other">Other</option>
            </select>
            <select value={boroughFilter} onChange={(e) => setBoroughFilter(e.target.value)} className="h-12 border border-gray-200 rounded-2xl px-3">
              <option value="all">All Boroughs</option>
              <option value="Manhattan">Manhattan</option>
              <option value="Brooklyn">Brooklyn</option>
              <option value="Queens">Queens</option>
              <option value="Bronx">Bronx</option>
              <option value="Staten Island">Staten Island</option>
            </select>
          </div>

          {filteredThreads.map(thread => (
            <div 
              key={thread.id} 
              onClick={() => setSelectedThreadId(thread.id)}
              className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:border-teal-600 transition-all cursor-pointer group ${selectedThreadId === thread.id ? 'border-teal-600 ring-2 ring-teal-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">{thread.category ?? 'other'}</span>
                <span className="text-[12px] text-gray-400 font-bold uppercase tracking-tight">{new Date(thread.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-2 uppercase tracking-tight group-hover:text-teal-600 transition-colors">{thread.title}</h3>
              <p className="text-[14px] text-gray-600 mb-4 line-clamp-2">{thread.body}</p>
              <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-gray-400">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-[12px] font-bold uppercase">{thread.comment_count} Comments</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Plus className="w-4 h-4" />
                  <span className="text-[12px] font-bold uppercase">{thread.author?.full_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-[16px] font-bold text-gray-900 mb-2 uppercase tracking-tight">Forum</h3>
            <p className="text-sm text-gray-500">Threads and comments only in Phase 1.</p>
          </div>

          {selectedThread && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[16px] font-bold text-gray-900 uppercase tracking-tight">Discussion</h3>
                <button onClick={() => setSelectedThreadId(null)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                {comments.map(c => (
                  <div key={c.id} className="bg-gray-50 rounded-xl p-4 border border-transparent hover:border-teal-100 transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[12px] font-bold text-teal-600 uppercase tracking-tight">{c.author?.full_name}</span>
                      <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[13px] text-gray-700">{c.content}</p>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-center text-gray-400 text-sm py-4 uppercase tracking-tight">No comments yet</p>}
              </div>

              <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Join the conversation..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-[14px] outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-50 transition-all resize-none h-24"
                />
                <button className="w-full bg-teal-600 text-white h-11 rounded-xl font-bold uppercase tracking-tight hover:bg-teal-700 transition-all flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Post Comment
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-[20px] font-bold text-gray-900 uppercase tracking-tight">Start Discussion</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateThread} className="p-6 space-y-4">
              <div>
                <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Thread Title</label>
                <input
                  required
                  type="text"
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-[14px] focus:border-teal-600 outline-none transition-all"
                  placeholder="What's on your mind?"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Category</label>
                <select 
                  value={newThread.category}
                  onChange={(e) => setNewThread({ ...newThread, category: e.target.value })}
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-[14px] focus:border-teal-600 outline-none uppercase font-bold text-gray-600"
                >
                  <option value="housing">Housing</option>
                  <option value="food">Food</option>
                  <option value="legal">Legal</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="mental_health">Mental Health</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Description</label>
                <textarea
                  required
                  value={newThread.body}
                  onChange={(e) => setNewThread({ ...newThread, body: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-teal-600 transition-all h-32 resize-none"
                  placeholder="Provide more details..."
                />
              </div>
              <button className="w-full bg-teal-600 text-white h-12 rounded-xl font-bold uppercase tracking-tight hover:bg-teal-700 transition-all mt-4">Create Discussion</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}