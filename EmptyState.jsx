import React from 'react';
import { PackageSearch } from 'lucide-react';

export default function EmptyState({
  icon: Icon = PackageSearch,
  title = 'No items found',
  description = 'Try adjusting your search or filter criteria.',
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 bg-white rounded-xl border border-dashed border-slate-300">
      <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-5">{description}</p>
      {action}
    </div>
  );
}

