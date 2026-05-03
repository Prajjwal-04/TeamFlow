import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils';

const navItems = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/projects', icon: '◫', label: 'Projects' },
  { path: '/tasks', icon: '✓', label: 'All Tasks' },
  { path: '/calendar', icon: '◻', label: 'Calendar' }
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-full bg-slate-900 dark:bg-slate-950 flex flex-col border-r border-slate-800">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            TF
          </div>
          <span className="text-white font-bold text-lg tracking-tight">TeamFlow</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 pt-2 pb-1">Navigation</p>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="text-base w-5 text-center leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-800">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.avatar?.startsWith('https') ? (
              <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-lg object-cover" />
            ) : (
              getInitials(user?.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-slate-500 text-[10px] capitalize">{user?.role}</p>
          </div>
        </NavLink>

        <button
          onClick={handleLogout}
          className="sidebar-link w-full mt-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <span className="text-base w-5 text-center">⎋</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
