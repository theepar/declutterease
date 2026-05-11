import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { revalidatePath } from 'next/cache'
import { 
  PlusCircle, 
  Package, 
  Users, 
  MapPin, 
  Image as ImageIcon, 
  Star, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react'

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  
  if (dbUser?.role !== 'ADMIN') {
    redirect('/dashboard/penerima')
  }

  const donations = await prisma.donationItem.findMany({
    orderBy: { createdAt: 'desc' },
    include: { penerima: true }
  })

  // Separate lists for better management
  const availableItems = donations.filter(i => i.status === 'AVAILABLE')
  const shippedItems = donations.filter(i => i.status === 'SHIPPED')
  const pendingReview = donations.filter(i => i.status === 'RECEIVED')
  const completedItems = donations.filter(i => i.status === 'COMPLETED')

  async function createDonationItem(formData: FormData) {
    'use server'
    const category = formData.get('category') as string
    const condition = formData.get('condition') as string
    const description = formData.get('description') as string
    const photoFile = formData.get('photoFile') as File | null

    let photoUrl = ""

    if (photoFile && photoFile.size > 0) {
      const cookieStore = await cookies()
      const supabaseServer = await createClient(cookieStore)

      const fileExt = photoFile.name.split('.').pop()
      const fileName = `item-${Math.random().toString(36).substring(2, 15)}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabaseServer.storage
        .from('declutterease')
        .upload(`donations/${fileName}`, photoFile)

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabaseServer.storage
          .from('declutterease')
          .getPublicUrl(uploadData.path)
        photoUrl = publicUrl
      }
    }

    await prisma.donationItem.create({
      data: {
        category,
        condition,
        description,
        photos: photoUrl ? [photoUrl] : [],
        status: 'AVAILABLE'
      }
    })

    revalidatePath('/dashboard/admin')
  }

  async function addReview(formData: FormData) {
    'use server'
    const itemId = formData.get('itemId') as string
    const review = formData.get('review') as string

    await prisma.donationItem.update({
      where: { id: itemId },
      data: {
        status: 'COMPLETED',
        review: review
      }
    })

    revalidatePath('/dashboard/admin')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1 font-bold tracking-wider text-xs uppercase">
            <LayoutDashboard className="w-4 h-4" /> Management Console
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Admin Dashboard</h1>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Tersedia" value={availableItems.length} icon={<Package className="w-4 h-4" />} color="text-blue-600" />
          <StatCard label="Booked" value={shippedItems.length} icon={<TrendingUp className="w-4 h-4" />} color="text-amber-600" />
          <StatCard label="Review" value={pendingReview.length} icon={<Star className="w-4 h-4" />} color="text-purple-600" />
          <StatCard label="Selesai" value={completedItems.length} icon={<CheckCircle2 className="w-4 h-4" />} color="text-green-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Analytics */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <PlusCircle className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl font-bold">Input Barang Baru</CardTitle>
              </div>
              <CardDescription>Tambah inventaris barang donasi baru.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form action={createDonationItem} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold">Kategori</Label>
                  <Input id="category" name="category" placeholder="Contoh: Pakaian, Elektronik" required className="rounded-xl border-slate-200 dark:border-slate-800 h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition" className="text-sm font-semibold">Kondisi</Label>
                  <Input id="condition" name="condition" placeholder="Contoh: Bagus, Seperti Baru" required className="rounded-xl border-slate-200 dark:border-slate-800 h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Deskripsi Singkat</Label>
                  <Textarea id="description" name="description" placeholder="Ceritakan sedikit tentang barang ini..." required className="rounded-xl border-slate-200 dark:border-slate-800 min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photoFile" className="text-sm font-semibold">Foto Barang</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <Input id="photoFile" name="photoFile" type="file" accept="image/*" className="pl-11 rounded-xl border-slate-200 dark:border-slate-800 h-11 cursor-pointer pt-2 file:mr-4 file:py-0 file:px-0 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-transparent file:text-primary" />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                  Publikasikan Barang
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Management Tabs/Lists */}
        <div className="lg:col-span-8 space-y-10">
          {/* Pending Review Section - Priority */}
          {pendingReview.length > 0 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Star className="w-6 h-6 text-purple-500 fill-purple-500/20" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Menunggu Review</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {pendingReview.map((item) => (
                  <Card key={item.id} className="rounded-3xl border-purple-200/50 dark:border-purple-900/30 overflow-hidden shadow-lg shadow-purple-500/5 bg-white dark:bg-slate-900">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-64 h-64 bg-slate-100 dark:bg-slate-800 shrink-0 relative">
                        {item.receiptPhoto ? (
                          <img src={item.receiptPhoto} alt="Tanda Terima" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 uppercase text-[10px] font-bold tracking-widest p-4 text-center">Foto Belum Ada</div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Foto dari Penerima
                        </div>
                      </div>
                      
                      <div className="flex-1 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold">{item.category}</h3>
                            <div className="flex items-center gap-2 text-slate-500 mt-1">
                              <Users className="w-4 h-4" />
                              <span className="text-sm">Penerima: <span className="font-semibold text-slate-900 dark:text-white">{item.penerima?.name}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 mt-1">
                              <MapPin className="w-4 h-4 text-red-500" />
                              <span className="text-sm italic">{item.receiptLocation}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <form action={addReview} className="space-y-3">
                            <input type="hidden" name="itemId" value={item.id} />
                            <Label htmlFor={`review-${item.id}`} className="text-xs font-bold uppercase text-slate-500 tracking-wider">Berikan Review/Catatan Selesai</Label>
                            <Textarea 
                              id={`review-${item.id}`} 
                              name="review" 
                              placeholder="Ketik catatan di sini... (e.g. 'Barang sudah terkonfirmasi sampai di lokasi dengan baik')" 
                              required 
                              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                            />
                            <Button size="sm" className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2">
                              Selesaikan Donasi <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Main Inventory Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Semua Inventaris</h2>
              </div>
              <div className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                Total: {donations.length} items
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {donations.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 italic">Belum ada data donasi.</div>
                ) : (
                  donations.map((item) => (
                    <div key={item.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-950/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                          {item.photos[0] ? (
                            <img src={item.photos[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{item.category}</h4>
                          <p className="text-sm text-slate-500 line-clamp-1">{item.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                             <StatusBadge status={item.status} />
                             <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-tighter">Kondisi: {item.condition}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {item.penerima && (
                          <div className="hidden sm:block text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Penerima</p>
                             <p className="text-sm font-semibold">{item.penerima.name}</p>
                          </div>
                        )}
                        <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
      <div className={`flex items-center gap-2 mb-1 ${color}`}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    'AVAILABLE': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'SHIPPED': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'RECEIVED': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'COMPLETED': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  }[status] || 'bg-slate-100 text-slate-600'

  const labels = {
    'AVAILABLE': 'Tersedia',
    'SHIPPED': 'Dikirim',
    'RECEIVED': 'Diterima',
    'COMPLETED': 'Selesai',
  }[status] || status

  return (
    <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${styles}`}>
      {labels}
    </span>
  )
}
