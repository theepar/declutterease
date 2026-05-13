'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(prevState: unknown, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard/user')
}

export async function signup(prevState: unknown, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

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
    // Sync with Supabase DB
    try {
      const { error: dbError } = await supabase.from('User').insert({
        id: authData.user.id,
        email: email,
        name: name || email.split('@')[0],
        role: 'ADMIN' // default role
      })
      if (dbError) throw dbError
    } catch (e) {
      console.error("Error creating user in Supabase:", e)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard/admin')
}
