'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    key: 'record',
    label: '记录',
    href: '/',
    match: (path: string) => path === '/',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    key: 'timeline',
    label: '时光轴',
    href: '/timeline',
    match: (path: string) => path.startsWith('/timeline'),
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'insights',
    label: '洞察',
    href: '/insights',
    match: (path: string) => path.startsWith('/insights'),
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    key: 'profile',
    label: '我的',
    href: '/profile',
    match: (path: string) => path.startsWith('/profile'),
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

// Routes where the tab bar should be hidden
const HIDDEN_PATTERNS = [
  '/record',
  '/photo-record',
  '/edit',
  '/delete',
  '/new',
  '/import',
]

export function BottomTabBar() {
  const pathname = usePathname()

  // Hide tab bar on action/detail pages
  const shouldHide = HIDDEN_PATTERNS.some(pattern => pathname.includes(pattern))
  if (shouldHide) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {TABS.map((tab) => {
          const active = tab.match(pathname)
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                active ? 'text-brand-500' : 'text-gray-400'
              }`}
            >
              {tab.icon(active)}
              <span className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
