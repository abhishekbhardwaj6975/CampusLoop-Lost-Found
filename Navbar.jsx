import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Menu,
  X,
  Search,
  PlusCircle,
  LayoutDashboard,
  Shield,
  User,
  LogOut,
  CheckCheck,
  Compass,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { formatRelativeTime } from '../constants/campusData';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Ignore silent polling errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    if (!isAuthenticated) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isAuthenticated, location.pathname]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkRead = async (notif) => {
    try {
      if (!notif.isRead) {
        const { data } = await api.patch(`/notifications/${notif.id}/read`);
        setUnreadCount(data.unreadCount ?? Math.max(0, unreadCount - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      }
      setNotifOpen(false);
      if (notif.link) navigate(notif.link);
    } catch {
      if (notif.link) navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      toast.error('Could not mark notifications as read.');
    }
  };

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMobileOpen(false);
    toast.success('Signed out successfully.');
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Compass className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                Campus<span className="text-indigo-600">Loop</span>
              </span>
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Smart Lost &amp; Found
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/browse" className={navLinkClass}>
              Browse Items
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/report" className={navLinkClass}>
                  Report Item
                </NavLink>
                <NavLink to="/dashboard" className={navLinkClass}>
                  My Dashboard
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin" className={navLinkClass}>
                    <span className="inline-flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-indigo-600" />
                      Admin Panel
                    </span>
                  </NavLink>
                )}
              </>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/report"
                  className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  Report Item
                </Link>

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen((v) => !v);
                      setProfileOpen(false);
                    }}
                    className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                          <p className="text-[11px] text-slate-500">
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => handleMarkRead(n)}
                              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                                !n.isRead ? 'bg-indigo-50/40' : ''
                              }`}
                            >
                              <span
                                className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                                  !n.isRead ? 'bg-indigo-600' : 'bg-slate-300'
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-xs leading-relaxed ${
                                    !n.isRead ? 'font-semibold text-slate-900' : 'text-slate-600'
                                  }`}
                                >
                                  {n.message}
                                </p>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                  {formatRelativeTime(n.createdAt)}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen((v) => !v);
                      setNotifOpen(false);
                    }}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white transition-colors"
                  >
                    <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:block text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase">
                          {user?.role}
                        </span>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <LayoutDashboard className="h-4 w-4 text-slate-400" />
                        My Dashboard
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-indigo-700 font-medium hover:bg-indigo-50/70"
                        >
                          <Shield className="h-4 w-4 text-indigo-500" />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        Profile Settings
                      </Link>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg">
          <NavLink to="/" end onClick={() => setMobileOpen(false)} className={({ isActive }) => `block ${navLinkClass({ isActive })}`}>
            Home
          </NavLink>
          <NavLink to="/browse" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block ${navLinkClass({ isActive })}`}>
            <span className="inline-flex items-center gap-2"><Search className="h-4 w-4" /> Browse Items</span>
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/report" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block ${navLinkClass({ isActive })}`}>
                Report Item
              </NavLink>
              <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block ${navLinkClass({ isActive })}`}>
                My Dashboard
              </NavLink>
              <NavLink to="/profile" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block ${navLinkClass({ isActive })}`}>
                Profile
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block ${navLinkClass({ isActive })}`}>
                  Admin Dashboard
                </NavLink>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

