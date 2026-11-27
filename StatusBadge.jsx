import React from 'react';

const BADGE_STYLES = {
  lost: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  found: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  returned: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/25',
  claimed: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/25',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  rejected: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  open: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20',
};

const DOT_STYLES = {
  lost: 'bg-red-500',
  found: 'bg-emerald-500',
  returned: 'bg-blue-500',
  pending: 'bg-amber-500',
  claimed: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  open: 'bg-indigo-500',
};

const LABELS = {
  lost: 'Lost',
  found: 'Found',
  returned: 'Returned',
  pending: 'Pending',
  claimed: 'Claim Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  open: 'Open',
};

export default function StatusBadge({ status, label, size = 'sm', showDot = true }) {
  const key = String(status || '').toLowerCase();
  const style = BADGE_STYLES[key] || 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300';
  const dot = DOT_STYLES[key] || 'bg-slate-400';
  const text = label || LABELS[key] || status;

  const sizeClass = size === 'md' ? 'px-3 py-1 text-xs font-semibold' : 'px-2.5 py-0.5 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full whitespace-nowrap ${sizeClass} ${style}`}>
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {text}
    </span>
  );
}

