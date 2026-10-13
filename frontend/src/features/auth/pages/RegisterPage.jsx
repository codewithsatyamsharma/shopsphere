import { Link, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { AuthCard } from "../components/AuthCard";
import { register as registerUser } from "../authSlice"; // renamed: react-hook-form also has a `register`
import { registerSchema } from "../schemas";

export default function RegisterPage() {
  useDocumentTitle("Create account");
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);

  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", password: "" } });

  const onSubmit = async (values) => {
    try {
      await dispatch(registerUser(values)).unwrap();
      toast.success("Account created. Welcome to ShopSphere!");
    } catch (err) {
      // Show each server message under the matching input (for example "email already exists")
      if (err.errors?.length) err.errors.forEach(({ field: name, message }) => setError(name, { message }));
      else setError("root", { message: err.message });
    }
  };

  if (user) return <Navigate to={location.state?.from?.pathname ?? "/"} replace />;

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start shopping in under a minute"
      footer={<>Already have an account? <Link to="/login" className="link font-medium">Log in</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...field("name")} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...field("email")} />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number"
          error={errors.password?.message}
          {...field("password")}
        />
        {errors.root && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" className="w-full" loading={isSubmitting}>Create account</Button>
      </form>
    </AuthCard>
  );
}
