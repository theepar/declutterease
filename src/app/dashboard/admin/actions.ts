'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createDonationItem(formData: FormData) {
  const category = formData.get('category') as string
  const condition = formData.get('condition') as string
  const description = formData.get('description') as string
  
  await prisma.donationItem.create({
    data: { category, condition, description, status: 'AVAILABLE' },
  })
  revalidatePath('/dashboard/admin')
}

export async function updateDonationItem(formData: FormData) {
  const itemId = formData.get('itemId') as string
  const category = formData.get('category') as string
  const condition = formData.get('condition') as string
  const description = formData.get('description') as string
  
  await prisma.donationItem.update({ 
    where: { id: itemId }, 
    data: { category, condition, description } 
  })
  redirect('/dashboard/admin')
}

export async function deleteDonationItem(formData: FormData) {
  const itemId = formData.get('itemId') as string
  await prisma.donationItem.delete({ where: { id: itemId } })
  revalidatePath('/dashboard/admin')
}

