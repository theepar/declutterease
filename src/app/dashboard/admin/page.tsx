import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { revalidatePath } from 'next/cache'
import { DeleteItemButton } from './delete-button'
import {
  PlusCircle, Package, Users, MapPin, Image as ImageIcon,
  Star, CheckCircle2, TrendingUp, LayoutDashboard, Pencil, Clock, X, Inbox,
} from 'lucide-react'

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const resolvedParams = await searchParams
  const editingId = resolvedParams.edit ?? null

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser?.role !== 'ADMIN') redirect('/dashboard/penerima')

  const donations = await prisma.donationItem.findMany({
    orderBy: { createdAt: 'desc' },
    include: { penerima: true },
  })

  const editingItem = editingId ? donations.find((d) => d.id === editingId) ?? null : null
  const availableItems  = donations.filter((i) => i.status === 'AVAILABLE')
  const shippedItems    = donations.filter((i) => i.status === 'SHIPPED')
  const pendingReview   = donations.filter((i) => i.status === 'RECEIVED')
  const completedItems  = donations.filter((i) => i.status === 'COMPLETED')

  // ─── Server Actions ──────────────────────────────────────────────────────────

  async function createDonationItem(formData: FormData) {
    'use server'
    const category = formData.get('category') as string
    const condition = formData.get('condition') as string
    const description = formData.get('description') as string
    const photoFile = formData.get('photoFile') as File | null
    let photos: string[] = []
    if (photoFile && photoFile.size > 0) {
      const b64 = Buffer.from(await photoFile.arrayBuffer()).toString('base64')
      photos = [`data:${photoFile.type};base64,${b64}`]
    }
    await prisma.donationItem.create({
      data: { category, condition, description, photos, status: 'AVAILABLE' },
    })
    revalidatePath('/dashboard/admin')
  }

  async function updateDonationItem(formData: FormData) {
    'use server'
    const itemId = formData.get('itemId') as string
    const category = formData.get('category') as string
    const condition = formData.get('condition') as string
    const description = formData.get('description') as string
    const photoFile = formData.get('photoFile') as File | null
    const existingPhoto = formData.get('existingPhoto') as string
    let photos: string[] = existingPhoto ? [existingPhoto] : []
    if (photoFile && photoFile.size > 0) {
      const b64 = Buffer.from(await photoFile.arrayBuffer()).toString('base64')
      photos = [`data:${photoFile.type};base64,${b64}`]
    }
    await prisma.donationItem.update({ where: { id: itemId }, data: { category, condition, description, photos } })
    redirect('/dashboard/admin')
  }

  async function deleteDonationItem(formData: FormData) {
    'use server'
    const itemId = formData.get('itemId') as string
    await prisma.donationItem.delete({ where: { id: itemId } })
    revalidatePath('/dashboard/admin')
  }

  async function addReview(formData: FormData) {
    'use server'
    const itemId = formData.get('itemId') as string
    const review = formData.get('review') as string
    await prisma.donationItem.update({
      where: { id: itemId },
      data: { status: 'COMPLETED', review },
    })
    revalidatePath('/dashboard/admin')
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24">

      {/* ── Banner ─────────────────────────────────────────────────────── */}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {[
              { label: 'Tersedia', val: availableItems.length, color: 'text-sky-400', bg: 'bg-sky-400/10' },
              { label: 'Booked', val: shippedItems.length, color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { label: 'Review', val: pendingReview.length, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { label: 'Selesai', val: completedItems.length, color: 'text-green-400', bg: 'bg-green-400/10' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} border border-white/5 rounded-2xl px-4 py-3 text-center backdrop-blur-sm`}>
                <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left — Form Panel */}
        <div className="lg:col-span-4 lg:sticky lg:top-6">
          {editingItem ? (
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
                  <input type="hidden" name="existingPhoto" value={editingItem.photos[0] ?? ''} />
                  <FormField label="Kategori" id="edit-cat">
                    <Input id="edit-cat" name="category" defaultValue={editingItem.category} required className="rounded-xl h-11" />
                  </FormField>
                  <FormField label="Kondisi" id="edit-cond">
                    <Input id="edit-cond" name="condition" defaultValue={editingItem.condition} required className="rounded-xl h-11" />
                  </FormField>
                  <FormField label="Deskripsi" id="edit-desc">
                    <Textarea id="edit-desc" name="description" defaultValue={editingItem.description} required className="rounded-xl min-h-[90px]" />
                  </FormField>
                  <FormField label="Ganti Foto (opsional)" id="edit-photo">
                    {editingItem.photos[0] && (
                      <img src={editingItem.photos[0]} alt="" className="w-full h-32 object-cover rounded-xl mb-2" />
                    )}
                    <Input id="edit-photo" name="photoFile" type="file" accept="image/*" className="rounded-xl h-11 cursor-pointer pt-2.5 text-sm" />
                  </FormField>
                  <Button type="submit" className="w-full rounded-xl h-11 font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200/50 dark:shadow-amber-900/20">
                    Simpan Perubahan
                  </Button>
                </form>
              </div>
            </div>
          ) : (
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
                  <FormField label="Foto Barang" id="photoFile">
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input id="photoFile" name="photoFile" type="file" accept="image/*" className="pl-9 rounded-xl h-11 cursor-pointer pt-2.5 text-sm border-slate-200 dark:border-slate-800" />
                    </div>
                  </FormField>
                  <Button type="submit" className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/20">
                    Publikasikan Barang
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Right — Lists */}
        <div className="lg:col-span-8 space-y-10">

          {/* ── Pending Review ─────────────────────────────────────────── */}
          {pendingReview.length > 0 && (
            <section className="space-y-5">
              <SectionHeader
                icon={<Star className="w-4 h-4 text-purple-500 fill-purple-500/30" />}
                iconBg="bg-purple-50 dark:bg-purple-900/20"
                title="Menunggu Review"
                badge={`${pendingReview.length} item`}
                badgeColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                pulse
              />
              <div className="space-y-5">
                {pendingReview.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-200/50 dark:border-purple-900/30 overflow-hidden shadow-lg shadow-purple-500/5">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-56 h-56 bg-slate-100 dark:bg-slate-800 shrink-0 relative">
                        {item.receiptPhoto ? (
                          <img src={item.receiptPhoto} alt="Tanda Terima" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
                            <ImageIcon className="w-10 h-10" />
                            <span className="text-xs font-medium">Belum ada foto</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Penerima Upload</span>
                        </div>
                      </div>
                      <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.category}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span>Penerima: <span className="font-semibold text-slate-800 dark:text-slate-200">{item.penerima?.name}</span></span>
                          </div>
                          {item.receiptLocation && (
                            <div className="flex items-start gap-2 text-sm text-slate-500">
                              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                              <span className="italic leading-snug">{item.receiptLocation}</span>
                            </div>
                          )}
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                          <form action={addReview} className="space-y-3">
                            <input type="hidden" name="itemId" value={item.id} />
                            <Label htmlFor={`review-${item.id}`} className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Catatan Penyelesaian
                            </Label>
                            <Textarea
                              id={`review-${item.id}`}
                              name="review"
                              placeholder="Barang sudah terkonfirmasi diterima dengan baik..."
                              required
                              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm min-h-[80px]"
                            />
                            <Button type="submit" className="w-full rounded-xl h-11 font-bold gap-2 shadow-lg shadow-primary/20">
                              <CheckCircle2 className="w-4 h-4" /> Selesaikan Donasi
                            </Button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── All Inventory ───────────────────────────────────────────── */}
          <section className="space-y-5">
            <SectionHeader
              icon={<Package className="w-4 h-4 text-primary" />}
              iconBg="bg-primary/10"
              title="Semua Inventaris"
              badge={`${donations.length} items`}
              badgeColor="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            />

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
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                        {item.photos[0] ? (
                          <img src={item.photos[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">{item.category}</h4>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-sm text-slate-500 truncate">{item.description}</p>
                        {item.penerima && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                            <Users className="w-3 h-3" />
                            <span>{item.penerima.name}</span>
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

          {/* ── Completed ───────────────────────────────────────────────── */}
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
                  <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-green-100 dark:border-green-900/30 px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                      {item.photos[0] ? (
                        <img src={item.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-slate-300" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.category}</p>
                      {item.review && <p className="text-xs text-slate-500 italic truncate mt-0.5">"{item.review}"</p>}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                      <Users className="w-3 h-3" />{item.penerima?.name}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
