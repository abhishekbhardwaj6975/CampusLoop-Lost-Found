import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShieldBan, ShieldCheck, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getErrorMessage } from '../../constants/campusData';
import AdminLayout from '../../components/AdminLayout';
import EmptyState from '../../components/EmptyState';

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load users.'));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(), 250);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const handleToggleBlock = async (targetUser) => {
    try {
      const { data } = await api.patch(`/admin/users/${targetUser.id}`, {
        isBlocked: !targetUser.isBlocked,
      });
      toast.success(data.message);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isBlocked: !u.isBlocked } : u))
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (targetUser) => {
    if (
      !window.confirm(
        `Delete account "${targetUser.name}"? All their reported items and claims will also be removed.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/admin/users/${targetUser.id}`);
      toast.success('User deleted.');
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <AdminLayout
      title="Manage Users"
      subtitle="View registered students and admins, suspend abusive accounts, or remove inactive users"
    >
      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 outline-none focus:border-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-lg" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Try clearing your search query or role filter."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4 text-center">Activity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {u.name} {isSelf && <span className="text-xs text-indigo-600">(You)</span>}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {u.department || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            u.role === 'admin'
                              ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{u.itemsCount}</span> items &middot;{' '}
                        <span className="font-semibold text-slate-900">{u.claimsCount}</span> claims
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 ring-1 ring-red-600/20 text-xs font-semibold">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 text-xs font-semibold">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {isSelf ? (
                          <span className="text-xs text-slate-400">Current Admin</span>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleBlock(u)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                u.isBlocked
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              }`}
                            >
                              {u.isBlocked ? (
                                <>
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <ShieldBan className="h-3.5 w-3.5" />
                                  Block
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(u)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

