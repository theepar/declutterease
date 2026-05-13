'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createDonationItem(formData: FormData) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const category = formData.get('category') as string
    const condition = formData.get('condition') as string
    const description = formData.get('description') as string
    
    const { error } = await supabase.from('DonationItem').insert({ 
      category, 
      condition, 
      description, 
      status: 'AVAILABLE' 
    })
    
    if (error) {
      console.error('Error inserting donation item:', error)
      return
    }
    
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/user')
    redirect('/dashboard/admin')
  } catch (err) {
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err
    console.error('Unexpected error in createDonationItem:', err)
  }
}

export async function updateDonationItem(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const itemId = formData.get('itemId') as string
  const category = formData.get('category') as string
  const condition = formData.get('condition') as string
  const description = formData.get('description') as string
  
  await supabase
    .from('DonationItem')
    .update({ category, condition, description })
    .eq('id', itemId)

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/user')
  redirect('/dashboard/admin')
}

export async function deleteDonationItem(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const itemId = formData.get('itemId') as string
  await supabase.from('DonationItem').delete().eq('id', itemId)
  
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/user')
}

export async function createCleaningService(formData: FormData) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const description = formData.get('description') as string
    const scheduled_at = formData.get('scheduled_at') as string
    
    if (!description || !scheduled_at) {
      console.error('Missing description or scheduled_at')
      return
    }

    const { error } = await supabase.from('CleaningService').insert({ 
      description, 
      scheduled_at: new Date(scheduled_at).toISOString(),
      status: 'AVAILABLE' 
    })
    
    if (error) {
      console.error('Error inserting cleaning service:', error)
      return
    }
    
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/user')
    redirect('/dashboard/admin')
  } catch (err) {
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err
    console.error('Unexpected error in createCleaningService:', err)
  }
}

export async function approveCleaningBooking(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const serviceId = formData.get('serviceId') as string
  
  await supabase
    .from('CleaningService')
    .update({ status: 'APPROVED' })
    .eq('id', serviceId)

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/user')
}

export async function completeCleaningService(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const serviceId = formData.get('serviceId') as string
  
  await supabase
    .from('CleaningService')
    .update({ status: 'COMPLETED' })
    .eq('id', serviceId)

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/user')
}

export async function updateCleaningService(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const serviceId = formData.get('serviceId') as string
  const description = formData.get('description') as string
  const scheduled_at = formData.get('scheduled_at') as string
  
  await supabase
    .from('CleaningService')
    .update({ 
      description, 
      scheduled_at: new Date(scheduled_at).toISOString() 
    })
    .eq('id', serviceId)

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/user')
  redirect('/dashboard/admin')
}

export async function deleteCleaningService(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const serviceId = formData.get('serviceId') as string
  await supabase.from('CleaningService').delete().eq('id', serviceId)
  
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/user')
}
