// React import not required (jsx: react-jsx)
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signupSchema,
  type SignupFormValues,
} from "@/features/auth/schemas/auth-schemas";
import { useSignup } from "@/features/auth/hooks/useSignup";
import { getErrorMessage } from "@/lib/error";
import { AuthLayout } from "@/features/auth/pages/LoginPage";

export default function SignupPage() {
  const navigate = useNavigate();
  const signup = useSignup();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signup.mutateAsync({ email: values.email, password: values.password });
      toast.success("Account created");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  });

  const busy = isSubmitting || signup.isPending;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Two fields. Thirty seconds. Lifetime of recall."
    >
      <form onSubmit={onSubmit} className="grid gap-4" data-testid="signup-form">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@domain.com"
            invalid={Boolean(errors.email)}
            {...register("email")}
            data-testid="signup-email-input"
          />
          {errors.email ? (
            <p className="text-xs text-danger" data-testid="signup-email-error">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            invalid={Boolean(errors.password)}
            {...register("password")}
            data-testid="signup-password-input"
          />
          {errors.password ? (
            <p className="text-xs text-danger" data-testid="signup-password-error">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
            data-testid="signup-confirm-input"
          />
          {errors.confirmPassword ? (
            <p
              className="text-xs text-danger"
              data-testid="signup-confirm-error"
            >
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-2"
          isLoading={busy}
          data-testid="signup-submit-btn"
        >
          Create account
        </Button>

        <p className="text-center text-sm text-muted-fg">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-accent underline-offset-4 hover:underline"
            data-testid="signup-to-login-link"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
