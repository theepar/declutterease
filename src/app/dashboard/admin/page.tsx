import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DeleteItemButton } from './delete-button'
import {
  PlusCircle, Package, Users,
  CheckCircle2, LayoutDashboard, Pencil, Clock, X, Inbox,
  Search, ArrowRight, Home
} from 'lucide-react'
import { createDonationItem, updateDonationItem, deleteDonationItem, createCleaningService, updateCleaningService, approveCleaningBooking, completeCleaningService, deleteCleaningService } from './actions'
import { CompletedItemDetail } from './completed-item-detail'
import { CalendarDays } from 'lucide-react'
import { BookingButton } from '../user/booking-button'

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; search?: string; status?: string }>
}) {
  const resolvedParams = await searchParams
  const editingId = resolvedParams.edit ?? null
  const search = resolvedParams.search || ''
  const statusFilter = resolvedParams.status || ''

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbUser } = await supabase
    .from('User')
    .select('*')
    .eq('id', user.id)
    .single()

  if (dbUser?.role !== 'ADMIN') redirect('/dashboard/user')

  let query = supabase
    .from('DonationItem')
    .select('*, user:User(*)')
    .order('createdAt', { ascending: false })

  if (search) {
    query = query.or(`category.ilike.%${search}%,description.ilike.%${search}%`)
  }
  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data: donationsData } = await query
  const donations = donationsData || []


  const editingItem = editingId ? donations.find((d) => d.id === editingId) ?? null : null
  const availableItems  = donations.filter((i) => i.status === 'AVAILABLE')
  const shippedItems    = donations.filter((i) => i.status === 'SHIPPED')
  const completedItems  = donations.filter((i) => i.status === 'COMPLETED')

  // --- Cleaning Service Data ---
  // We try a simpler select first to avoid join errors if the relationship is named differently
  const { data: cleaningServicesData, error: cleaningError } = await supabase
    .from('CleaningService')
    .select('*, penerima:User(*)') // Changed from user:User(*) to penerima:User(*) as the column is likely penerima_id
    .order('scheduled_at', { ascending: true })

  if (cleaningError) {
    console.error('Error fetching cleaning services:', {
      message: cleaningError.message,
      details: cleaningError.details,
      hint: cleaningError.hint,
      code: cleaningError.code
    })
  }
  
  const cleaningServices = cleaningServicesData || []
  const editingService = editingId ? cleaningServices.find((s) => s.id === editingId) ?? null : null



  // --- Render ---

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24">

      {/* --- Banner --- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2 font-bold tracking-widest text-xs uppercase">
              <LayoutDashboard className="w-4 h-4" /> Management Console
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Kelola inventaris donasi DeclutterEase</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                {[
                  { label: 'Tersedia', val: availableItems.length, color: 'text-sky-400', bg: 'bg-sky-400/10' },
                  { label: 'Booked', val: shippedItems.length, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                  { label: 'Selesai', val: completedItems.length, color: 'text-green-400', bg: 'bg-green-400/10' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} border border-white/5 rounded-2xl px-4 py-3 text-center backdrop-blur-sm`}>
                    <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">{s.label}</div>
                  </div>
                ))}
            </div>
            <a href="/dashboard/user">
              <Button variant="outline" className="w-full rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2 border-dashed">
                Lihat POV User <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* --- Main Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left — Form Panel */}
        <div className="lg:col-span-4 lg:sticky lg:top-6">
          {editingItem && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-800/40 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border-b border-amber-100 dark:border-amber-900/30 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <Pencil className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white leading-tight">Edit Barang</p>
                    <p className="text-xs text-slate-500">Ubah data barang</p>
                  </div>
                </div>
                <a href="/dashboard/admin">
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-700">
                    <X className="w-4 h-4" />
                  </Button>
                </a>
              </div>
              <div className="p-6">
                <form action={updateDonationItem} className="space-y-4">
                  <input type="hidden" name="itemId" value={editingItem.id} />
                  <FormField label="Kategori" id="edit-cat">
                    <Input id="edit-cat" name="category" defaultValue={editingItem.category} required className="rounded-xl h-11" />
                  </FormField>
                  <FormField label="Kondisi" id="edit-cond">
                    <Input id="edit-cond" name="condition" defaultValue={editingItem.condition} required className="rounded-xl h-11" />
                  </FormField>
                  <FormField label="Deskripsi" id="edit-desc">
                    <Textarea id="edit-desc" name="description" defaultValue={editingItem.description} required className="rounded-xl min-h-[90px]" />
                  </FormField>
                  <Button type="submit" className="w-full rounded-xl h-11 font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200/50 dark:shadow-amber-900/20">
                    Simpan Perubahan
                  </Button>
                </form>
              </div>
            </div>
          )}

          {editingService && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-blue-200 dark:border-blue-800/40 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 border-b border-blue-100 dark:border-blue-900/30 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Pencil className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white leading-tight">Edit Jadwal Bebersih</p>
                    <p className="text-xs text-slate-500">Ubah jadwal pembersihan</p>
                  </div>
                </div>
                <a href="/dashboard/admin">
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-700">
                    <X className="w-4 h-4" />
                  </Button>
                </a>
              </div>
              <div className="p-6">
                <form action={updateCleaningService} className="space-y-4">
                  <input type="hidden" name="serviceId" value={editingService.id} />
                  <FormField label="Deskripsi Layanan" id="edit-clean-desc">
                    <Input id="edit-clean-desc" name="description" defaultValue={editingService.description} required className="rounded-xl h-11" />
                  </FormField>
                  <FormField label="Jadwal (Tanggal & Waktu)" id="edit-clean-date">
                    <Input id="edit-clean-date" name="scheduled_at" type="datetime-local" defaultValue={new Date(new Date(editingService.scheduled_at).getTime() - (new Date(editingService.scheduled_at).getTimezoneOffset() * 60000)).toISOString().slice(0, 16)} required className="rounded-xl h-11" />
                  </FormField>
                  <Button type="submit" className="w-full rounded-xl h-11 font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200/50 dark:shadow-blue-900/20">
                    Simpan Perubahan
                  </Button>
                </form>
              </div>
            </div>
          )}

          {!editingItem && !editingService && (
            <>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-950/50 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white leading-tight">Input Barang Baru</p>
                  <p className="text-xs text-slate-500">Tambah inventaris donasi</p>
                </div>
              </div>
              <div className="p-6">
                <form action={createDonationItem} className="space-y-4">
                  <FormField label="Kategori" id="category">
                    <Input id="category" name="category" placeholder="Contoh: Pakaian, Elektronik" required className="rounded-xl h-11 border-slate-200 dark:border-slate-800" />
                  </FormField>
                  <FormField label="Kondisi" id="condition">
                    <Input id="condition" name="condition" placeholder="Contoh: Bagus, Seperti Baru" required className="rounded-xl h-11 border-slate-200 dark:border-slate-800" />
                  </FormField>
                  <FormField label="Deskripsi" id="description">
                    <Textarea id="description" name="description" placeholder="Ceritakan sedikit tentang barang ini..." required className="rounded-xl min-h-[90px] border-slate-200 dark:border-slate-800" />
                  </FormField>
                  <BookingButton label="Publikasikan Barang" />
                </form>
              </div>
            </div>

            <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl border border-primary/20 dark:border-primary/20 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-blue-500/5 dark:from-primary/10 dark:to-blue-900/10 border-b border-primary/10 dark:border-primary/90 px-6 py-5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white leading-tight">Slot Bebersih Kost</p>
                  <p className="text-xs text-slate-500">Tambah jadwal pembersihan</p>
                </div>
              </div>
              <div className="p-6">
                <form action={createCleaningService} className="space-y-4">
                  <FormField label="Deskripsi Layanan" id="clean-desc">
                    <Input id="clean-desc" name="description" placeholder="Contoh: Pembersihan kamar & kamar mandi" required className="rounded-xl h-11 border-slate-200 dark:border-slate-800" />
                  </FormField>
                  <FormField label="Jadwal (Tanggal & Waktu)" id="clean-date">
                    <Input id="clean-date" name="scheduled_at" type="datetime-local" required className="rounded-xl h-11 border-slate-200 dark:border-slate-800" />
                  </FormField>
                  <BookingButton label="Tambah Slot Jadwal" />
                </form>
              </div>
            </div>
            </>
          )}
        </div>

        {/* Right — Lists */}
        <div className="lg:col-span-8 space-y-10">


          {/* --- All Inventory --- */}
          <section className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <SectionHeader
                icon={<Package className="w-4 h-4 text-primary" />}
                iconBg="bg-primary/10"
                title="Semua Inventaris"
                badge={`${donations.length} items`}
                badgeColor="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              />
              
              <div className="flex items-center gap-2">
                <form action="" className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input 
                    name="search" 
                    defaultValue={search}
                    placeholder="Cari..." 
                    className="h-9 w-40 pl-8 rounded-xl text-xs border-slate-200 dark:border-slate-800" 
                  />
                </form>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {['', 'AVAILABLE', 'SHIPPED', 'COMPLETED'].map((s) => (
                    <a 
                      key={s} 
                      href={`/dashboard/admin?status=${s}&search=${search}`}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${statusFilter === s ? 'bg-white dark:bg-slate-900 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {s === '' ? 'Semua' : s === 'AVAILABLE' ? 'Tersedia' : s === 'SHIPPED' ? 'Booked' : 'Selesai'}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {donations.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Belum ada data donasi.</p>
                <p className="text-slate-400 text-sm mt-1">Tambah barang pertama di panel kiri.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {donations.map((item) => (
                    <div
                      key={item.id}
                      className={`px-5 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors ${editingId === item.id ? 'bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400' : ''}`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                        <Package className="w-6 h-6" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">{item.category}</h4>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-sm text-slate-500 truncate">{item.description}</p>
                        {item.user && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                            <Users className="w-3 h-3" />
                            <span>{item.user.name}</span>
                            {item.bookedAt && (
                              <>
                                <span>·</span>
                                <Clock className="w-3 h-3" />
                                <span>{new Date(item.bookedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {item.status === 'AVAILABLE' && (
                          <a href={`/dashboard/admin?edit=${item.id}`}>
                            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        <DeleteItemButton itemId={item.id} action={deleteDonationItem} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* --- Completed --- */}
          {completedItems.length > 0 && (
            <section className="space-y-5">
              <SectionHeader
                icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
                iconBg="bg-green-50 dark:bg-green-900/20"
                title="Selesai"
                badge={`${completedItems.length} items`}
                badgeColor="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              />
              <div className="space-y-3">
                {completedItems.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-green-100 dark:border-green-900/30 px-5 py-4 flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.category}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <Users className="w-3 h-3" />
                        <span>{item.user?.name}</span>
                        {item.review && (
                          <>
                            <span>·</span>
                            <span className="italic truncate">&quot;{item.review}&quot;</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <CompletedItemDetail item={item} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* --- Cleaning Service Management --- */}
          <section className="space-y-5">
              <SectionHeader
                icon={<Home className="w-4 h-4 text-primary" />}
                iconBg="bg-primary/10"
                title="Manajemen Bebersih Kost"
              badge={`${cleaningServices.length} slots`}
              badgeColor="bg-primary/10 text-primary"
            />

            {cleaningServices.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center">
                <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm">Belum ada jadwal pembersihan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {cleaningServices.map((service) => (
                  <div key={service.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        service.status === 'AVAILABLE' ? 'bg-green-50 text-green-600' :
                        service.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                        service.status === 'APPROVED' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-50 text-slate-400'
                      }`}>
                        <Home className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white">{service.description}</h4>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                             service.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                             service.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                             service.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                             'bg-slate-100 text-slate-600'
                          }`}>
                            {service.status === 'AVAILABLE' ? 'Tersedia' : service.status === 'PENDING' ? 'Perlu ACC' : service.status === 'APPROVED' ? 'Disetujui' : 'Selesai'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {new Date(service.scheduled_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                        {service.penerima && (
                          <p className="text-xs text-primary font-semibold mt-1">Dipesan oleh: {service.penerima.name}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {service.status === 'PENDING' && (
                        <form action={approveCleaningBooking}>
                          <input type="hidden" name="serviceId" value={service.id} />
                          <BookingButton 
                            label="ACC Sekarang" 
                            size="sm" 
                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-4 font-bold h-9 flex items-center justify-center gap-2"
                          />
                        </form>
                      )}
                      {service.status === 'APPROVED' && (
                        <form action={completeCleaningService}>
                          <input type="hidden" name="serviceId" value={service.id} />
                          <BookingButton 
                            label="Selesaikan" 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 font-bold h-9 flex items-center justify-center gap-2"
                          />
                        </form>
                      )}
                      {service.status === 'AVAILABLE' && (
                        <a href={`/dashboard/admin?edit=${service.id}`}>
                          <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      <form action={deleteCleaningService}>
                        <input type="hidden" name="serviceId" value={service.id} />
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

// --- Helpers ---

function FormField({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
      {children}
    </div>
  )
}

function SectionHeader({
  icon, iconBg, title, badge, badgeColor, pulse,
}: {
  icon: React.ReactNode; iconBg: string; title: string
  badge: string; badgeColor: string; pulse?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
          {pulse && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />}
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${badgeColor}`}>{badge}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    AVAILABLE: { label: 'Tersedia', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    SHIPPED:   { label: 'Dikirim',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    RECEIVED:  { label: 'Diterima', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    COMPLETED: { label: 'Selesai',  cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  )
}
