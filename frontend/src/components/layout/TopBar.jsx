import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { notificationsAPI } from '../../api';
import { formatRelative } from '../../utils';

export default function TopBar({ onMenuClick }) {
  const { dark, toggle } = useTheme();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const ref = useRef();

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadNotifs = async () => {
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifs(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {}
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3 sticky top-0 z-10">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        ☰
      </button>

      <div className="flex-1" />

      {/* Dark mode toggle */}
      <button
        onClick={toggle}
        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-lg"
        title={dark ? 'Light mode' : 'Dark mode'}
      >
        {dark ? '☀' : '☽'}
      </button>

      {/* Notifications */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="text-lg">🔔</span>
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold animate-pulse-dot">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="absolute right-0 top-full mt-2 w-80 card shadow-xl z-50 animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</h3>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-indigo-500 hover:text-indigo-600">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500">No notifications</p>
              ) : (
                notifs.slice(0, 10).map(n => (
                  <div
                    key={n._id}
                    className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 ${!n.read ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
                  >
                    <p className="text-xs text-slate-800 dark:text-slate-200">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatRelative(n.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
