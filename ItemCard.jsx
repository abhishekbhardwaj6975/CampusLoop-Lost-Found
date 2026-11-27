import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, ImageOff, ArrowUpRight } from 'lucide-react';
import { getImageUrl } from '../api/axios';
import { formatDate } from '../constants/campusData';
import StatusBadge from './StatusBadge';

export default function ItemCard({ item }) {
  const coverImage = item.images && item.images.length > 0 ? getImageUrl(item.images[0]) : '';

  return (
    <Link
      to={`/items/${item.id}`}
      className="group flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Image Header */}
      <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50 text-slate-400">
            <ImageOff className="h-8 w-8 mb-1.5 opacity-60" />
            <span className="text-xs font-medium">No photo provided</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={item.type} />
          {item.status === 'returned' && <StatusBadge status="returned" />}
          {item.status === 'claimed' && <StatusBadge status="pending" label="Pending Claim" />}
        </div>

        {/* Category Chip */}
        <div className="absolute bottom-2.5 left-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-slate-700 text-[11px] font-semibold shadow-sm border border-slate-200/60">
            <Tag className="h-3 w-3 text-indigo-500" />
            {item.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-[15px]">
            {item.title}
          </h3>
          <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 mb-3.5 leading-relaxed">
          {item.description}
        </p>

        <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              {formatDate(item.date)}
            </span>
            {item.reportedBy?.name && (
              <span className="truncate text-[11px] text-slate-400">
                by {item.reportedBy.name.split(' ')[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

