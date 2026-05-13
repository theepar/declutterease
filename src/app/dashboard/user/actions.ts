'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

  revalidatePath('/dashboard/user')
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

  revalidatePath('/dashboard/user')
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

  revalidatePath('/dashboard/user')
}

export async function bookCleaningService(formData: FormData) {
  const serviceId = formData.get('serviceId') as string
  const cs = await cookies()
  const sb = await createClient(cs)
  const { data: { user } } = await sb.auth.getUser()

  console.log('Attempting to book service:', { serviceId, userId: user?.id })

  if (!user) {
    console.error('No user found in bookCleaningService')
    return
  }

  const { data, error } = await sb
    .from('CleaningService')
    .update({
      status: 'PENDING',
      penerima_id: user.id,
    })
    .eq('id', serviceId)
    .select()

  if (error) {
    console.error('Supabase error in bookCleaningService:', error)
  } else {
    console.log('Update result data:', data)
    if (!data || data.length === 0) {
      console.warn('No rows updated. Check if serviceId is correct and exists.')
    }
  }

  revalidatePath('/dashboard/user')
  revalidatePath('/dashboard/admin')
  redirect('/dashboard/user')
}

export async function cancelCleaningBooking(formData: FormData) {
  const serviceId = formData.get('serviceId') as string
  const cs = await cookies()
  const sb = await createClient(cs)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return

  await sb
    .from('CleaningService')
    .update({
      status: 'AVAILABLE',
      penerima_id: null,
    })
    .eq('id', serviceId)
    .eq('penerima_id', user.id)
    .in('status', ['PENDING', 'APPROVED'])

  revalidatePath('/dashboard/user')
}
