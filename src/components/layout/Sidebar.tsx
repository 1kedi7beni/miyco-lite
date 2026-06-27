'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboardIcon,
  MapIcon,
  ClipboardListIcon,
  UsersIcon,
  SettingsIcon,
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
    { name: 'Live Map', href: '/map', icon: MapIcon },
    { name: 'Work Orders', href: '/work-orders', icon: ClipboardListIcon },
    { name: 'Workers', href: '/workers', icon: UsersIcon },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ]

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm shadow-indigo-600/20">
            <MapIcon size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-base font-black tracking-tight text-slate-900 leading-none">
              Miyco Lite
            </p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
              OSS Dispatcher
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Workspace
        </p>
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                size={18}
                strokeWidth={2}
                className={isActive ? 'text-indigo-600' : 'text-slate-400'}
              />
              {item.name}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 font-medium">
          Open Source · MIT License
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">v0.1.0</p>
      </div>
    </aside>
  )
}
