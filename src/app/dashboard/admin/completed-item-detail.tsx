'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

import { 
  X, MapPin, MessageSquare, 
  Calendar, User, CheckCircle2 
} from 'lucide-react'

interface CompletedItemDetailProps {
  item: {
    id: string
    category: string
    description: string
    receiptLocation: string | null
    review: string | null
    penerima: { name: string | null } | null
    bookedAt: Date | null
  }
}

export function CompletedItemDetail({ item }: CompletedItemDetailProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 font-bold text-xs"
      >
        Lihat Bukti
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Detail Penyelesaian</h3>
                  <p className="text-sm text-slate-500 font-medium">{item.category}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">
              
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Penerima
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white">{item.penerima?.name || 'Anonim'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> Di-booking pada
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {item.bookedAt ? new Date(item.bookedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Lokasi Penerimaan
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {item.receiptLocation || 'Lokasi tidak tersedia'}
                  </p>
                </div>
              </div>

              {/* Review / Comment */}
              <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" /> Testimoni Penerima
                </p>
                <p className="text-slate-700 dark:text-slate-300 italic text-sm leading-relaxed">
                  &quot;{item.review || 'Tidak ada komentar.'}&quot;
                </p>
              </div>


            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button 
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-8"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
