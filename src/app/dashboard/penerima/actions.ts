'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function bookItem(formData: FormData) {
  const itemId = formData.get('itemId') as string
  const scheduledAt = formData.get('scheduledAt') as string
  const cs = await cookies()
  const sb = await createClient(cs)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return

  await prisma.donationItem.update({
    where: { id: itemId, status: 'AVAILABLE' },
    data: {
      status: 'SHIPPED',
      penerimaId: user.id,
      bookedAt: scheduledAt ? new Date(scheduledAt) : new Date(),
    },
  })
  revalidatePath('/dashboard/penerima')
}

export async function confirmReceipt(formData: FormData) {
  const itemId = formData.get('itemId') as string
  const location = formData.get('location') as string
  const review = formData.get('review') as string

  await prisma.donationItem.update({
    where: { id: itemId },
    data: { 
      status: 'COMPLETED', 
      receiptLocation: location, 
      review: review
    },
  })
  revalidatePath('/dashboard/penerima')
}

export async function cancelBooking(formData: FormData) {
  const itemId = formData.get('itemId') as string
  const cs = await cookies()
  const sb = await createClient(cs)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return

  await prisma.donationItem.update({
    where: {
      id: itemId,
      penerimaId: user.id,
      status: { in: ['SHIPPED', 'RECEIVED'] }
    },
    data: {
      status: 'AVAILABLE',
      penerimaId: null,
      bookedAt: null,
      receiptLocation: null
    },
  })
  revalidatePath('/dashboard/penerima')
}
