'use client'

import { cancelBooking } from './actions'

export function CancelBookingButton({ itemId }: { itemId: string }) {
  return (
    <form action={cancelBooking}>
      <input type="hidden" name="itemId" value={itemId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm('Batalkan booking barang ini?')) e.preventDefault()
        }}
        className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors py-1 text-center"
      >
        Batalkan Booking
      </button>
    </form>
  )
}
