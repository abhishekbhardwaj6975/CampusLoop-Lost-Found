import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Calendar, ArrowRight, ImageOff } from 'lucide-react';
import { getImageUrl } from '../api/axios';
import { formatDate } from '../constants/campusData';
import StatusBadge from './StatusBadge';

export default function MatchCard({ match, sourceLabel = null }) {
  const { item, score, reasons = [], breakdown } = match;
  const cover = item.images?.[0] ? getImageUrl(item.images[0]) : '';

  const scoreColor =
    score >= 75
      ? 'text-emerald-700 bg-emerald-50 ring-emerald-600/20'
      : score >= 50
        ? 'text-indigo-700 bg-indigo-50 ring-indigo-600/20'
        : 'text-amber-700 bg-amber-50 ring-amber-600/20';

  const barColor =
    score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-indigo-500' : 'bg-amber-500';

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-4 flex flex-col sm:flex-row gap-4">
      {/* Thumbnail */}
      <Link
        to={`/items/${item.id}`}
        className="sm:w-32 sm:h-28 h-40 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/60"
      >
        {cover ? (
          <img src={cover} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400">
            <ImageOff className="h-6 w-6" />
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            {sourceLabel && (
              <p className="text-[11px] font-medium text-indigo-600 mb-0.5 truncate">
                Matches your {sourceLabel}
              </p>
            )}
            <Link
              to={`/items/${item.id}`}
              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
            >
              {item.title}
            </Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={item.type} />
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${scoreColor}`}
            >
              <Sparkles className="h-3 w-3" />
              {score}% Match
            </span>
          </div>
        </div>

        {/* Score Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-2">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-indigo-500" />
            {item.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {formatDate(item.date)}
          </span>
        </div>

        {reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {reasons.map((r, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
              >
                {r}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          {breakdown ? (
            <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-3">
              <span>Cat {breakdown.category}%</span>
              <span>Keywords {breakdown.keywords}%</span>
              <span>Loc {breakdown.location}%</span>
              <span>Date {breakdown.date}%</span>
            </div>
          ) : (
            <span />
          )}
          <Link
            to={`/items/${item.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Inspect Item
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

