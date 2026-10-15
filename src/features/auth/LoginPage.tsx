import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { STORE_KEY } from '@/lib/constants'
import { login, useCurrentUser, useUsers } from '@/repository'
import { ROLE_LABELS } from '@/types/enums'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const user = useCurrentUser()
  const users = useUsers()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'bilal.alee@northwindcrm.com', password: 'admin123' },
  })

  if (user) return <Navigate to="/" replace />

  const onSubmit = (values: FormValues) => {
    setPending(true)
    setTimeout(() => {
      const result = login(values.email, values.password)
      setPending(false)
      if (!result) {
        toast.error('Invalid credentials', { description: 'Check the email and password.' })
        return
      }
      toast.success(`Welcome back, ${result.name.split(' ')[0]}!`)
      navigate('/')
    }, 350)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.55), transparent 45%), radial-gradient(circle at 80% 30%, rgba(14,165,233,0.4), transparent 40%), radial-gradient(circle at 60% 90%, rgba(168,85,247,0.45), transparent 45%)',
          }}
        />
        <div className="relative flex items-center gap-2.5 text-white">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Sparkles className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Northwind CRM</span>
        </div>
        <div className="relative space-y-6 text-white">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            The sales workspace your team actually enjoys using.
          </h1>
          <p className="max-w-md text-sm text-white/70">
            Manage leads, contacts, pipeline and revenue in one polished hub. Fully functional
            demo with realistic seeded data.
          </p>
          <div className="flex flex-wrap gap-6">
            {[
              { label: 'Active deals', value: '35' },
              { label: 'Contacts', value: '40' },
              { label: 'Companies', value: '15' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Northwind CRM · Demo build
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1.5 text-center lg:text-left">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Use a demo account below or enter credentials.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@company.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Sign in
                {!pending ? <ArrowRight /> : null}
              </Button>
            </form>
          </Form>

          <div className="space-y-3">
            <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Demo accounts
            </p>
            <div className="grid gap-2">
              {users.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() =>
                    form.reset({ email: account.email, password: account.password })
                  }
                  className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  <Avatar name={account.name} color={account.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{account.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ROLE_LABELS[account.role]} · {account.email}
                    </p>
                  </div>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {account.password}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(STORE_KEY)
                window.location.reload()
              }}
              className="mx-auto block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Trouble signing in? Reset demo data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
