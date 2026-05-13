'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LocateFixed, Loader2, MapPin, CheckCircle2 } from 'lucide-react'
import { confirmReceipt } from './actions'

export function ConfirmReceiptForm({ itemId }: { itemId: string }) {
  const [location, setLocation] = useState('')
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  async function detectLocation() {
    if (!navigator.geolocation) {
      setLocError('Browser tidak mendukung geolocation.')
      return
    }
    setLocating(true)
    setLocError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'id' } }
          )
          const data = await res.json()
          const addr = data.display_name as string
          setLocation(addr)
        } catch {
          // Fallback ke koordinat mentah
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocError('Akses lokasi ditolak. Izinkan di pengaturan browser.')
        } else {
          setLocError('Gagal mendapatkan lokasi. Coba lagi.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <form ref={formRef} action={confirmReceipt} className="space-y-3">
      <input type="hidden" name="itemId" value={itemId} />

      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
        Konfirmasi Penerimaan
      </p>

      {/* Location field */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 shrink-0" />
            <Input
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lokasi penerimaan..."
              required
              className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 h-11 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={detectLocation}
            disabled={locating}
            title="Deteksi lokasi otomatis"
            className="h-11 w-11 rounded-xl border-slate-200 dark:border-slate-700 shrink-0 hover:border-primary hover:text-primary transition-colors"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4" />
            )}
          </Button>
        </div>
        {locError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span>⚠</span> {locError}
          </p>
        )}
        {location && !locating && (
          <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Lokasi terdeteksi
          </p>
        )}
      </div>


      <div className="space-y-1.5">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
          Pesan / Komentar
        </p>
        <textarea
          name="review"
          placeholder="Tuliskan pesan atau testimoni kamu..."
          required
          className="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm min-h-[80px] p-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
        />
      </div>

      <Button
        type="submit"
        className="w-full rounded-xl h-11 font-bold gap-2 shadow-lg shadow-primary/20 mt-2"
      >
        <CheckCircle2 className="w-4 h-4" /> Konfirmasi Terima & Selesai
      </Button>
    </form>
  )
}
