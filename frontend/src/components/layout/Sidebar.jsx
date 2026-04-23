import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  ClipboardList,
  BarChart3,
  Settings,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/batches', icon: ClipboardList, label: 'Batches' },
  { to: '/results', icon: BarChart3, label: 'Results' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="p-6 pb-4 border-b border-border-light">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-text-heading">ProcessAssessmentAI</h1>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-medium flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Assessment Platform
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-[18px] h-[18px]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border-light">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center text-xs font-bold text-white">
            FA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Faculty Admin</p>
            <p className="text-xs text-text-muted truncate">faculty@univ.edu</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
