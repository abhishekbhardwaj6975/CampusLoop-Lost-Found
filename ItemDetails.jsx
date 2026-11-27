import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Tag,
  User,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  Sparkles,
  Trash2,
  CheckCircle2,
  ImageOff,
  Edit3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getImageUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDate, getErrorMessage } from '../constants/campusData';
import StatusBadge from '../components/StatusBadge';
import MatchCard from '../components/MatchCard';
import ClaimModal from '../components/ClaimModal';
import EmptyState from '../components/EmptyState';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [claimOpen, setClaimOpen] = useState(false);

  const loadItem = useCallback(async () => {
    setLoading(true);
    setMatchesLoading(true);
    try {
      const [itemRes, matchRes] = await Promise.all([
        api.get(`/items/${id}`),
        api.get(`/items/${id}/matches`),
      ]);
      setItem(itemRes.data.item);
      setMatches(matchRes.data.matches || []);
      setActiveImg(0);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Item not found.'));
      setItem(null);
    } finally {
      setLoading(false);
      setMatchesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const isOwner = item && user && item.reportedBy?.id === user.id;
  const canManage = isOwner || isAdmin;
  const canClaim =
    item &&
    item.status !== 'returned' &&
    (!user || item.reportedBy?.id !== user.id);

  const handleMarkReturned = async () => {
    try {
      const nextStatus = item.status === 'returned' ? 'open' : 'returned';
      const { data } = await api.patch(`/items/${item.id}/status`, { status: nextStatus });
      setItem(data.item);
      toast.success(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item report?')) return;
    try {
      await api.delete(`/items/${item.id}`);
      toast.success('Item deleted successfully.');
      navigate('/browse');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-6">
        <div className="h-5 w-32 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-96 bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-5 h-96 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          title="Item Not Found"
          description="This item report may have been removed or the link is invalid."
          action={
            <Link
              to="/browse"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              Back to Browse
            </Link>
          }
        />
      </div>
    );
  }

  const images = item.images || [];
  const mainImage = images[activeImg] ? getImageUrl(images[activeImg]) : '';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Browse
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkReturned}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {item.status === 'returned' ? 'Reopen Item' : 'Mark as Returned'}
            </button>
            <Link
              to={`/report?edit=${item.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Main Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Photo Gallery */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden aspect-[16/11] flex items-center justify-center relative">
            {mainImage ? (
              <img
                src={mainImage}
                alt={item.title}
                className="w-full h-full object-contain bg-slate-50"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <ImageOff className="h-12 w-12 mb-2 opacity-60" />
                <p className="text-sm font-medium">No photo uploaded</p>
              </div>
            )}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <StatusBadge status={item.type} size="md" />
              {item.status === 'returned' && <StatusBadge status="returned" size="md" />}
              {item.status === 'claimed' && (
                <StatusBadge status="pending" label="Claim Pending" size="md" />
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImg(idx)}
                  className={`h-20 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImg === idx
                      ? 'border-indigo-600 ring-2 ring-indigo-100'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold mb-3">
                <Tag className="h-3.5 w-3.5" />
                {item.category}
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {item.title}
              </h1>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-indigo-500" />
                  Location
                </span>
                <p className="text-sm font-semibold text-slate-900 mt-1">{item.location}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-indigo-500" />
                  Date {item.type === 'lost' ? 'Lost' : 'Found'}
                </span>
                <p className="text-sm font-semibold text-slate-900 mt-1">{formatDate(item.date)}</p>
              </div>
            </div>

            {/* Claim CTA */}
            <div className="pt-2">
              {item.status === 'returned' ? (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm font-semibold">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                  This item has already been verified and returned to its owner.
                </div>
              ) : isOwner ? (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                  You reported this item. Check the <strong>Possible Matches</strong> below or manage
                  it from your dashboard.
                </div>
              ) : canClaim ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast('Please sign in to submit a claim.');
                      navigate('/login', { state: { from: `/items/${item.id}` } });
                      return;
                    }
                    setClaimOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Claim This Item
                </button>
              ) : null}
            </div>
          </div>

          {/* Reporter Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Reported By
            </h3>
            <div className="flex items-center gap-3.5 mb-3">
              <div className="h-11 w-11 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center shrink-0">
                {item.reportedBy?.name?.charAt(0)?.toUpperCase() || <User className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {item.reportedBy?.name || 'Campus Student'}
                </p>
                {item.reportedBy?.department && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                    <Building2 className="h-3 w-3" />
                    {item.reportedBy.department}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              {item.reportedBy?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{item.reportedBy.email}</span>
                </div>
              )}
              {item.reportedBy?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{item.reportedBy.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Matching Section: Possible Matches */}
      <section className="pt-4 border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
              <Sparkles className="h-4 w-4" />
              Smart Matching Algorithm
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Possible {item.type === 'lost' ? 'Found' : 'Lost'} Matches
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by category, TF-IDF keyword similarity, campus location, and date proximity.
            </p>
          </div>
        </div>

        {matchesLoading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No close matches found yet"
            description={`No opposite ${item.type === 'lost' ? 'found' : 'lost'} items currently score high enough. We'll notify the reporter automatically when a matching item is posted!`}
          />
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <MatchCard key={match.item.id} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* Claim Modal */}
      <ClaimModal
        item={item}
        isOpen={claimOpen}
        onClose={() => setClaimOpen(false)}
        onSuccess={() => loadItem()}
      />
    </div>
  );
}

