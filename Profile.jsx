import React, { useState } from 'react';
import { User, Phone, Building2, Mail, Lock, Save, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS, formatDate, getErrorMessage } from '../constants/campusData';

export default function Profile() {
  const { user, updateUserState } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || 'B.Tech CSE',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPass, setSavingPass] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (profileForm.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters.');
      return;
    }
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', profileForm);
      updateUserState(data.user);
      toast.success(data.message || 'Profile updated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setSavingPass(true);
    try {
      const { data } = await api.put('/auth/password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      toast.success(data.message || 'Password updated!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white text-2xl font-extrabold flex items-center justify-center shadow-md shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900">{user?.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase">
              {user?.role}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {user?.email}
          </p>
          <p className="text-xs text-slate-400 mt-1">Member since {formatDate(user?.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Personal Details */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <User className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Personal Details</h2>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={profileForm.name}
              onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={profileForm.department}
                onChange={(e) => setProfileForm((p) => ({ ...p, department: e.target.value }))}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm bg-white outline-none"
              >
                {!DEPARTMENTS.includes(profileForm.department) && profileForm.department && (
                  <option value={profileForm.department}>{profileForm.department}</option>
                )}
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm disabled:opacity-60 transition-colors"
          >
            <Save className="h-4 w-4" />
            {savingProfile ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>

        {/* Change Password */}
        <form
          onSubmit={handleSavePassword}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <KeyRound className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Change Password</h2>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={passForm.currentPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, currentPassword: e.target.value }))}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={passForm.newPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPass}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm disabled:opacity-60 transition-colors"
          >
            <KeyRound className="h-4 w-4" />
            {savingPass ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

