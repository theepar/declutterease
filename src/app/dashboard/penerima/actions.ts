'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function bookItem(formData: FormData) {
  const itemId = formData.get('itemId') as string
  const cs = await cookies()
  const sb = await createClient(cs)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return

  await prisma.donationItem.update({
    where: { id: itemId, status: 'AVAILABLE' },
    data: {
      status: 'SHIPPED',
      penerimaId: user.id,
      bookedAt: new Date(),
    },
  })
  revalidatePath('/dashboard/penerima')
}

export async function confirmReceipt(formData: FormData) {
  const itemId = formData.get('itemId') as string
  const location = formData.get('location') as string
  const photoFile = formData.get('photoFile') as File | null

  let photoUrl = ''
  if (photoFile && photoFile.size > 0) {
    const bytes = await photoFile.arrayBuffer()
    const b64 = Buffer.from(bytes).toString('base64')
    photoUrl = `data:${photoFile.type};base64,${b64}`
  }

  await prisma.donationItem.update({
    where: { id: itemId },
    data: { status: 'RECEIVED', receiptLocation: location, receiptPhoto: photoUrl },
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
    where: { id: itemId, penerimaId: user.id, status: 'SHIPPED' },
    data: { status: 'AVAILABLE', penerimaId: null, bookedAt: null },
  })
  revalidatePath('/dashboard/penerima')
}
