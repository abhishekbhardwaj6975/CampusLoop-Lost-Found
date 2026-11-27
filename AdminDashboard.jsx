import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Users,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatDate, getErrorMessage } from '../../constants/campusData';
import AdminLayout from '../../components/AdminLayout';
import StatusBadge from '../../components/StatusBadge';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/stats')
      .then(({ data }) => setStats(data.stats))
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load admin statistics.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Campus-wide overview of lost items, found reports, users, and claim verification"
    >
      {loading || !stats ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-28 bg-white rounded-xl border border-slate-200" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 h-80 bg-white rounded-xl border border-slate-200" />
            <div className="lg:col-span-5 h-80 bg-white rounded-xl border border-slate-200" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <AdminStatCard
              icon={Package}
              label="Total Items"
              value={stats.totalItems}
              color="bg-indigo-50 text-indigo-600"
            />
            <AdminStatCard
              icon={AlertTriangle}
              label="Lost Reports"
              value={stats.lostItems}
              color="bg-red-50 text-red-600"
            />
            <AdminStatCard
              icon={CheckCircle2}
              label="Found Reports"
              value={stats.foundItems}
              color="bg-emerald-50 text-emerald-600"
            />
            <AdminStatCard
              icon={HeartHandshake}
              label="Returned"
              value={stats.returnedItems}
              color="bg-blue-50 text-blue-600"
            />
            <AdminStatCard
              icon={ClipboardCheck}
              label="Pending Claims"
              value={stats.claims?.pending || 0}
              color="bg-amber-50 text-amber-600"
              extra={`${stats.totalUsers} Users`}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Items by Category Bar Chart */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900">Items by Category</h2>
                <p className="text-xs text-slate-500">Comparison of Lost vs Found reports per category</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.categoryBreakdown || []}
                    margin={{ top: 8, right: 16, left: -12, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                      height={54}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="lost" name="Lost" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="found" name="Found" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lost vs Found Donut Chart */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col">
              <div className="mb-2">
                <h2 className="text-base font-bold text-slate-900">Lost vs Found Split</h2>
                <p className="text-xs text-slate-500">Overall ratio across active &amp; returned reports</p>
              </div>
              <div className="h-60 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.lostVsFound || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={4}
                    >
                      {(stats.lostVsFound || []).map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-900">{stats.claims?.pending || 0}</p>
                  <p className="text-[11px] text-amber-600 font-medium">Pending</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-900">{stats.claims?.approved || 0}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">Approved</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-900">{stats.claims?.rejected || 0}</p>
                  <p className="text-[11px] text-red-600 font-medium">Rejected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Quick Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Claims Queue */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Pending Claims Queue</h2>
                <Link
                  to="/admin/claims"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Review All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {(stats.recentClaims || []).length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">
                  No pending claims waiting for review.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.recentClaims.map((claim) => (
                    <div key={claim.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {claim.item.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          Claimed by {claim.claimedBy.name} &middot; {formatDate(claim.createdAt)}
                        </p>
                      </div>
                      <Link
                        to="/admin/claims"
                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold shrink-0"
                      >
                        Verify
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Items */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Latest Campus Reports</h2>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Browse All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {(stats.recentItems || []).map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/items/${item.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-indigo-600 truncate block"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-slate-500 truncate">
                        {item.location} &middot; {formatDate(item.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={item.type} />
                      {item.status === 'returned' && <StatusBadge status="returned" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick User Management Link */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">
                  {stats.totalUsers} Registered Campus Accounts
                </h3>
                <p className="text-xs text-indigo-100">
                  Review student accounts, manage suspensions, or moderate spam reports.
                </p>
              </div>
            </div>
            <Link
              to="/admin/users"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold shrink-0 transition-colors"
            >
              Manage Users
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function AdminStatCard({ icon: Icon, label, value, color, extra }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {extra && (
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            {extra}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-1.5">{label}</p>
    </div>
  );
}

