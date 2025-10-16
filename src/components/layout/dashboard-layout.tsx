'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FolderKanban,
  Search,
  Link2,
  FileSearch,
  BarChart3,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Keywords', href: '/dashboard/keywords', icon: Search },
  { name: 'Backlinks', href: '/dashboard/backlinks', icon: Link2 },
  { name: 'Site Audits', href: '/dashboard/audits', icon: FileSearch },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg"></div>
              <span className="font-bold text-lg">SEO Analytics</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{session?.user?.name || 'User'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {session?.user?.email}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSidebarOpen(false);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">Settings</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-red-600 dark:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search keywords, projects..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/integrations">
                  Integrations
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/dashboard/projects/new">
                  New Project
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
