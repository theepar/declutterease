'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createDonationItem(formData: FormData) {
  const category = formData.get('category') as string
  const condition = formData.get('condition') as string
  const description = formData.get('description') as string
  const photoFile = formData.get('photoFile') as File | null
  let photos: string[] = []
  if (photoFile && photoFile.size > 0) {
    const b64 = Buffer.from(await photoFile.arrayBuffer()).toString('base64')
    photos = [`data:${photoFile.type};base64,${b64}`]
  }
  await prisma.donationItem.create({
    data: { category, condition, description, photos, status: 'AVAILABLE' },
  })
  revalidatePath('/dashboard/admin')
}

export async function updateDonationItem(formData: FormData) {
  const itemId = formData.get('itemId') as string
  const category = formData.get('category') as string
  const condition = formData.get('condition') as string
  const description = formData.get('description') as string
  const photoFile = formData.get('photoFile') as File | null
  const existingPhoto = formData.get('existingPhoto') as string
  let photos: string[] = existingPhoto ? [existingPhoto] : []
  if (photoFile && photoFile.size > 0) {
    const b64 = Buffer.from(await photoFile.arrayBuffer()).toString('base64')
    photos = [`data:${photoFile.type};base64,${b64}`]
  }
  await prisma.donationItem.update({ 
    where: { id: itemId }, 
    data: { category, condition, description, photos } 
  })
  redirect('/dashboard/admin')
}

export async function deleteDonationItem(formData: FormData) {
  const itemId = formData.get('itemId') as string
  await prisma.donationItem.delete({ where: { id: itemId } })
  revalidatePath('/dashboard/admin')
}

