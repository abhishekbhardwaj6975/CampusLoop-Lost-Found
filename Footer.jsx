import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, MapPin, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center">
                <Compass className="h-4 w-4" />
              </div>
              <span className="text-base font-extrabold text-slate-900">
                Campus<span className="text-indigo-600">Loop</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Smart Lost &amp; Found Management System built for college campuses. Helping students
              reunite with lost ID cards, electronics, wallets, and books through intelligent matching
              and verified admin handovers.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/browse" className="hover:text-indigo-600 transition-colors">
                  Browse Lost &amp; Found
                </Link>
              </li>
              <li>
                <Link to="/report?type=lost" className="hover:text-indigo-600 transition-colors">
                  Report a Lost Item
                </Link>
              </li>
              <li>
                <Link to="/report?type=found" className="hover:text-indigo-600 transition-colors">
                  Report a Found Item
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">
                  Track My Claims
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Campus Lost &amp; Found Desk
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                Student Affairs Block, Ground Floor, Room 104
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                support@campusloop.com
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                Verified Claim Handover: Mon – Sat, 9 AM – 5 PM
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} CampusLoop – B.Tech CSE Mini Project. All rights reserved.</p>
          <p>Built with React, Tailwind CSS, Express &amp; SQLite</p>
        </div>
      </div>
    </footer>
  );
}

