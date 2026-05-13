import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { ConfirmReceiptForm } from './confirm-receipt-form'
import { CancelBookingButton } from './cancel-booking-button'
import { BookItemModal } from './book-item-modal'
import {
  Package,
  Clock,
  Tag,
  Search,
  Calendar,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react'

export default async function PenerimaDashboard({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>
}) {
  const resolvedParams = await searchParams
  const search = resolvedParams.search || ''
  const categoryFilter = resolvedParams.category || ''

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  // Categories for filter
  const categories = await prisma.donationItem.findMany({
    where: { status: 'AVAILABLE' },
    select: { category: true },
    distinct: ['category'],
  })

  const availableDonations = await prisma.donationItem.findMany({
    where: { 
      status: 'AVAILABLE',
      OR: [
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
      ...(categoryFilter ? { category: categoryFilter } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  const myBookings = await prisma.donationItem.findMany({
    where: {
      penerimaId: user.id,
      status: { in: ['SHIPPED', 'RECEIVED', 'COMPLETED'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  const takenDonations = await prisma.donationItem.findMany({
    where: {
      status: { in: ['SHIPPED', 'RECEIVED', 'COMPLETED'] },
      NOT: { penerimaId: user.id }
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: { penerima: { select: { name: true } } }
  })

  const initials = dbUser.name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-24">
      {/* --- Hero greeting --- */}
      <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 sm:p-12 shadow-2xl shadow-slate-900/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-2xl shadow-primary/40 ring-4 ring-white/10">
                {initials}
              </div>
              <div>
                <p className="text-primary font-bold tracking-widest text-xs uppercase mb-1">Penerima Dashboard</p>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Halo, {dbUser.name.split(' ')[0]}!</h1>
              </div>
            </div>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              Temukan barang yang kamu butuhkan dan beri mereka kesempatan kedua.
            </p>
          </div>
          <div className="flex gap-4 shrink-0 bg-white/5 backdrop-blur-md p-4 rounded-[32px] border border-white/10">
            <StatPill label="Tersedia" value={availableDonations.length} />
            <StatPill label="Aktivitas" value={myBookings.length} />
          </div>
        </div>
      </div>

      {/* --- My Bookings (Aktivitas Saya) --- */}
      {myBookings.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Aktivitas Saya</h2>
                <p className="text-sm text-slate-500 font-medium">Lacak status barang yang kamu pesan</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {myBookings.map((item) => (
              <div key={item.id} className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-black/20 hover:border-primary/30 transition-all duration-300">
                <div className="flex flex-col lg:flex-row">
                  <div className="w-full lg:w-72 h-56 lg:h-auto bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-slate-300">
                    <Package className="w-12 h-12 opacity-30" />
                    <div className="absolute top-4 left-4">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                  
                  <div className="flex-1 p-8 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{item.category}</h3>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{item.condition}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
                      
                      {item.bookedAt && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-950 w-fit px-3 py-1.5 rounded-full">
                          <Calendar className="w-3.5 h-3.5" />
                          Jadwal: {new Date(item.bookedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                      {item.status === 'SHIPPED' && (
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6">
                          <div className="flex-1 text-center sm:text-left space-y-1">
                            <p className="font-bold text-slate-900 dark:text-white">Konfirmasi Penerimaan</p>
                            <p className="text-xs text-slate-500 font-medium">Upload bukti foto dan testimoni jika barang sudah kamu terima.</p>
                          </div>
                          <div className="w-full sm:w-auto flex flex-col gap-2">
                             <ConfirmReceiptForm itemId={item.id} />
                             <CancelBookingButton itemId={item.id} />
                          </div>
                        </div>
                      )}

                      {item.status === 'COMPLETED' && (
                        <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-[24px] border border-green-100 dark:border-green-900/30 space-y-3">
                          <div className="flex items-center gap-2 text-green-600">
                             <CheckCircle2 className="w-4 h-4" />
                             <p className="text-xs font-black uppercase tracking-widest">Penyelesaian Berhasil</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Testimoni Kamu:</p>
                            <p className="text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed">&quot;{item.review || 'Terima kasih!'}&quot;</p>
                          </div>
                        </div>
                      )}
                      
                      {item.status === 'RECEIVED' && (
                        <div className="flex justify-end">
                           <CancelBookingButton itemId={item.id} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- Available Items --- */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Katalog Donasi</h2>
              <p className="text-sm text-slate-500 font-medium">Barang-barang yang siap kamu berikan rumah baru</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <form action="" className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                name="search"
                defaultValue={search}
                placeholder="Cari barang..." 
                className="w-full pl-10 pr-4 h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </form>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar max-w-full">
              <a 
                href="/dashboard/penerima"
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${!categoryFilter ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:border-primary/30'}`}
              >
                Semua
              </a>
              {categories.map((c) => (
                <a 
                  key={c.category}
                  href={`/dashboard/penerima?category=${encodeURIComponent(c.category)}&search=${search}`}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${categoryFilter === c.category ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:border-primary/30'}`}
                >
                  {c.category}
                </a>
              ))}
            </div>
          </div>
        </div>

        {availableDonations.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] p-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Katalog Kosong</h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto">Saat ini belum ada barang tersedia. Silakan cek kembali beberapa saat lagi!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableDonations.map((item) => (
              <div
                key={item.id}
                className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-black/60 hover:-translate-y-2 transition-all duration-500"
              >
                <div className="relative h-64 w-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 dark:bg-slate-950">
                  <Package className="w-14 h-14 opacity-20" />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black text-primary shadow-xl border border-slate-100 dark:border-slate-800">
                      <Tag className="w-3.5 h-3.5" /> {item.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-green-500/30 ring-2 ring-white/20">
                      {item.condition}
                    </span>
                  </div>
                </div>

                <div className="p-7 space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-tight group-hover:text-primary transition-colors">{item.category}</h3>
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed font-medium">{item.description}</p>
                  </div>
                  <BookItemModal itemId={item.id} category={item.category} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- Taken Items (Sudah Terpesan / Selesai) --- */}
      {takenDonations.length > 0 && (
        <section className="space-y-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
               <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Barang Habis</h2>
              <p className="text-sm text-slate-500 font-medium">Barang yang sudah menemukan pemilik baru</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 opacity-70 hover:opacity-100 transition-opacity grayscale-[0.5] hover:grayscale-0">
            {takenDonations.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-3 space-y-3 shadow-sm flex flex-col">
                <div className="aspect-square rounded-xl flex items-center justify-center text-slate-300 bg-slate-100 dark:bg-slate-800 relative">
                  <Package className="w-6 h-6 opacity-30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-slate-900/80 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full backdrop-blur-sm">
                       {item.status === 'COMPLETED' ? 'Selesai' : 'Terpesan'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 px-1">
                  <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{item.category}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">oleh {item.penerima?.name?.split(' ')[0] || 'Anonim'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center px-6 py-2 border-r last:border-r-0 border-white/10">
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{label}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SHIPPED: { label: 'Sedang Proses', cls: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' },
    RECEIVED: { label: 'Dikonfirmasi', cls: 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' },
    COMPLETED: { label: 'Selesai', cls: 'bg-green-500 text-white shadow-lg shadow-green-500/30' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-slate-500 text-white' }
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl whitespace-nowrap backdrop-blur-md ${s.cls}`}>
      {s.label}
    </span>
  )
}
