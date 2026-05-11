'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useRef } from 'react'

export function DeleteItemButton({
  itemId,
  action,
}: {
  itemId: string
  action: (formData: FormData) => Promise<void>
}) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="itemId" value={itemId} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full w-9 h-9 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        onClick={() => {
          if (confirm('Hapus barang ini? Tindakan tidak dapat dibatalkan.')) {
            formRef.current?.requestSubmit()
          }
        }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </form>
  )
}
