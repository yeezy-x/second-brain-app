import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/auth-schemas";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { getErrorMessage } from "@/lib/error";

type LocationState = { from?: { pathname: string } } | null;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      const state = location.state as LocationState;
      const dest = state?.from?.pathname || "/dashboard";
      toast.success("Welcome back");
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  });

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Pick up where you left off."
    >
      <form onSubmit={onSubmit} className="grid gap-4" data-testid="login-form">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@domain.com"
            invalid={Boolean(errors.email)}
            {...register("email")}
            data-testid="login-email-input"
          />
          {errors.email ? (
            <p className="text-xs text-danger" data-testid="login-email-error">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="At least 6 characters"
            invalid={Boolean(errors.password)}
            {...register("password")}
            data-testid="login-password-input"
          />
          {errors.password ? (
            <p className="text-xs text-danger" data-testid="login-password-error">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-2"
          isLoading={isSubmitting || login.isPending}
          data-testid="login-submit-btn"
        >
          Sign in
        </Button>

        <p className="text-center text-sm text-muted-fg">
          New here?{" "}
          <Link
            to="/signup"
            className="text-accent underline-offset-4 hover:underline"
            data-testid="login-to-signup-link"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Left: hero */}
      <aside className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden border-r border-border">
        <div className="grain absolute inset-0" />
        <div className="absolute inset-0 z-0 bg-linear-to-br from-accent/10 via-transparent to-indigo-500/10" />
        <div className="relative z-10">
          <Logo />
        </div>
        <div className="relative z-10 max-w-md">
          <p className="font-display text-3xl font-semibold leading-tight tracking-tight text-fg">
            A quiet place for everything you don't want to forget.
          </p>
          <p className="mt-3 text-sm text-muted-fg leading-relaxed">
            Save tweets, videos, links and notes. Search them anytime.
            Your second brain — fast, private, yours.
          </p>
          <ul className="mt-6 grid gap-2 text-sm text-muted-fg">
            <li>· Capture in seconds with one keystroke</li>
            <li>· Tag, filter, and full-text search</li>
            <li>· Built on your own backend, no lock-in</li>
          </ul>
        </div>
        <p className="relative z-10 text-xs text-muted-fg/80">
          Crafted for thinkers, builders, and curious humans.
        </p>
      </aside>

      {/* Right: form */}
      <main className="relative flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-fg">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

export { AuthLayout };
