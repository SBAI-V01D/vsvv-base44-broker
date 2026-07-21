import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ArrowRight } from 'lucide-react';

// Doc modules registry: each module that has renderRoutes gets an entry here.
const DOC_MODULES = [
  { slug: 'customers', label: 'Customers (Kunden)' },
  { slug: 'contracts', label: 'Contracts (Verträge)' },
  { slug: 'applications', label: 'Applications (Anträge)' },
  { slug: 'documents', label: 'Documents (Dokumente)' },
  { slug: 'tasks', label: 'Tasks (Aufgaben)' },
  { slug: 'leads', label: 'Leads' },
  { slug: 'commissions', label: 'Commissions (Provisionen)' },
];

export default function DocsRoot() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return DOC_MODULES;
    const q = search.toLowerCase();
    return DOC_MODULES.filter(m =>
      m.label.toLowerCase().includes(q) ||
      m.slug.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FBFF] to-[#EFF6FF] text-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1C2C] mb-2">
            API-Dokumentation &amp; Module
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Offizielle, automatisch generierte API-Dokumentation aller Systemmodule.
            Wählen Sie ein Modul oder nutzen Sie die Suche.
          </p>
        </header>

        {/* Search */}
        <div className="mb-8">
          <label className="relative flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/25">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Modul suchen (z. B. Customers, Contracts, Tasks)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none text-sm bg-transparent"
            />
          </label>
        </div>

        {/* Module grid */}
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400">
            Keine Module gefunden. Versuchen Sie einen anderen Suchbegriff.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <li key={m.slug}>
                <Link
                  to={`/docs/routes/${m.slug}`}
                  className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary/80">
                      <BookOpen className="w-3 h-3" />
                      API Docs
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-[#0B1C2C]">
                    {m.label}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200/70 text-[10px] text-slate-400">
          Generated automatically from backend routes (lamp8=Svc10 · v2=claude).
        </footer>
      </div>
    </div>
  );
}
