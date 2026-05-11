import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Package,
  LogOut,
  Shield,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  const isAdmin = dbUser.role === 'ADMIN'
  const initials = dbUser.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 selection:bg-primary/20">
      {/* ── Top Nav ───────────────────────────────────────────────────── */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="bg-primary/10 p-1.5 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              Declutter<span className="text-primary">Ease</span>
            </span>
          </Link>

          {/* Nav links (admin only) */}
          {isAdmin && (
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard/admin">
                <Button variant="ghost" size="sm" className="rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white gap-2 font-medium">
                  <LayoutDashboard className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
              <Link href="/dashboard/penerima">
                <Button variant="ghost" size="sm" className="rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white gap-2 font-medium">
                  <Package className="w-4 h-4" />
                  Katalog
                </Button>
              </Link>
            </nav>
          )}

          {/* ── Profile Card ──────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            {/* Avatar + info */}
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-2xl pl-1.5 pr-4 py-1.5 border border-slate-200/70 dark:border-slate-700/70">
              {/* Avatar circle */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-inner shrink-0 ${
                  isAdmin
                    ? 'bg-gradient-to-br from-red-500 to-rose-600'
                    : 'bg-gradient-to-br from-primary to-blue-600'
                }`}
              >
                {initials}
              </div>

              {/* Name + role */}
              <div className="hidden sm:block leading-none">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                  {dbUser.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {isAdmin ? (
                    <Shield className="w-3 h-3 text-red-500" />
                  ) : null}
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      isAdmin ? 'text-red-500' : 'text-primary'
                    }`}
                  >
                    {dbUser.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Switch dashboard (admin only, mobile) */}
            {isAdmin && (
              <Link href="/dashboard/admin" className="md:hidden">
                <Button variant="outline" size="icon" className="rounded-full w-9 h-9 border-slate-200 dark:border-slate-700">
                  <LayoutDashboard className="w-4 h-4" />
                </Button>
              </Link>
            )}

            {/* Logout */}
            <form action="/auth/signout" method="post">
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 gap-2 font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </form>
          </div>
        </div>

        {/* ── Mobile nav (admin only) ─────────────────────────────────── */}
        {isAdmin && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-800 flex">
            <Link href="/dashboard/admin" className="flex-1">
              <div className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <LayoutDashboard className="w-4 h-4" /> Admin
                <ChevronRight className="w-3 h-3 opacity-40" />
              </div>
            </Link>
            <div className="w-px bg-slate-100 dark:bg-slate-800" />
            <Link href="/dashboard/penerima" className="flex-1">
              <div className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Package className="w-4 h-4" /> Katalog
                <ChevronRight className="w-3 h-3 opacity-40" />
              </div>
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 md:py-12">{children}</main>

      <footer className="py-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 opacity-60">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">DeclutterEase</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} DeclutterEase — Dashboard
          </p>
        </div>
      </footer>
    </div>
  )
}
