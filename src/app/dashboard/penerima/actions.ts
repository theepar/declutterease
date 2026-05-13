'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function bookItem(formData: FormData) {
  const itemId = formData.get('itemId') as string
  const scheduledAt = formData.get('scheduledAt') as string
  const cs = await cookies()
  const sb = await createClient(cs)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return

  await sb
    .from('DonationItem')
    .update({
      status: 'SHIPPED',
      penerimaId: user.id,
      bookedAt: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('status', 'AVAILABLE')

  revalidatePath('/dashboard/penerima')
}

export async function confirmReceipt(formData: FormData) {
  const itemId = formData.get('itemId') as string
  const location = formData.get('location') as string
  const review = formData.get('review') as string
  const cs = await cookies()
  const sb = await createClient(cs)

  await sb
    .from('DonationItem')
    .update({ 
      status: 'COMPLETED', 
      receiptLocation: location, 
      review: review
    })
    .eq('id', itemId)

  revalidatePath('/dashboard/penerima')
}

export async function cancelBooking(formData: FormData) {
  const itemId = formData.get('itemId') as string
  const cs = await cookies()
  const sb = await createClient(cs)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return

  await sb
    .from('DonationItem')
    .update({
      status: 'AVAILABLE',
      penerimaId: null,
      bookedAt: null,
      receiptLocation: null
    })
    .eq('id', itemId)
    .eq('penerimaId', user.id)
    .in('status', ['SHIPPED', 'RECEIVED'])

  revalidatePath('/dashboard/penerima')
}
