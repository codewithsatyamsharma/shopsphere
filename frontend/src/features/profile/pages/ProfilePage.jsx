import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { api, getErrorMessage, getFieldErrors } from "../../../lib/api";
import { formatDate } from "../../../lib/format";
import { passwordSchema, profileSchema } from "../../auth/schemas";
import { updateProfile } from "../../auth/authSlice";

function DetailsForm() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user.name } });

  const onSubmit = async (values) => {
    try {
      await dispatch(updateProfile(values)).unwrap();
      toast.success("Profile updated");
    } catch (err) {
      if (err.errors?.length) err.errors.forEach(({ field, message }) => setError(field, { message }));
      else setError("root", { message: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-4 p-5">
      <h2 className="text-lg font-semibold">Your details</h2>
      <Input label="Full name" error={errors.name?.message} {...register("name")} />
      <Input label="Email" value={user.email} disabled readOnly hint="Your email cannot be changed" />
      <p className="muted text-xs">Member since {formatDate(user.createdAt)} · {user.role === "admin" ? "Administrator" : "Customer"}</p>
      {errors.root && <p role="alert" className="text-sm text-red-600">{errors.root.message}</p>}
      <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>
    </form>
  );
}

function PasswordForm() {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await api.patch("/auth/password", { currentPassword, newPassword });
      toast.success("Password changed");
      reset();
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors.length) fieldErrors.forEach(({ field, message }) => setError(field, { message }));
      else setError("root", { message: getErrorMessage(error) });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-4 p-5">
      <h2 className="text-lg font-semibold">Change password</h2>
      <Input label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
      <Input label="New password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number" error={errors.newPassword?.message} {...register("newPassword")} />
      <Input label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      {errors.root && <p role="alert" className="text-sm text-red-600">{errors.root.message}</p>}
      <Button type="submit" loading={isSubmitting}>Update password</Button>
    </form>
  );
}

export default function ProfilePage() {
  useDocumentTitle("Profile");
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">My profile</h1>
      <DetailsForm />
      <PasswordForm />
    </div>
  );
}
