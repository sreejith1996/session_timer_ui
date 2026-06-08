import { type ChangeEvent, type FormEvent, type JSX, useState } from 'react'
import { useOutletContext } from 'react-router'
import { ArrowRight, LoaderCircle, Mail, Timer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '../lib/supabase'
import type { AppOutletContext } from '../App'

export default function HomePage(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false)
  const [googleLoading, setGoogleLoading] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [authMessage, setAuthMessage] = useState<string>('')
  const [authError, setAuthError] = useState<string>('')
  const { user, setUser, authReady } = useOutletContext<AppOutletContext>()

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setAuthMessage('')
    setAuthError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setAuthError(error.message)
    } else {
      setAuthMessage('Check your email for the login link.')
    }

    setLoading(false)
  }

  const handleGoogleLogin = async (): Promise<void> => {
    setGoogleLoading(true)
    setAuthMessage('')
    setAuthError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setAuthError(error.message)
      setGoogleLoading(false)
    }
  }

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const callBackend = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      alert('Not logged in')
      return
    }

    const response = await fetch('http://localhost:9000/api/protected', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      alert('Protected backend request failed.')
      return
    }
  }

  if (!authReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <div
          className="grid justify-items-center gap-4 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle className="size-10 animate-spin text-primary" aria-hidden="true" />
          <p>Preparing your session...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div>
        <h1>Welcome!</h1>
        <p>You are logged in as: {user.email}</p>
        <button onClick={callBackend}>Call Protected Backend Route</button>
        <button onClick={handleLogout}>Sign Out</button>
      </div>
    )
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_50%_-15%,rgba(58,143,134,0.2),transparent_34rem),var(--background)] px-4 py-10 text-foreground sm:px-6">
      <section
        className="w-full max-w-[430px] rounded-lg border border-border bg-card/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-8"
        aria-labelledby="login-title"
      >
        <div className="mx-auto mb-6 grid size-[86px] place-items-center rounded-full border border-border bg-muted">
          <div className="relative grid size-[62px] place-items-center rounded-full border-[5px] border-primary/25 border-r-primary border-t-primary">
            <span className="absolute left-1/2 top-1/2 h-5 w-[3px] origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-foreground" />
            <span className="absolute left-1/2 top-1/2 h-4 w-[3px] origin-bottom -translate-x-1/2 -translate-y-full rotate-[112deg] rounded-full bg-secondary" />
            <span className="size-2 rounded-full bg-foreground" />
          </div>
        </div>

        <div className="text-center">
          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
            Plan. Start. Stay with it.
          </p>
          <h1
            id="login-title"
            className="text-5xl font-semibold leading-none tracking-normal text-foreground sm:text-6xl"
          >
            Session Timer
          </h1>
          <p className="mx-auto mb-7 mt-4 max-w-[31rem] text-base text-muted-foreground">
            Create a simple focus plan, start the clock, and keep your session
            visible without the noise.
          </p>
        </div>

        <Button
          className="h-11 w-full border-border bg-muted text-foreground hover:border-primary hover:bg-muted/80"
          variant="outline"
          type="button"
          disabled={googleLoading || loading}
          onClick={handleGoogleLogin}
        >
          <span
            className="grid size-6 place-items-center rounded-full bg-foreground text-sm font-extrabold text-background"
            aria-hidden="true"
          >
            G
          </span>
          {googleLoading ? <span>Redirecting...</span> : <span>Continue with Google</span>}
        </Button>

        <div className="my-6 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or use a magic link</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-2" onSubmit={handleLogin}>
          <label className="text-sm font-semibold text-foreground" htmlFor="email">
            Email address
          </label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="border-border bg-background pl-9 text-foreground placeholder:text-muted-foreground/75"
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                required
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              />
            </div>
            <Button
              className="h-11 bg-secondary px-4 text-secondary-foreground hover:bg-secondary/90"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  Sending
                </>
              ) : (
                <>
                  Send link
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 min-h-6 text-center text-sm" aria-live="polite">
          {authError ? <p className="text-destructive">{authError}</p> : null}
          {authMessage ? <p className="text-primary">{authMessage}</p> : null}
        </div>

        <div className="mt-2 flex justify-center text-muted-foreground" aria-hidden="true">
          <Timer className="size-4" />
        </div>
      </section>
    </main>
  )
}
