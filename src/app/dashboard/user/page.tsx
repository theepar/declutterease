import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
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
  Home,
} from 'lucide-react'
import { bookCleaningService, cancelCleaningBooking } from './actions'
import { BookingButton } from './booking-button'

export default async function UserDashboard({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; tab?: string }>
}) {
  const resolvedParams = await searchParams
  const search = resolvedParams.search || ''
  const categoryFilter = resolvedParams.category || ''
  const activeTab = resolvedParams.tab || 'donasi'

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbUser } = await supabase
    .from('User')
    .select('*')
    .eq('id', user.id)
    .single()
    
  if (!dbUser) redirect('/login')

  // Categories for filter
  const { data: categoriesData } = await supabase
    .from('DonationItem')
    .select('category')
    .eq('status', 'AVAILABLE')
  
  const categories = Array.from(new Set(categoriesData?.map(c => c.category) || []))
    .map(category => ({ category }))

  let availableQuery = supabase
    .from('DonationItem')
    .select('*')
    .eq('status', 'AVAILABLE')

  if (search) {
    availableQuery = availableQuery.or(`category.ilike.%${search}%,description.ilike.%${search}%`)
  }
  
  if (categoryFilter) {
    availableQuery = availableQuery.eq('category', categoryFilter)
  }

  const { data: availableData } = await availableQuery
    .order('createdAt', { ascending: false })
  const availableDonations = availableData || []

  const { data: myBookingsData } = await supabase
    .from('DonationItem')
    .select('*')
    .eq('penerimaId', user.id)
    .in('status', ['SHIPPED', 'RECEIVED', 'COMPLETED'])
    .order('createdAt', { ascending: false })
  const myBookings = myBookingsData || []

  const { data: takenDonationsData } = await supabase
    .from('DonationItem')
    .select('*, user:User(name)')
    .in('status', ['SHIPPED', 'RECEIVED', 'COMPLETED'])
    .neq('penerimaId', user.id)
    .order('createdAt', { ascending: false })
    .limit(6)
  const takenDonations = takenDonationsData || []

  // --- Cleaning Service Data ---
  const { data: cleaningServicesData } = await supabase
    .from('CleaningService')
    .select('*, penerima:User(name)') // Changed to match the SQL relationship
    .order('scheduled_at', { ascending: true })
  
  const cleaningServices = cleaningServicesData || []
  const availableCleaning = cleaningServices.filter(s => s.status === 'AVAILABLE')
  const myCleaning = cleaningServices.filter(s => s.penerima_id === user.id)

  const initials = dbUser.name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-24 px-4">
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
                <p className="text-primary font-bold tracking-widest text-xs uppercase mb-1">User Dashboard</p>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Halo, {dbUser.name.split(' ')[0]}!</h1>
              </div>
            </div>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              Temukan barang yang kamu butuhkan atau pesan layanan pembersihan kost dengan mudah.
            </p>
          </div>
          <div className="flex gap-4 shrink-0 bg-white/5 backdrop-blur-md p-4 rounded-[32px] border border-white/10">
            <StatPill label="Tersedia" value={availableDonations.length + availableCleaning.length} />
            <StatPill label="Aktivitas" value={myBookings.length + myCleaning.length} />
          </div>
        </div>
      </div>

      {/* --- My Active Orders / Bookings --- */}
      {(myBookings.length > 0 || myCleaning.length > 0) && (
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Aktivitas Saya</h2>
              <p className="text-sm text-slate-500 font-medium">Lacak status pesanan dan jadwal pembersihan kamu</p>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
            {/* My Donation Bookings */}
            {myBookings.map((item) => (
              <div key={item.id} className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[28px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 min-w-[320px] max-w-[320px] shrink-0">
                <div className="h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 relative">
                  <Package className="w-8 h-8 opacity-30" />
                  <div className="absolute top-3 left-3 scale-75 origin-top-left">
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                
                <div className="p-5 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{item.category}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    {item.status === 'SHIPPED' ? (
                      <div className="flex gap-2 w-full">
                        <ConfirmReceiptForm itemId={item.id} />
                        <CancelBookingButton itemId={item.id} />
                      </div>
                    ) : item.status === 'COMPLETED' ? (
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase">Selesai</span>
                      </div>
                    ) : (
                      <CancelBookingButton itemId={item.id} />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* My Cleaning Bookings */}
            {myCleaning.map((service) => (
              <div key={service.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-5 shadow-sm hover:shadow-xl transition-all duration-300 min-w-[320px] max-w-[320px] shrink-0 flex flex-col justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    service.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                    service.status === 'APPROVED' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <Home className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 dark:text-white text-base truncate">Bebersih Kost</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{service.description}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(service.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
                  
                  {service.status !== 'COMPLETED' && (
                    <form action={cancelCleaningBooking}>
                      <input type="hidden" name="serviceId" value={service.id} />
                      <button className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors">
                        Batal
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- Catalog Section with Tabs --- */}
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Katalog Layanan</h2>
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[24px] w-fit">
              <a 
                href={`/dashboard/user?tab=donasi&search=${search}&category=${categoryFilter}`}
                className={`px-8 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'donasi' ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Donasi Barang
              </a>
              <a 
                href={`/dashboard/user?tab=bebersih&search=${search}&category=${categoryFilter}`}
                className={`px-8 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'bebersih' ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Bebersih Kost
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <form action="" className="relative w-full sm:w-72">
              <input type="hidden" name="tab" value={activeTab} />
              <input type="hidden" name="category" value={categoryFilter} />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                name="search"
                defaultValue={search}
                placeholder={activeTab === 'donasi' ? "Cari barang..." : "Cari layanan..."}
                className="w-full pl-11 pr-4 h-14 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
              />
            </form>
          </div>
        </div>

        {activeTab === 'donasi' ? (
          <div className="space-y-8">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <a 
                href={`/dashboard/user?tab=donasi&search=${search}`}
                className={`px-5 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${!categoryFilter ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-primary/30'}`}
              >
                SEMUA BARANG
              </a>
              {categories.map((c) => (
                <a 
                  key={c.category}
                  href={`/dashboard/user?tab=donasi?category=${encodeURIComponent(c.category)}&search=${search}`}
                  className={`px-5 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${categoryFilter === c.category ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-primary/30'}`}
                >
                  {c.category.toUpperCase()}
                </a>
              ))}
            </div>

            {availableDonations.length === 0 ? (
              <EmptyState icon={<Package className="w-12 h-12" />} title="Katalog Kosong" message="Saat ini belum ada barang yang tersedia." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableDonations.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-black/60 hover:-translate-y-2 transition-all duration-500"
                  >
                    <div className="relative h-64 w-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 dark:bg-slate-950">
                      <Package className="w-14 h-14 opacity-20 group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-6 left-6">
                        <span className="inline-flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black text-primary shadow-xl border border-slate-100 dark:border-slate-800 uppercase tracking-widest">
                          <Tag className="w-3 h-3" /> {item.category}
                        </span>
                      </div>
                      <div className="absolute top-6 right-6">
                        <span className="bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl shadow-lg shadow-green-500/30 ring-2 ring-white/20">
                          {item.condition}
                        </span>
                      </div>
                    </div>

                    <div className="p-8 space-y-6">
                      <div className="space-y-3">
                        <h3 className="font-black text-slate-900 dark:text-white text-2xl tracking-tight leading-tight group-hover:text-primary transition-colors">{item.category}</h3>
                        <p className="text-slate-500 text-base line-clamp-2 leading-relaxed font-medium">{item.description}</p>
                      </div>
                      <BookItemModal itemId={item.id} category={item.category} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {availableCleaning.length === 0 ? (
              <EmptyState icon={<Home className="w-12 h-12" />} title="Jadwal Penuh" message="Belum ada slot pembersihan yang tersedia saat ini." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableCleaning.map((service) => (
                  <div key={service.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500">
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all duration-500 group-hover:rotate-6 shadow-sm">
                        <Home className="w-9 h-9" />
                      </div>
                      <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl shadow-sm border border-green-200">
                        TERSSEDIA
                      </span>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-tight group-hover:text-primary transition-colors">{service.description}</h3>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-primary" />
                          </div>
                          {new Date(service.scheduled_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                        </div>
                      </div>

                      <form action={bookCleaningService}>
                        <input type="hidden" name="serviceId" value={service.id} />
                        <BookingButton label="Ambil Jadwal Ini" />
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- Recently Completed Items --- */}
      {takenDonations.length > 0 && (
        <section className="space-y-10 pt-16 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
               <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sudah Menemukan Rumah Baru</h2>
              <p className="text-sm text-slate-500 font-medium">Barang-barang yang telah berhasil didonasikan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {takenDonations.map((item) => (
              <div key={item.id} className="group bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[32px] p-4 space-y-4 shadow-sm hover:shadow-xl transition-all duration-500 grayscale hover:grayscale-0 opacity-70 hover:opacity-100">
                <div className="aspect-square rounded-[24px] flex items-center justify-center text-slate-300 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
                  <Package className="w-8 h-8 opacity-30 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white text-slate-900 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-xl">
                       {item.status === 'COMPLETED' ? 'Selesai' : 'Terpesan'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 px-1">
                  <p className="font-black text-slate-900 dark:text-white text-sm truncate tracking-tight">{item.category}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">oleh {item.user?.name?.split(' ')[0] || 'Anonim'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[50px] p-24 text-center">
      <div className="w-24 h-24 rounded-[32px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-8 shadow-inner">
        <div className="text-slate-300">{icon}</div>
      </div>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
      <p className="text-slate-500 mt-3 max-w-sm mx-auto font-medium">{message}</p>
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
