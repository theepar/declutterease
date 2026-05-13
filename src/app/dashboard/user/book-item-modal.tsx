'use client'

import { useState, useRef } from 'react'
import { bookItem } from './actions'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Calendar, Clock, X, CheckCircle2 } from 'lucide-react'

export function BookItemModal({ itemId, category }: { itemId: string; category: string }) {
  const [open, setOpen] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  // Min = now, rounded up to next 30 min
  const minDatetime = (() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() + 30, 0, 0)
    return d.toISOString().slice(0, 16)
  })()

  function handleOpen() {
    setScheduledAt('')
    setOpen(true)
  }

  return (
    <>
      {/* Trigger */}
      <Button
        type="button"
        onClick={handleOpen}
        className="w-full rounded-2xl h-11 font-bold gap-2 shadow-md shadow-primary/20 transition-all active:scale-95"
      >
        <ShoppingBag className="w-4 h-4" />
        Booking Sekarang
      </Button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setOpen(false)}
        >
          {/* Modal Container - stopPropagation to prevent closing when clicking inside */}
          <div 
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">Pilih Jadwal Pengambilan</h3>
                <p className="text-sm text-slate-500 mt-0.5 truncate max-w-[220px]">{category}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              <p className="text-sm text-slate-500 leading-relaxed">
                Pilih tanggal dan waktu kapan kamu ingin mengambil barang ini. Admin akan menyiapkan barang sesuai jadwal.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Tanggal & Jam Pengambilan
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    min={minDatetime}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full pl-10 pr-4 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                {scheduledAt && (
                  <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(scheduledAt).toLocaleString('id-ID', {
                      weekday: 'long', day: 'numeric', month: 'long',
                      year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>

              {/* Hidden form */}
              <form ref={formRef} action={bookItem} className="hidden">
                <input type="hidden" name="itemId" value={itemId} />
                <input type="hidden" name="scheduledAt" value={scheduledAt} />
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 h-11 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <Button
                type="button"
                disabled={!scheduledAt}
                onClick={() => {
                  if (!scheduledAt) return
                  formRef.current?.requestSubmit()
                  setOpen(false)
                }}
                className="flex-1 h-11 rounded-2xl font-bold gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                Konfirmasi
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
