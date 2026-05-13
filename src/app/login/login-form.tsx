'use client'

import { useState, useActionState } from 'react'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Loader2, Mail, Lock, User } from 'lucide-react'
import Link from 'next/link'

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [state, formAction, isPending] = useActionState(
    isLogin ? login : signup,
    null
  )

  const error = state?.error

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-primary/20">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-4000" />

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group w-fit mx-auto">
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 group-hover:scale-105 transition-transform">
            <Package className="w-6 h-6 text-primary fill-primary/20" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
            Declutter<span className="text-primary">Ease</span>
          </span>
        </Link>

        <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-2 pt-8 pb-6 px-8 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isLogin ? 'Welcome back' : 'Create an Account'}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              {isLogin 
                ? 'Enter your credentials to access your account' 
                : 'Enter your details below to start donating or booking items'}
            </CardDescription>
          </CardHeader>
          <form action={formAction} method="POST">
            <CardContent className="space-y-5 px-8">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-medium flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </div>
              )}
              
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <Input 
                      id="name" 
                      name="name" 
                      type="text" 
                      placeholder="John Doe" 
                      required={!isLogin} 
                      className="pl-10 rounded-xl h-12 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    className="pl-10 rounded-xl h-12 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">Password</Label>
                  {isLogin && (
                    <Link href="#" className="text-xs font-medium text-primary hover:underline">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    required 
                    className="pl-10 rounded-xl h-12 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
              <Button 
                type="submit" 
                className="w-full rounded-xl h-12 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5" 
                disabled={isPending}
              >
                {isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
              
              <div className="text-sm text-center text-slate-500 dark:text-slate-400 mt-4">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button" 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Login'}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
