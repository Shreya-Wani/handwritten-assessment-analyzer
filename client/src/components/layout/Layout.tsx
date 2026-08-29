import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  FileText,
  ClipboardList,
  BookOpen,
  Settings,
  Sparkles,
  PanelLeftClose,
  ArrowLeft,
  HelpCircle,
  Bell,
  ChevronDown,
  User,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: 'Home', icon: LayoutGrid, to: '/home' },
  { label: 'My Classroom', icon: Users, to: '/classroom' },
  { label: 'Assignments', icon: FileText, to: '/assignments' },
  { label: 'Exams', icon: ClipboardList, to: '/' },
  { label: 'My Library', icon: BookOpen, to: '/library' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#F5F5F5] overflow-hidden font-sans">
      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside className="w-[210px] shrink-0 bg-white border-r border-gray-200 flex flex-col">
          {/* Logo row */}
          <div className="flex items-center justify-between px-4 pt-5 pb-4">
            <div className="flex items-center gap-2">
              {/* App icon — dark square with white V */}
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect width="16" height="16" rx="3" fill="#1C1C1E" />
                  <path d="M4 4.5L7.5 11.5L11 4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12.5" cy="3.5" r="1.5" fill="#F97316" />
                </svg>
              </div>
              <span className="text-[15px] font-bold text-gray-900 leading-tight tracking-tight">
                VedaAI
              </span>
            </div>
            {/* Sidebar toggle */}
            <button className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors">
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          {/* CTA Pill Button */}
          <div className="px-3 pb-4">
            <button className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold rounded-full py-2 px-3 transition-colors">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              AI Teacher's Toolkit
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`h-4 w-4 shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom */}
          <div className="px-3 pb-4 space-y-3 mt-4">
            {/* Settings */}
            <button className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
              <Settings className="h-4 w-4 text-gray-400" strokeWidth={1.8} />
              <span>Settings</span>
            </button>

            {/* School card */}
            <div className="flex items-center gap-2.5 border border-gray-200 rounded-xl px-3 py-2.5">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                <span className="text-[11px] font-bold text-gray-600">DPS</span>
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-gray-800 leading-tight truncate">
                  Delhi Public School
                </p>
                <p className="text-[10px] text-gray-400 leading-tight truncate">
                  Bokaro Steel City
                </p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-gray-500">
            <button className="hover:text-gray-800 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="text-[13px] font-medium text-gray-700">Exams</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            <HelpCircle className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />

            {/* Bell with notification dot */}
            <div className="relative cursor-pointer">
              <Bell className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-orange-500 rounded-full border border-white" />
            </div>

            {/* Sparkle / AI icon */}
            <Sparkles className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />

            {/* User avatar + name */}
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-[13px] font-medium text-gray-700">Madhur Rastogi</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#F5F5F5]">
          {children}
        </main>
      </div>
    </div>
  );
};
