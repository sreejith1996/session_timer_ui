import { type ChangeEvent, type FormEvent, type JSX, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router'
import {
  ArrowRight,
  ChevronDown,
  LoaderCircle,
  Mail,
  Play,
  Plus,
  Settings,
  Timer,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '../lib/supabase'
import type { AppOutletContext } from '../App'

type Task = {
  id: string
  name: string
}

const sanitizeTimeInput = (value: string, max: number): string => {
  const digits = value.replace(/\D/g, '').slice(0, 2)

  if (!digits) {
    return ''
  }

  return Math.min(Number(digits), max).toString()
}

const formatTimeInput = (value: string): string => {
  if (!value) {
    return '00'
  }

  return Number(value).toString().padStart(2, '0')
}

const timePartsToSeconds = (hours: string, minutes: string, seconds: string): number => {
  return Number(hours || 0) * 60 * 60 + Number(minutes || 0) * 60 + Number(seconds || 0)
}

export default function HomePage(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false)
  const [googleLoading, setGoogleLoading] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [authMessage, setAuthMessage] = useState<string>('')
  const [authError, setAuthError] = useState<string>('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [newTaskName, setNewTaskName] = useState<string>('')
  const [hours, setHours] = useState<string>('01')
  const [minutes, setMinutes] = useState<string>('25')
  const [seconds, setSeconds] = useState<string>('00')
  const { user, setUser, authReady } = useOutletContext<AppOutletContext>()

  const totalDurationInSeconds = useMemo(
    () => timePartsToSeconds(hours, minutes, seconds),
    [hours, minutes, seconds],
  )
  const canStartSession = selectedTaskId !== '' && totalDurationInSeconds > 0

  const selectedTask = tasks.find((task) => task.id === selectedTaskId)

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

  const handleAddTask = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()

    const trimmedTaskName = newTaskName.trim()

    if (!trimmedTaskName) {
      return
    }

    const task: Task = {
      id: `local-task-${Date.now()}`,
      name: trimmedTaskName,
    }

    setTasks((currentTasks) => [...currentTasks, task])
    setSelectedTaskId(task.id)
    setNewTaskName('')
  }

  const handleStartSession = (): void => {
    if (!canStartSession || !selectedTask) {
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
      <main className="grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,0.14),transparent_24rem),var(--background)] px-3 py-5 text-foreground sm:px-6 sm:py-8">
        <section className="relative min-h-[680px] w-full max-w-[442px] overflow-hidden rounded-lg border border-border bg-card px-6 py-6 shadow-[0_26px_90px_rgba(0,0,0,0.5)] sm:min-h-[700px] sm:px-7">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(150deg,rgba(34,211,238,0.08),transparent_36%),radial-gradient(circle_at_50%_45%,rgba(245,158,11,0.09),transparent_18rem)]" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="size-7 text-primary" aria-hidden="true" />
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-foreground">
                Session Timer
              </p>
            </div>
            <Button
              className="h-9 rounded-md border-primary bg-[#0891b2] px-3 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(34,211,238,0.18)] hover:bg-[#06b6d4]"
              variant="outline"
              type="button"
              aria-label="Sign out"
              title={user.email ? `Sign out ${user.email}` : 'Sign out'}
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>

          <div className="relative z-10 mt-12 flex justify-center sm:mt-14">
            <div className="relative grid aspect-square w-[min(100%,395px)] place-items-center rounded-full border border-primary/55">
              <div
                className="absolute inset-4 rounded-full opacity-55"
                style={{
                  background:
                    'repeating-conic-gradient(from -90deg, rgba(248,250,252,0.32) 0deg 0.8deg, transparent 0.8deg 3.8deg)',
                  maskImage: 'radial-gradient(circle, transparent 68%, black 69%)',
                  WebkitMaskImage: 'radial-gradient(circle, transparent 68%, black 69%)',
                }}
                aria-hidden="true"
              />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <span
                  key={angle}
                  className="absolute left-1/2 top-1/2 h-[3px] w-5 origin-left rounded-full bg-secondary shadow-[0_0_12px_rgba(245,158,11,0.45)]"
                  style={{
                    transform: `rotate(${angle}deg) translateX(calc(min(100vw - 6rem, 380px) / 2 - 18px))`,
                  }}
                  aria-hidden="true"
                />
              ))}

              <div className="relative z-10 grid w-[82%] justify-items-center gap-6">
                <div className="grid justify-items-center gap-3">
                  <Timer className="size-6 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium text-foreground">Set your focus time</p>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
                  <label className="grid justify-items-center gap-2">
                    <span className="sr-only">Hours</span>
                    <Input
                      className="h-[58px] rounded-md border-[#5b6472] bg-[#252b35] px-1 text-center text-5xl font-light leading-none text-foreground shadow-[0_1px_0_rgba(255,255,255,0.05)_inset] focus-visible:border-primary focus-visible:ring-primary/40"
                      inputMode="numeric"
                      value={hours}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setHours(sanitizeTimeInput(event.target.value, 99))
                      }
                      onBlur={() => setHours(formatTimeInput(hours))}
                      onFocus={(event) => event.target.select()}
                    />
                    <span className="text-xs font-semibold uppercase text-muted-foreground">HR</span>
                  </label>
                  <span className="pb-8 text-4xl font-light text-muted-foreground">:</span>
                  <label className="grid justify-items-center gap-2">
                    <span className="sr-only">Minutes</span>
                    <Input
                      className="h-[58px] rounded-md border-[#5b6472] bg-[#252b35] px-1 text-center text-5xl font-light leading-none text-foreground shadow-[0_1px_0_rgba(255,255,255,0.05)_inset] focus-visible:border-primary focus-visible:ring-primary/40"
                      inputMode="numeric"
                      value={minutes}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setMinutes(sanitizeTimeInput(event.target.value, 59))
                      }
                      onBlur={() => setMinutes(formatTimeInput(minutes))}
                      onFocus={(event) => event.target.select()}
                    />
                    <span className="text-xs font-semibold uppercase text-muted-foreground">MIN</span>
                  </label>
                  <span className="pb-8 text-4xl font-light text-muted-foreground">:</span>
                  <label className="grid justify-items-center gap-2">
                    <span className="sr-only">Seconds</span>
                    <Input
                      className="h-[58px] rounded-md border-[#5b6472] bg-[#252b35] px-1 text-center text-5xl font-light leading-none text-foreground shadow-[0_1px_0_rgba(255,255,255,0.05)_inset] focus-visible:border-primary focus-visible:ring-primary/40"
                      inputMode="numeric"
                      value={seconds}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setSeconds(sanitizeTimeInput(event.target.value, 59))
                      }
                      onBlur={() => setSeconds(formatTimeInput(seconds))}
                      onFocus={(event) => event.target.select()}
                    />
                    <span className="text-xs font-semibold uppercase text-muted-foreground">SEC</span>
                  </label>
                </div>

                <div className="grid w-full gap-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2">
                    <label className="relative">
                      <span className="sr-only">Select task</span>
                      <select
                        className="h-11 w-full appearance-none rounded-md border border-[#5b6472] bg-[#252b35] px-4 pr-10 text-sm font-medium text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:border-[#343c48] disabled:bg-[#1f242c] disabled:text-[#7f8997]"
                        value={selectedTaskId}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                          setSelectedTaskId(event.target.value)
                        }
                      >
                        <option value="">Select task</option>
                        {tasks.map((task) => (
                          <option key={task.id} value={task.id}>
                            {task.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </label>
                    <Button
                      className="h-11 rounded-md border-primary bg-[#0891b2] text-white shadow-[0_8px_22px_rgba(34,211,238,0.18)] hover:bg-[#06b6d4]"
                      variant="outline"
                      size="icon"
                      type="button"
                      aria-label="Focus new task input"
                      onClick={() => document.getElementById('new-task-name')?.focus()}
                    >
                      <Plus className="size-5" aria-hidden="true" />
                    </Button>
                  </div>

                  <form className="grid grid-cols-[minmax(0,1fr)_70px] gap-2" onSubmit={handleAddTask}>
                    <Input
                      id="new-task-name"
                      className="h-10 rounded-md border-[#5b6472] bg-[#252b35] text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/40"
                      placeholder="New task name"
                      value={newTaskName}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setNewTaskName(event.target.value)
                      }
                    />
                    <Button
                      className="h-10 rounded-md border border-primary bg-[#0891b2] font-semibold text-white shadow-[0_8px_22px_rgba(34,211,238,0.18)] hover:bg-[#06b6d4] disabled:border-[#343c48] disabled:bg-[#171b22] disabled:text-[#7f8997] disabled:shadow-none"
                      type="submit"
                      disabled={newTaskName.trim() === ''}
                    >
                      Add
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-auto mt-5 grid w-full max-w-[290px] gap-5 sm:mt-6">
            <Button
              className="h-12 rounded-md border border-primary bg-[#0891b2] text-base font-semibold text-white shadow-[0_8px_22px_rgba(34,211,238,0.18)] hover:bg-[#06b6d4] disabled:border-[#3a414d] disabled:bg-[#171b22] disabled:text-[#9aa4b2] disabled:shadow-none"
              type="button"
              disabled={!canStartSession}
              onClick={handleStartSession}
            >
              <Play className="fill-current" aria-hidden="true" />
              Start Session
            </Button>

            <Button
              className="mx-auto h-10 w-[170px] rounded-md border-primary bg-[#0891b2] text-sm font-semibold text-white shadow-[0_8px_22px_rgba(34,211,238,0.18)] hover:bg-[#06b6d4]"
              variant="outline"
              type="button"
            >
              <Settings aria-hidden="true" />
              Session Settings
            </Button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_50%_-15%,rgba(34,211,238,0.18),transparent_34rem),var(--background)] px-4 py-10 text-foreground sm:px-6">
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
