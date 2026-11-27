import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Package,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import api from '../api/axios';
import ItemCard from '../components/ItemCard';
import { SkeletonGrid } from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalItems: 0,
    lostItems: 0,
    foundItems: 0,
    returnedItems: 0,
  });
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadHomeData() {
      try {
        const [statsRes, itemsRes] = await Promise.all([
          api.get('/items/stats'),
          api.get('/items?limit=6&sort=newest'),
        ]);
        if (!active) return;
        setStats(statsRes.data.stats || stats);
        setRecentItems(itemsRes.data.items || []);
      } catch {
        // Keep graceful fallback
      } finally {
        if (active) setLoading(false);
      }
    }
    loadHomeData();
    return () => {
      active = false;
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/browse?search=${encodeURIComponent(q)}` : '/browse');
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section with Blurred College Campus Background */}
      <section className="relative overflow-hidden bg-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 blur-[2px] opacity-80"
          style={{ backgroundImage: "url('/campus-hero.svg')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-indigo-950/75 to-blue-900/70"
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-100 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Smart AI-Style Campus Matching &amp; Verified Handover
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12] mb-5">
              Lost something?{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-200 to-blue-300">
                We&apos;ll help you find it.
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-slate-200/90 max-w-2xl mx-auto mb-8 leading-relaxed">
              CampusLoop connects students across departments to report lost ID cards, electronics,
              wallets, and books — automatically matching reports and verifying safe returns.
            </p>

            {/* Hero Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-2xl shadow-indigo-950/40 flex flex-col sm:flex-row gap-2 mb-7"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search AirPods, ID card, wallet, Central Library..."
                  className="w-full pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors shrink-0"
              >
                Search Items
              </button>
            </form>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/report?type=lost"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow-lg shadow-red-950/30 transition-all hover:-translate-y-0.5"
              >
                <AlertTriangle className="h-4 w-4" />
                I Lost Something
              </Link>
              <Link
                to="/report?type=found"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-950/30 transition-all hover:-translate-y-0.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                I Found Something
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            icon={Package}
            label="Total Items"
            value={stats.totalItems}
            color="bg-indigo-50 text-indigo-600"
          />
          <StatTile
            icon={AlertTriangle}
            label="Lost Reported"
            value={stats.lostItems}
            color="bg-red-50 text-red-600"
          />
          <StatTile
            icon={CheckCircle2}
            label="Found Items"
            value={stats.foundItems}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatTile
            icon={HeartHandshake}
            label="Items Returned"
            value={stats.returnedItems}
            color="bg-blue-50 text-blue-600"
          />
        </div>
      </section>

      {/* Recent Items Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Campus Feed
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Recently Reported Items
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Latest lost and found reports submitted by students across campus.
            </p>
          </div>
          <Link
            to="/browse"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View All Items
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid count={6} />
        ) : recentItems.length === 0 ? (
          <EmptyState
            title="No items reported yet"
            description="Be the first to report a lost or found item on campus."
            action={
              <Link
                to="/report"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                Report an Item
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-white border-t border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Simple &amp; Secure Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              How CampusLoop Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureStep
              step="01"
              icon={Clock}
              title="Report in 30 Seconds"
              desc="Post lost or found items with photos, campus location, category, and date."
            />
            <FeatureStep
              step="02"
              icon={Sparkles}
              title="Smart Match Alerts"
              desc="Our matching algorithm compares category, keywords, location, and date proximity to notify you instantly."
            />
            <FeatureStep
              step="03"
              icon={ShieldCheck}
              title="Admin-Verified Claim"
              desc="Submit proof of ownership. Once verified by the campus admin, collect your item safely."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
        <p className="text-xs font-medium text-slate-500 mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

function FeatureStep({ step, icon: Icon, title, desc }) {
  return (
    <div className="relative bg-slate-50 rounded-2xl border border-slate-200/70 p-6 hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-2xl font-black text-slate-200">{step}</span>
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

