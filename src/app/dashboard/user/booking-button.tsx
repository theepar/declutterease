'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface BookingButtonProps {
  label: string
  loadingLabel?: string
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function BookingButton({ label, loadingLabel = 'Memproses...', className, size = 'default' }: BookingButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button 
      type="submit"
      disabled={pending}
      size={size}
      className={className || "w-full rounded-[24px] font-bold py-7 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 flex items-center justify-center gap-2"}
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  )
}
