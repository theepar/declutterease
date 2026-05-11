import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { revalidatePath } from 'next/cache'
import { Package, MapPin, Camera, CheckCircle2, Clock, ArrowRight } from 'lucide-react'

export default async function PenerimaDashboard() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const availableDonations = await prisma.donationItem.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { createdAt: 'desc' }
  })

  const myBookings = await prisma.donationItem.findMany({
    where: { 
      penerimaId: user.id,
      status: { in: ['SHIPPED', 'RECEIVED', 'COMPLETED'] }
    },
    orderBy: { createdAt: 'desc' }
  })

  async function bookItem(formData: FormData) {
    'use server'
    const itemId = formData.get('itemId') as string
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // "Langsung sampai" means it goes straight to SHIPPED
    await prisma.donationItem.update({
      where: { id: itemId, status: 'AVAILABLE' },
      data: {
        status: 'SHIPPED',
        penerimaId: user.id
      }
    })

    revalidatePath('/dashboard/penerima')
  }

  async function confirmReceipt(formData: FormData) {
    'use server'
    const itemId = formData.get('itemId') as string
    const location = formData.get('location') as string
    const photoFile = formData.get('photoFile') as File | null

    let photoUrl = ""

    if (photoFile && photoFile.size > 0) {
      const cookieStore = await cookies()
      const supabaseServer = await createClient(cookieStore)

      const fileExt = photoFile.name.split('.').pop()
      const fileName = `receipt-${Math.random().toString(36).substring(2, 15)}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabaseServer.storage
        .from('declutterease')
        .upload(`receipts/${fileName}`, photoFile)

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabaseServer.storage
          .from('declutterease')
          .getPublicUrl(uploadData.path)
        photoUrl = publicUrl
      }
    }

    await prisma.donationItem.update({
      where: { id: itemId },
      data: {
        status: 'RECEIVED',
        receiptLocation: location,
        receiptPhoto: photoUrl
      }
    })

    revalidatePath('/dashboard/penerima')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Penerima Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Temukan barang yang kamu butuhkan dan kelola pesananmu.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{dbUser.name}</span>
        </div>
      </div>

      {/* Available Items Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Barang Tersedia</h2>
        </div>
        
        {availableDonations.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-lg">Belum ada barang tersedia saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableDonations.map((item) => (
              <Card key={item.id} className="group overflow-hidden border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl">
                <div className="relative h-56 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {item.photos[0] ? (
                    <img 
                      src={item.photos[0]} 
                      alt={item.category} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Package className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm border border-slate-200 dark:border-slate-800">
                      {item.category}
                    </span>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold">{item.category}</CardTitle>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {item.condition}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2 mt-1">{item.description}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <form action={bookItem} className="w-full">
                    <input type="hidden" name="itemId" value={item.id} />
                    <Button type="submit" className="w-full rounded-2xl h-11 font-semibold transition-all active:scale-95">
                      Booking Sekarang
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Active Bookings / History */}
      <section className="space-y-6 pt-10 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Aktivitas Saya</h2>
        </div>

        {myBookings.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 italic">Kamu belum melakukan booking apapun.</p>
        ) : (
          <div className="space-y-4">
            {myBookings.map((item) => (
              <Card key={item.id} className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-48 h-48 bg-slate-100 dark:bg-slate-800 shrink-0">
                    {item.photos[0] && (
                      <img src={item.photos[0]} alt={item.category} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">{item.category}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          item.status === 'RECEIVED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {item.status === 'SHIPPED' ? 'Kurir Menuju Lokasi' : 
                           item.status === 'RECEIVED' ? 'Menunggu Konfirmasi Admin' : 'Selesai'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{item.description}</p>
                    </div>

                    {item.status === 'SHIPPED' && (
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <form action={confirmReceipt} className="space-y-4">
                          <input type="hidden" name="itemId" value={item.id} />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`location-${item.id}`} className="text-xs font-bold uppercase tracking-wider text-slate-500">Lokasi Penerimaan (Dummy)</Label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input 
                                  id={`location-${item.id}`} 
                                  name="location" 
                                  placeholder="Masukkan alamat/sharelok..." 
                                  required 
                                  className="pl-9 rounded-xl border-slate-200 dark:border-slate-800"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`photo-${item.id}`} className="text-xs font-bold uppercase tracking-wider text-slate-500">Foto Barang Sampai</Label>
                              <div className="relative">
                                <Camera className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input 
                                  id={`photo-${item.id}`} 
                                  name="photoFile" 
                                  type="file" 
                                  accept="image/*" 
                                  required 
                                  className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer pt-2"
                                />
                              </div>
                            </div>
                          </div>
                          <Button type="submit" variant="secondary" className="w-full rounded-xl gap-2 font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-800">
                            Konfirmasi Terima Barang <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    )}

                    {item.status === 'COMPLETED' && item.review && (
                      <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900/30">
                        <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase mb-1">Review Admin:</p>
                        <p className="text-sm italic text-slate-700 dark:text-slate-300">"{item.review}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
