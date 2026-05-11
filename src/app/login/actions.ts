'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function login(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Redirect based on role if needed, or just to root
  revalidatePath('/', 'layout')
  redirect('/dashboard/penerima')
}

export async function signup(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  if (authData.user) {
    // Sync with Prisma
    try {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          email: email,
          name: name || email.split('@')[0],
          role: 'ADMIN' // default role — can access both admin & penerima views
        }
      })
    } catch (e) {
      console.error("Error creating user in Prisma:", e)
      // Ignore if user already exists
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard/admin')
}
