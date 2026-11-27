import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Upload,
  X,
  MapPin,
  Calendar,
  Tag,
  FileImage,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getImageUrl } from '../api/axios';
import { ITEM_CATEGORIES, CAMPUS_LOCATIONS, getErrorMessage } from '../constants/campusData';

const MAX_FILES = 4;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export default function ReportItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const initialType = searchParams.get('type') === 'found' ? 'found' : 'lost';

  const todayStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    type: initialType,
    title: '',
    description: '',
    category: ITEM_CATEGORIES[0],
    location: '',
    date: todayStr,
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]); // { file, preview }
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editId));

  useEffect(() => {
    if (!editId) return;
    api
      .get(`/items/${editId}`)
      .then(({ data }) => {
        const it = data.item;
        setForm({
          type: it.type,
          title: it.title,
          description: it.description,
          category: it.category,
          location: it.location,
          date: it.date?.slice(0, 10) || todayStr,
        });
        setExistingImages(it.images || []);
      })
      .catch((err) => {
        toast.error(getErrorMessage(err, 'Could not load item for editing.'));
        navigate('/browse');
      })
      .finally(() => setLoadingEdit(false));
  }, [editId, navigate, todayStr]);

  useEffect(() => {
    return () => {
      newFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [newFiles]);

  const handleFieldChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleFilesSelected = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const currentCount = existingImages.length + newFiles.length;
    if (currentCount + selected.length > MAX_FILES) {
      toast.error(`You can upload a maximum of ${MAX_FILES} photos per item.`);
      return;
    }

    const validToAdd = [];
    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Only JPG, PNG, WEBP, or GIF images are allowed.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`${file.name}: Image must be smaller than 5MB.`);
        continue;
      }
      validToAdd.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setNewFiles((prev) => [...prev, ...validToAdd]);
    e.target.value = '';
  };

  const removeNewFile = (idx) => {
    setNewFiles((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const next = {};
    if (form.title.trim().length < 3) next.title = 'Title must be at least 3 characters.';
    if (form.description.trim().length < 10) {
      next.description = 'Please add at least 10 characters describing color, brand, or marks.';
    }
    if (!form.category) next.category = 'Please choose a category.';
    if (form.location.trim().length < 2) next.location = 'Please enter the campus location.';
    if (!form.date) next.date = 'Please select the date.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', form.type);
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('location', form.location.trim());
      formData.append('date', form.date);

      if (editId) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }
      newFiles.forEach(({ file }) => {
        formData.append('images', file);
      });

      if (editId) {
        const { data } = await api.put(`/items/${editId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(data.message || 'Item updated!');
        navigate(`/items/${data.item.id}`);
      } else {
        const { data } = await api.post('/items', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const matchCount = data.matches?.length || 0;
        if (matchCount > 0) {
          toast.success(
            `Reported! Smart Matcher found ${matchCount} potential match${matchCount > 1 ? 'es' : ''}!`
          );
        } else {
          toast.success(data.message || 'Item reported successfully!');
        }
        navigate(`/items/${data.item.id}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not submit item report.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEdit) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 w-56 bg-slate-200 rounded" />
        <div className="h-96 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {editId ? 'Edit Item Report' : 'Report a Lost or Found Item'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Provide accurate details so our Smart Matching engine can connect you with the right student.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6"
        noValidate
      >
        {/* Lost / Found Toggle */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            What are you reporting?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, type: 'lost' }))}
              className={`flex items-center justify-center gap-2.5 p-4 rounded-xl border-2 text-sm font-bold transition-all ${
                form.type === 'lost'
                  ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
              I Lost Something
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, type: 'found' }))}
              className={`flex items-center justify-center gap-2.5 p-4 rounded-xl border-2 text-sm font-bold transition-all ${
                form.type === 'found'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
              I Found Something
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Item Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleFieldChange}
            placeholder={
              form.type === 'lost'
                ? 'e.g. Black Casio Scientific Calculator fx-991EX'
                : 'e.g. White Wireless Earbuds Found in Library'
            }
            className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${
              errors.title
                ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
            }`}
          />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
        </div>

        {/* Category, Date, Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                name="category"
                value={form.category}
                onChange={handleFieldChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm bg-white outline-none"
              >
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Date {form.type === 'lost' ? 'Lost' : 'Found'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                name="date"
                max={todayStr}
                value={form.date}
                onChange={handleFieldChange}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none ${
                  errors.date
                    ? 'border-red-400'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                }`}
              />
            </div>
            {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
          </div>
        </div>

        {/* Campus Location */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Campus Location <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="location"
              list="campus-locations"
              value={form.location}
              onChange={handleFieldChange}
              placeholder="e.g. Central Library - 2nd Floor, CSE Block Lab 3..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none ${
                errors.location
                  ? 'border-red-400'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
              }`}
            />
            <datalist id="campus-locations">
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>
          {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleFieldChange}
            placeholder="Include color, brand, distinguishing marks, stickers, or approximate time so smart matching works accurately..."
            className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none ${
              errors.description
                ? 'border-red-400'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
            }`}
          />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
        </div>

        {/* Photo Upload with Previews */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Photos <span className="text-slate-400 font-normal">(Up to 4 images, max 5MB each)</span>
          </label>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 cursor-pointer bg-slate-50/70 hover:bg-indigo-50/30 transition-colors">
            <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Click to upload item photos</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <FileImage className="h-3.5 w-3.5" />
              JPG, PNG, WEBP, GIF &middot; Max 5MB per file
            </p>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFilesSelected}
              className="hidden"
            />
          </label>

          {(existingImages.length > 0 || newFiles.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {existingImages.map((img, idx) => (
                <div
                  key={`existing-${idx}`}
                  className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                >
                  <img src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/75 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {newFiles.map((item, idx) => (
                <div
                  key={`new-${idx}`}
                  className="relative aspect-square rounded-xl overflow-hidden border border-indigo-200 bg-slate-50"
                >
                  <img src={item.preview} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewFile(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/75 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Banner */}
        {!editId && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
            <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              As soon as you submit, CampusLoop automatically scans opposite{' '}
              <strong>{form.type === 'lost' ? 'found' : 'lost'}</strong> reports and notifies you of
              high-confidence matches!
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm disabled:opacity-60 transition-colors"
          >
            {submitting
              ? editId
                ? 'Saving Changes...'
                : 'Submitting Report...'
              : editId
                ? 'Save Changes'
                : `Submit ${form.type === 'lost' ? 'Lost' : 'Found'} Report`}
          </button>
        </div>
      </form>
    </div>
  );
}

