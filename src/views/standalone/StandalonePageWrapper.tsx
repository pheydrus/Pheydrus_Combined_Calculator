/**
 * Shared wrapper for standalone calculator pages.
 * Provides consistent Pheydrus branding (header, background, card container, footer).
 * Matches the design tokens from ClientAssessmentPage.
 */

import { Link } from 'react-router-dom';

interface StandalonePageWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function StandalonePageWrapper({ title, subtitle, children }: StandalonePageWrapperProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f0ebe0] flex flex-col">
      {/* Header */}
      <header className="text-center py-6">
        <Link
          to="/"
          className="text-2xl font-bold text-[#9a7d4e] tracking-wide uppercase no-underline"
        >
          Pheydrus
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-[#2d2a3e] mb-1">{title}</h1>
          {subtitle && <p className="text-[#6b6188] text-sm mb-6">{subtitle}</p>}
          {!subtitle && <div className="mb-6" />}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-[#9b95ad]">
        &copy; 2026 Pheydrus. All rights reserved.
      </footer>
    </div>
  );
}
