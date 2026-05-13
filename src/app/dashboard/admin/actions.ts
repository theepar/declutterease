'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createDonationItem(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const category = formData.get('category') as string
  const condition = formData.get('condition') as string
  const description = formData.get('description') as string
  
  await supabase.from('DonationItem').insert({ 
    category, 
    condition, 
    description, 
    status: 'AVAILABLE' 
  })
  
  revalidatePath('/dashboard/admin')
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

  redirect('/dashboard/admin')
}

export async function deleteDonationItem(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const itemId = formData.get('itemId') as string
  await supabase.from('DonationItem').delete().eq('id', itemId)
  
  revalidatePath('/dashboard/admin')
}
