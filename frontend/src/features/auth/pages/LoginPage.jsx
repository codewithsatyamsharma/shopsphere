import { Link, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { AuthCard } from "../components/AuthCard";
import { login } from "../authSlice";
import { loginSchema } from "../schemas";

const DEMO = {
  customer: { email: "demo@shopsphere.local", password: "Demo@1234" },
  admin: { email: "admin@shopsphere.local", password: "Admin@123" },
};

export default function LoginPage() {
  useDocumentTitle("Log in");
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const redirectTo = location.state?.from?.pathname ?? "/";

  const {
    register: field,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = async (values) => {
    try {
      const loggedIn = await dispatch(login(values)).unwrap(); // unwrap() throws if the thunk was rejected
      toast.success(`Welcome back, ${loggedIn.name.split(" ")[0]}!`);
    } catch (err) {
      // err is the plain object we passed to rejectWithValue: { message, errors }
      if (err.errors?.length) err.errors.forEach(({ field: name, message }) => setError(name, { message }));
      else setError("root", { message: err.message });
    }
  };

  if (user) return <Navigate to={redirectTo} replace />; // already signed in

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to your account"
      footer={<>New here? <Link to="/register" className="link font-medium">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...field("email")} />
        <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...field("password")} />
        {errors.root && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" className="w-full" loading={isSubmitting}>Log in</Button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
        <p className="muted mb-2 text-center text-xs">Demo accounts (click to fill the form)</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => reset(DEMO.customer)}>Customer</Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => reset(DEMO.admin)}>Admin</Button>
        </div>
      </div>
    </AuthCard>
  );
}
