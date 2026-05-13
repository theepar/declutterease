import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import LoginForm from './login-form'

export default async function LoginPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check role for smarter redirect
    const { data: dbUser } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (dbUser?.role === 'ADMIN') {
      redirect('/dashboard/admin')
    } else {
      redirect('/dashboard/user')
    }
  }

  return <LoginForm />
}
