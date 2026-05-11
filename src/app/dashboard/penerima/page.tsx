import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { revalidatePath } from 'next/cache'
import {
  Package,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Tag,
  Sparkles,
} from 'lucide-react'

export default async function PenerimaDashboard() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const availableDonations = await prisma.donationItem.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { createdAt: 'desc' },
  })

  const myBookings = await prisma.donationItem.findMany({
    where: {
      penerimaId: user.id,
      status: { in: ['SHIPPED', 'RECEIVED', 'COMPLETED'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  async function bookItem(formData: FormData) {
    'use server'
    const itemId = formData.get('itemId') as string
    const cs = await cookies()
    const sb = await createClient(cs)
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return

    await prisma.donationItem.update({
      where: { id: itemId, status: 'AVAILABLE' },
      data: {
        status: 'SHIPPED',
        penerimaId: user.id,
        bookedAt: new Date(),
      },
    })
    revalidatePath('/dashboard/penerima')
  }

  async function confirmReceipt(formData: FormData) {
    'use server'
    const itemId = formData.get('itemId') as string
    const location = formData.get('location') as string
    const photoFile = formData.get('photoFile') as File | null

    let photoUrl = ''
    if (photoFile && photoFile.size > 0) {
      const cs = await cookies()
      const sb = await createClient(cs)
      const ext = photoFile.name.split('.').pop()
      const name = `receipt-${Math.random().toString(36).slice(2)}.${ext}`
      const { data: up, error: ue } = await sb.storage
        .from('declutterease')
        .upload(`receipts/${name}`, photoFile)
      if (!ue && up) {
        photoUrl = sb.storage.from('declutterease').getPublicUrl(up.path).data.publicUrl
      }
    }

    await prisma.donationItem.update({
      where: { id: itemId },
      data: { status: 'RECEIVED', receiptLocation: location, receiptPhoto: photoUrl },
    })
    revalidatePath('/dashboard/penerima')
  }

  const initials = dbUser.name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* ── Hero greeting ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-8 shadow-2xl shadow-slate-900/20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-primary/30">
                {initials}
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Selamat datang,</p>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{dbUser.name}</h1>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-sm">
              Temukan barang yang kamu butuhkan dan bantu kurangi limbah bersama komunitas.
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <StatPill label="Tersedia" value={availableDonations.length} />
            <StatPill label="Booking Saya" value={myBookings.length} />
          </div>
        </div>
      </div>

      {/* ── Available Items ────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Barang Tersedia</h2>
              <p className="text-xs text-slate-500">{availableDonations.length} item siap di-booking</p>
            </div>
          </div>
        </div>

        {availableDonations.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Belum ada barang tersedia saat ini.</p>
            <p className="text-slate-400 text-sm mt-1">Cek lagi nanti ya!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableDonations.map((item) => (
              <div
                key={item.id}
                className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-black/40 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {item.photos[0] ? (
                    <img
                      src={item.photos[0]}
                      alt={item.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                      <Package className="w-12 h-12 opacity-30" />
                      <span className="text-xs text-slate-400">Tidak ada foto</span>
                    </div>
                  )}
                  {/* Category pill */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm border border-slate-100 dark:border-slate-800">
                      <Tag className="w-3 h-3" /> {item.category}
                    </span>
                  </div>
                  {/* Condition badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-green-500/90 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {item.condition}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{item.category}</h3>
                    <p className="text-slate-500 text-sm mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>

                  <form action={bookItem}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <Button
                      type="submit"
                      className="w-full rounded-2xl h-11 font-bold gap-2 shadow-md shadow-primary/20 transition-all active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Booking Sekarang
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── My Bookings ───────────────────────────────────────────────── */}
      <section className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Aktivitas Saya</h2>
            <p className="text-xs text-slate-500">Riwayat booking kamu</p>
          </div>
        </div>

        {myBookings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Kamu belum booking apapun.</p>
            <p className="text-slate-400 text-sm mt-1">Cari barang yang kamu butuhkan di atas!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myBookings.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl overflow-hidden shadow-sm">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-44 h-44 bg-slate-100 dark:bg-slate-800 shrink-0">
                    {item.photos[0] ? (
                      <img src={item.photos[0]} alt={item.category} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.category}</h3>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{item.description}</p>
                      {item.bookedAt && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Di-booking: {new Date(item.bookedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>

                    {item.status === 'SHIPPED' && (
                      <div className="mt-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <form action={confirmReceipt} className="space-y-3">
                          <input type="hidden" name="itemId" value={item.id} />
                          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Konfirmasi Penerimaan</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative">
                              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <Input name="location" placeholder="Lokasi penerimaan..." required className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 h-11" />
                            </div>
                            <div className="relative">
                              <Camera className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <Input name="photoFile" type="file" accept="image/*" required className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 h-11 cursor-pointer pt-2.5" />
                            </div>
                          </div>
                          <Button type="submit" variant="secondary" className="w-full rounded-xl gap-2 font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Konfirmasi Terima Barang
                          </Button>
                        </form>
                      </div>
                    )}

                    {item.status === 'COMPLETED' && item.review && (
                      <div className="mt-4 bg-green-50 dark:bg-green-900/10 p-3 rounded-2xl border border-green-100 dark:border-green-900/30">
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">Catatan Admin:</p>
                        <p className="text-sm italic text-slate-700 dark:text-slate-300">"{item.review}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center bg-white/10 rounded-2xl px-5 py-3 backdrop-blur-sm border border-white/10">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-xs text-slate-400 font-medium mt-0.5">{label}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SHIPPED: { label: 'Dikirim', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    RECEIVED: { label: 'Dikonfirmasi', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    COMPLETED: { label: 'Selesai', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`text-[10px] font-black uppercase tracking-tight px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  )
}
