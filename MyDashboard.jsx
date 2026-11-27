import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Package,
  ClipboardCheck,
  Sparkles,
  Trash2,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getImageUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDate, getErrorMessage } from '../constants/campusData';
import StatusBadge from '../components/StatusBadge';
import MatchCard from '../components/MatchCard';
import EmptyState from '../components/EmptyState';

export default function MyDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('items');
  const [myItems, setMyItems] = useState([]);
  const [smartMatches, setSmartMatches] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, claimsRes] = await Promise.all([
        api.get('/items/my'),
        api.get('/claims/my'),
      ]);
      setMyItems(itemsRes.data.items || []);
      setSmartMatches(itemsRes.data.smartMatches || []);
      setMyClaims(claimsRes.data.claims || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleMarkReturned = async (item) => {
    try {
      const nextStatus = item.status === 'returned' ? 'open' : 'returned';
      await api.patch(`/items/${item.id}/status`, { status: nextStatus });
      toast.success(`Marked "${item.title}" as ${nextStatus}.`);
      loadDashboard();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item report permanently?')) return;
    try {
      await api.delete(`/items/${itemId}`);
      toast.success('Item deleted.');
      loadDashboard();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const pendingClaims = myClaims.filter((c) => c.status === 'pending').length;
  const approvedClaims = myClaims.filter((c) => c.status === 'approved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your reported items, inspect smart matches, and track your ownership claims.
          </p>
        </div>
        <Link
          to="/report"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Report Item
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="My Reported Items" value={myItems.length} accent="text-indigo-600 bg-indigo-50" />
        <SummaryCard label="Smart Matches" value={smartMatches.length} accent="text-amber-600 bg-amber-50" />
        <SummaryCard label="Pending Claims" value={pendingClaims} accent="text-amber-700 bg-amber-50" />
        <SummaryCard label="Approved Claims" value={approvedClaims} accent="text-emerald-600 bg-emerald-50" />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        {[
          { key: 'items', label: `My Reported Items (${myItems.length})`, icon: Package },
          { key: 'claims', label: `My Claims (${myClaims.length})`, icon: ClipboardCheck },
          { key: 'matches', label: `Smart Matches (${smartMatches.length})`, icon: Sparkles },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'items' ? (
        myItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title="You haven't reported any items yet"
            description="Lost something on campus or found someone's belongings? Submit a report in seconds."
            action={
              <Link
                to="/report"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                Report First Item
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {myItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <Link
                  to={`/items/${item.id}`}
                  className="h-24 w-full sm:w-32 rounded-lg overflow-hidden bg-slate-100 shrink-0"
                >
                  {item.images?.[0] ? (
                    <img
                      src={getImageUrl(item.images[0])}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                      No photo
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusBadge status={item.type} />
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-slate-400">{item.category}</span>
                  </div>
                  <Link
                    to={`/items/${item.id}`}
                    className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.location} &middot; {formatDate(item.date)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/items/${item.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleMarkReturned(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {item.status === 'returned' ? 'Reopen' : 'Returned'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    title="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'claims' ? (
        myClaims.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No claims submitted yet"
            description="Browse found items on campus and submit an ownership claim when you spot your belongings."
            action={
              <Link
                to="/browse?type=found"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                Browse Found Items
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {myClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={claim.status} size="md" />
                      <span className="text-xs text-slate-400">
                        Submitted {formatDate(claim.createdAt)}
                      </span>
                    </div>
                    <Link
                      to={`/items/${claim.item.id}`}
                      className="text-base font-bold text-slate-900 hover:text-indigo-600"
                    >
                      {claim.item.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {claim.item.category} &middot; {claim.item.location}
                    </p>
                  </div>

                  <Link
                    to={`/items/${claim.item.id}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Item
                  </Link>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700">
                  <span className="font-bold text-slate-500 block mb-1">Your Proof Submitted:</span>
                  {claim.proofText}
                </div>

                {claim.adminNote && (
                  <div
                    className={`flex items-start gap-2 p-3.5 rounded-xl text-xs border ${
                      claim.status === 'approved'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : claim.status === 'rejected'
                          ? 'bg-red-50 border-red-200 text-red-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Admin Note: </span>
                      {claim.adminNote}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : smartMatches.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No smart matches yet"
          description="Whenever someone reports a matching item for your open reports, the highest-scoring suggestions will appear here."
        />
      ) : (
        <div className="space-y-4">
          {smartMatches.map((m, idx) => (
            <MatchCard
              key={`${m.sourceItem.id}-${m.item.id}-${idx}`}
              match={m}
              sourceLabel={`${m.sourceItem.type} report "${m.sourceItem.title}"`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
      <p className="text-xs font-semibold text-slate-500 mb-2">{label}</p>
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-extrabold text-slate-900">{value}</span>
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${accent}`}>Live</span>
      </div>
    </div>
  );
}

