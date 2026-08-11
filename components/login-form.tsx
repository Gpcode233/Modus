"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLoginWithEmail } from "@privy-io/react-auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type Step = "initial" | "otp"

export function LoginForm({ className, mode = "signin", ...props }: React.ComponentProps<"div"> & { mode?: "signin" | "signup" }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("initial")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onComplete: () => router.push("/accounts"),
    onError: (err) => setError(String(err)),
  })

  const sending = emailState.status === "sending-code"
  const isDev = process.env.NODE_ENV === "development"

  async function handleDevLogin() {
    setError(null)
    try {
      const res = await fetch("/api/auth/dev-login", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Dev login failed")
      localStorage.setItem("modus-dev-auth", data.address)
      router.push("/accounts")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dev login failed")
    }
  }
  const verifying = emailState.status === "submitting-code"

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await sendCode({ email })
      setStep("otp")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code")
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await loginWithCode({ code })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code")
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          {step === "initial" ? (
            <>
              <CardTitle className="text-xl">
                {mode === "signup" ? "Create your account" : "Sign in to Modus"}
              </CardTitle>
              <CardDescription>
                {mode === "signup"
                  ? "An Arc-compatible wallet is created automatically for you"
                  : "Enter your email to receive a sign-in code"}
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-xl">Check your email</CardTitle>
              <CardDescription>
                We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {step === "initial" ? (
            <form onSubmit={handleEmailSubmit}>
              <FieldGroup>
                {/* Dev-only wallet login */}
                {isDev && (
                  <Field>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full border-dashed border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 font-mono text-xs"
                      onClick={handleDevLogin}
                    >
                      <span className="mr-1.5 rounded bg-amber-200 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide">DEV</span>
                      Sign in with Arc wallet
                    </Button>
                  </Field>
                )}

                {/* Email */}
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>

                <Field>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={sending || !email}>
                    {sending ? "Sending code…" : "Continue with email"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="code">One-time code</FieldLabel>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="text-center font-mono tracking-[0.5em] text-lg"
                  />
                </Field>

                <Field>
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={verifying || code.length < 6}
                  >
                    {verifying ? "Verifying…" : "Verify code"}
                  </Button>
                  <FieldDescription className="flex justify-center gap-4 text-center">
                    <button
                      type="button"
                      onClick={() => { setStep("initial"); setCode(""); setError(null) }}
                      className="hover:text-foreground transition-colors"
                    >
                      Back
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => sendCode({ email })}
                      disabled={sending}
                      className="hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          )}

          {error && (
            <p className="mt-3 text-center text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        {mode === "signup" ? (
          <>Already have an account?{" "}
            <a href="/login" className="underline underline-offset-4 hover:text-primary font-medium">Sign in</a>
          </>
        ) : (
          <>New to Modus?{" "}
            <a href="/signup" className="underline underline-offset-4 hover:text-primary font-medium">Create account</a>
          </>
        )}
      </FieldDescription>

      <FieldDescription className="px-6 text-center">
        By continuing you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}

