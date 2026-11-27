import React, { useState, useEffect } from 'react';
import { X, Upload, ShieldCheck, FileImage, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { getErrorMessage } from '../constants/campusData';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export default function ClaimModal({ item, isOpen, onClose, onSuccess }) {
  const [proofText, setProofText] = useState('');
  const [lostItemId, setLostItemId] = useState('');
  const [myLostItems, setMyLostItems] = useState([]);
  const [proofFile, setProofFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setProofText('');
    setProofFile(null);
    setPreviewUrl('');

    // Fetch student's own lost items so they can link it for side-by-side admin review
    api
      .get('/items/my')
      .then(({ data }) => {
        const lostList = (data.items || []).filter(
          (i) => i.type === 'lost' && i.status !== 'returned' && i.id !== item.id
        );
        setMyLostItems(lostList);
        // Auto-select matching category lost item if available
        const sameCat = lostList.find((i) => i.category === item.category);
        if (sameCat) setLostItemId(String(sameCat.id));
      })
      .catch(() => setMyLostItems([]));
  }, [isOpen, item.id, item.category]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WEBP, or GIF images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Proof image must be smaller than 5MB.');
      return;
    }

    setError('');
    setProofFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (proofText.trim().length < 10) {
      setError('Please describe specific identifying details (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('itemId', String(item.id));
      if (lostItemId) formData.append('lostItemId', lostItemId);
      formData.append('proofText', proofText.trim());
      if (proofFile) formData.append('proofImage', proofFile);

      const { data } = await api.post('/claims', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(data.message || 'Claim submitted for admin verification!');
      onSuccess?.(data.claim);
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Submit Ownership Claim</h2>
              <p className="text-xs text-slate-500 line-clamp-1">For: {item.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {myLostItems.length > 0 && item.type === 'found' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Link Your Lost Item Report <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={lostItemId}
                onChange={(e) => setLostItemId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="">— Do not link a lost report —</option>
                {myLostItems.map((lost) => (
                  <option key={lost.id} value={lost.id}>
                    {lost.title} ({lost.location})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Linking helps the admin compare your Lost report side-by-side with this Found item.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Proof of Ownership <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              placeholder="Describe unique marks, serial numbers, wallpaper, contents inside, stickers, or purchase details that only the real owner would know..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Minimum 10 characters. Verified privately by the Campus Admin.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Supporting Photo / Receipt <span className="text-slate-400 font-normal">(Optional, max 5MB)</span>
            </label>
            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={previewUrl} alt="Proof preview" className="w-full h-44 object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setProofFile(null);
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl('');
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/75 text-white hover:bg-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-5 cursor-pointer bg-slate-50/70 hover:bg-indigo-50/40 transition-colors">
                <Upload className="h-6 w-6 text-indigo-500 mb-1.5" />
                <span className="text-xs font-semibold text-slate-700">Click to upload proof photo</span>
                <span className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <FileImage className="h-3 w-3" /> JPG, PNG, WEBP up to 5MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Submitting Claim...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

