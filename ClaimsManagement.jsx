import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  FileImage,
  ClipboardCheck,
  ImageOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getImageUrl } from '../../api/axios';
import { formatDate, getErrorMessage } from '../../constants/campusData';
import AdminLayout from '../../components/AdminLayout';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function ClaimsManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [claims, setClaims] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const { data } = await api.get('/claims', { params });
      setClaims(data.claims || []);
      setCounts(data.counts || { total: 0, pending: 0, approved: 0, rejected: 0 });
      const initialNotes = {};
      (data.claims || []).forEach((c) => {
        initialNotes[c.id] = c.adminNote || '';
      });
      setNotes(initialNotes);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load claims.'));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleAction = async (claimId, nextStatus) => {
    setUpdatingId(claimId);
    try {
      const { data } = await api.patch(`/claims/${claimId}/status`, {
        status: nextStatus,
        adminNote: notes[claimId] || '',
      });
      toast.success(data.message || `Claim updated to ${nextStatus}.`);
      fetchClaims();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const tabs = [
    { key: 'all', label: 'All Claims', count: counts.total },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  return (
    <AdminLayout
      title="Claims Management"
      subtitle="Verify ownership proof, compare Lost vs Found items side by side, and approve safe returns"
    >
      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-72 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={`No ${activeTab === 'all' ? '' : activeTab} claims found`}
          description="Claims submitted by students for campus items will appear here for verification."
        />
      ) : (
        <div className="space-y-6">
          {claims.map((claim) => {
            const busy = updatingId === claim.id;
            return (
              <div
                key={claim.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                {/* Claim Card Header */}
                <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">CLAIM #{claim.id}</span>
                    <StatusBadge status={claim.status} size="md" />
                    <span className="text-xs text-slate-500">
                      Submitted {formatDate(claim.createdAt)}
                    </span>
                  </div>
                  <Link
                    to={`/items/${claim.item.id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Open Item Page &rarr;
                  </Link>
                </div>

                <div className="p-6 space-y-6">
                  {/* Side-by-Side Comparison: Lost Item vs Found Item */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left Panel: Linked Lost Item (or Claimant's Proof Summary) */}
                    <div className="rounded-xl border border-red-200/80 bg-red-50/30 p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-red-700">
                          Lost Item Reference
                        </span>
                        {claim.lostItem ? (
                          <StatusBadge status="lost" />
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400">
                            No lost post linked
                          </span>
                        )}
                      </div>

                      {claim.lostItem ? (
                        <ItemComparisonBlock item={claim.lostItem} />
                      ) : (
                        <div className="flex-1 flex flex-col justify-center items-center text-center py-6 px-4 bg-white/70 rounded-lg border border-dashed border-red-200 text-xs text-slate-500">
                          <p className="font-semibold text-slate-700 mb-1">
                            Direct Claim Without Separate Lost Post
                          </p>
                          <p>
                            Review the claimant&apos;s written ownership proof and supporting photo
                            below against the Found item on the right.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Panel: Claimed / Found Item */}
                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                          {claim.item.type === 'found' ? 'Found Item (Being Claimed)' : 'Reported Item'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={claim.item.type} />
                          {claim.item.status === 'returned' && <StatusBadge status="returned" />}
                        </div>
                      </div>
                      <ItemComparisonBlock item={claim.item} />
                    </div>
                  </div>

                  {/* Claimant Details + Proof */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Claimant Info */}
                    <div className="lg:col-span-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Claimant Details
                      </h4>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-500" />
                        {claim.claimedBy.name}
                      </p>
                      <p className="text-xs text-slate-600 flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {claim.claimedBy.email}
                      </p>
                      {claim.claimedBy.phone && (
                        <p className="text-xs text-slate-600 flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {claim.claimedBy.phone}
                        </p>
                      )}
                      {claim.claimedBy.department && (
                        <p className="text-xs text-slate-600 flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {claim.claimedBy.department}
                        </p>
                      )}
                    </div>

                    {/* Proof Text & Image */}
                    <div className="lg:col-span-8 p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1.5">
                          Ownership Proof / Description
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                          {claim.proofText}
                        </p>
                      </div>
                      {claim.proofImage && (
                        <a
                          href={getImageUrl(claim.proofImage)}
                          target="_blank"
                          rel="noreferrer"
                          className="sm:w-36 shrink-0 group"
                        >
                          <div className="h-28 w-full rounded-lg overflow-hidden border border-indigo-200 bg-white">
                            <img
                              src={getImageUrl(claim.proofImage)}
                              alt="Proof"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 mt-1">
                            <FileImage className="h-3 w-3" />
                            View Proof Photo
                          </span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Admin Note + Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Admin Verification Note <span className="text-slate-400 font-normal">(Sent to claimant)</span>
                      </label>
                      <input
                        type="text"
                        value={notes[claim.id] ?? ''}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [claim.id]: e.target.value }))
                        }
                        placeholder="e.g. Verified student ID and serial number. Ready for pickup at Room 104."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={busy || claim.status === 'approved'}
                        onClick={() => handleAction(claim.id, 'approved')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm disabled:opacity-40 transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve &amp; Mark Returned
                      </button>
                      <button
                        type="button"
                        disabled={busy || claim.status === 'rejected'}
                        onClick={() => handleAction(claim.id, 'rejected')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm disabled:opacity-40 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busy || claim.status === 'pending'}
                        onClick={() => handleAction(claim.id, 'pending')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-40 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset to Pending
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

function ItemComparisonBlock({ item }) {
  const thumb = item.images?.[0] ? getImageUrl(item.images[0]) : '';
  return (
    <div className="flex gap-3.5 bg-white rounded-lg p-3 border border-slate-200/70">
      <div className="h-24 w-24 rounded-lg overflow-hidden bg-slate-100 shrink-0">
        {thumb ? (
          <img src={thumb} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400">
            <ImageOff className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <Link
          to={`/items/${item.id}`}
          className="text-sm font-bold text-slate-900 hover:text-indigo-600 line-clamp-1"
        >
          {item.title}
        </Link>
        <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 text-indigo-500" />
            {item.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            {formatDate(item.date)}
          </span>
        </div>
      </div>
    </div>
  );
}

