import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, LogOut, User as UserIcon, Shield } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Get user role from Prisma
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  })

  if (!dbUser) {
    // If not in DB for some reason, redirect to login
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 selection:bg-primary/20">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-1.5 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Heart className="w-5 h-5 text-primary fill-primary/10" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              Declutter<span className="text-primary">Ease</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                {dbUser.role === 'ADMIN' ? <Shield className="w-3 h-3 text-red-500" /> : <UserIcon className="w-3 h-3 text-primary" />}
                {dbUser.name}
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter leading-none">{dbUser.role}</span>
            </div>

            <form action="/auth/signout" method="post">
              <Button 
                variant="ghost" 
                size="sm" 
                type="submit" 
                className="rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 gap-2 font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      
      <main className="flex-1 px-4 sm:px-6 py-8 md:py-12">
        {children}
      </main>

      <footer className="py-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} DeclutterEase Dashboard. Kelola donasi dengan hati.
          </p>
        </div>
      </footer>
    </div>
  )
}
