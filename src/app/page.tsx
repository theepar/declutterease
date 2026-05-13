import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Package, Recycle, ShieldCheck, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-primary/20">
      <header className="px-6 lg:px-12 h-20 flex items-center border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <Link className="flex items-center gap-2 group" href="/">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            Declutter<span className="text-primary">Ease</span>
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Link className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" href="/login">
            Sign In
          </Link>
          <Link href="/login">
            <Button className="rounded-full shadow-sm">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 overflow-hidden">
          {/* Background decorative gradients */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30 dark:opacity-20 pointer-events-none blur-[100px] rounded-full bg-gradient-to-tr from-primary via-purple-400 to-transparent" />
          
          <div className="container relative px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                Now available in Beta
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-slate-900 dark:text-white">
                Give your items a <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                  beautiful second life
                </span>
              </h1>
              <p className="mx-auto max-w-[700px] text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Connect directly with people who need your unused items. Reduce waste, help your community, and declutter your space—all in one seamless platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto rounded-full h-12 px-8 text-base shadow-lg shadow-primary/20 gap-2">
                    Start Donating <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full h-12 px-8 text-base bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features / How it works */}
        <section id="how-it-works" className="w-full py-20 bg-white dark:bg-slate-900">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
                How DeclutterEase Works
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-[600px] mx-auto text-lg">
                We&apos;ve simplified the donation process so you can focus on what matters: making a positive impact.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Card 1 */}
              <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">List Your Items</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Add a brief description, and your item is instantly available for those who need it most.
                </p>
              </div>

              {/* Card 2 */}
              <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Zap className="w-32 h-32" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Instant Booking</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Users can instantly book available items. No waiting, no hassle. First come, first served to ensure fairness.
                </p>
              </div>

              {/* Card 3 */}
              <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                  <Recycle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Make an Impact</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Coordinate pickup and feel great knowing your unwanted items are reducing landfill waste and helping others.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10" />
          <div className="container px-4 md:px-6 relative z-10 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-slate-900 dark:text-white max-w-3xl">
                Ready to clear your space and mind?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-[600px]">
                Join thousands of others making a difference through simple, direct donations.
              </p>
              <Link href="/login">
                <Button size="lg" className="rounded-full h-14 px-10 text-lg shadow-xl shadow-primary/25 hover:scale-105 transition-transform mt-4">
                  Join DeclutterEase Today
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-8 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 opacity-80">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-semibold text-slate-900 dark:text-white">DeclutterEase</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} DeclutterEase. Built for a better community.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
