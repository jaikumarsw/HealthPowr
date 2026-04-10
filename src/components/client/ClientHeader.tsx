import { useState } from 'react';
import { Bell, Menu, Search, X, UserCog, LogOut, User as UserIcon } from 'lucide-react';
import type { User } from '../../types/user';

interface ClientHeaderProps {
  user: User;
  onLogout: () => void;
  onMenuClick: () => void;
  onAccountSettings?: () => void;
}

export function ClientHeader({ user, onLogout, onMenuClick, onAccountSettings }: ClientHeaderProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const notifications: Array<{ id: number; text: string; time: string }> = [];

  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 h-16 flex items-center flex-shrink-0">
      <div className="w-full px-4 md:px-6 lg:px-8 flex items-center justify-between">

        {/* Left: Hamburger + Logo + Portal Label */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Menu className="w-6 h-6" />
          </button>

          <img src="/logo.png" alt="HealthPowr Logo" className="h-8 md:h-[40px] w-auto flex-shrink-0" />

          <div className="hidden sm:flex items-center ml-3 pl-3 border-l border-gray-200 h-8">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-teal-50 text-teal-600 text-[11px] md:text-[12px] font-medium tracking-wide">
              Client Portal
            </span>
          </div>
        </div>

        {/* Mobile search overlay */}
        {showMobileSearch && (
          <div className="absolute inset-x-0 top-0 h-16 bg-white z-50 flex items-center px-4 gap-3 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search services, organizations..."
              autoFocus
              className="flex-1 h-10 bg-transparent text-[16px] text-gray-900 placeholder-gray-400 outline-none"
            />
            <button onClick={() => setShowMobileSearch(false)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Desktop search */}
        <div className="flex-1 max-w-[480px] mx-4 lg:mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-[14px] h-[14px] text-gray-400" />
            <input
              type="text"
              placeholder="Search services, organizations..."
              className="w-full pl-9 pr-4 h-10 bg-gray-50 border border-gray-200 rounded-[10px] text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 outline-none transition-all"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile search toggle */}
          <button
            onClick={() => setShowMobileSearch(true)}
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-500"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors relative text-gray-500"
            >
              <Bell className="w-5 h-5" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                  <span className="text-xs text-teal-600 font-medium cursor-pointer">Mark all read</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                      <p className="text-sm text-gray-900 leading-snug">{notification.text}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{notification.time}</p>
                    </div>
                  )) : (
                    <div className="p-4 text-sm text-gray-500">No notifications yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          {/* Avatar + dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 transition-colors text-left min-h-[44px]"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full flex-shrink-0 object-cover shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-teal-600 font-semibold text-xs md:text-sm">{initials}</span>
                </div>
              )}
              <div className="hidden lg:block">
                <p className="text-[14px] font-medium text-gray-900 leading-tight">{user.name}</p>
                <p className="text-[12px] text-gray-400 mt-0.5">{user.email}</p>
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-600 font-semibold text-sm">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { onAccountSettings?.(); setShowProfile(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[14px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors min-h-[44px]"
                  >
                    <UserCog className="w-[16px] h-[16px] text-gray-400" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => { setShowProfile(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[14px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors min-h-[44px]"
                  >
                    <UserIcon className="w-[16px] h-[16px] text-gray-400" />
                    <span>My Profile</span>
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button
                    onClick={() => { onLogout(); setShowProfile(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[14px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px]"
                  >
                    <LogOut className="w-[16px] h-[16px]" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
