import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { BadgeCheck, MessageSquare, Trash2 } from "lucide-react";
import { api, getErrorMessage, getFieldErrors } from "../../../lib/api";
import { formatDate } from "../../../lib/format";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StarRating } from "../../../components/ui/StarRating";
import { Textarea } from "../../../components/ui/Textarea";

const reviewSchema = z.object({
  rating: z.number().int().min(1, "Choose a star rating").max(5),
  comment: z.string().trim().min(3, "Comment must be at least 3 characters").max(1000, "Comment is too long"),
});

// Loads reviews page by page and APPENDS them, so "Load more" never loses what is on screen
function useReviews(productId) {
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ reviews: [], summary: null, pagination: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(`/products/${productId}/reviews`, { params: { page, limit: 5 }, signal: controller.signal })
      .then((res) => {
        const { reviews, summary, pagination } = res.data.data;
        setState((s) => ({
          // de-duplicate by id: Strict Mode runs effects twice in development
          reviews: page === 1 ? reviews : [...s.reviews, ...reviews.filter((r) => !s.reviews.some((x) => x.id === r.id))],
          summary,
          pagination,
          loading: false,
          error: null,
        }));
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        setState((s) => ({ ...s, loading: false, error: getErrorMessage(error) }));
      });
    return () => controller.abort();
  }, [productId, page, reloadKey]);

  const loadMore = useCallback(() => setPage((p) => p + 1), []);
  const reload = useCallback(() => {
    setPage(1);
    setReloadKey((k) => k + 1);
  }, []);
  return { ...state, loadMore, reload };
}

function RatingBars({ summary }) {
  return (
    <div className="space-y-1.5" aria-label="Rating breakdown">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = summary.distribution[star] ?? 0;
        const percent = summary.count ? (count / summary.count) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-12 shrink-0 whitespace-nowrap">{star} star</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
            </div>
            <span className="muted w-6 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewForm({ productId, onSubmitted }) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 0, comment: "" } });

  const onSubmit = async (values) => {
    try {
      await api.post(`/products/${productId}/reviews`, values);
      toast.success("Thanks for your review!");
      reset();
      onSubmitted();
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors.length) fieldErrors.forEach(({ field, message }) => setError(field, { message }));
      else setError("root", { message: getErrorMessage(error) });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-3 p-4">
      <h3 className="font-semibold">Write a review</h3>
      <div>
        <Controller name="rating" control={control} render={({ field }) => <StarRating value={field.value} onChange={field.onChange} />} />
        {errors.rating && <p role="alert" className="mt-1 text-xs text-red-600">{errors.rating.message}</p>}
      </div>
      <Textarea label="Your review" rows={3} error={errors.comment?.message} {...register("comment")} />
      {errors.root && <p role="alert" className="text-sm text-red-600">{errors.root.message}</p>}
      <Button type="submit" loading={isSubmitting}>Submit review</Button>
    </form>
  );
}

export function ReviewSection({ productId, onChanged }) {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const { reviews, summary, pagination, loading, error, loadMore, reload } = useReviews(productId);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const changed = () => {
    reload(); // refresh the list and summary
    onChanged?.(); // refresh the product's average rating at the top of the page
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/reviews/${toDelete}`);
      toast.success("Review deleted");
      setToDelete(null);
      changed();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const hasMine = reviews.some((r) => r.isMine);

  return (
    <section aria-labelledby="reviews-heading" className="mt-12">
      <h2 id="reviews-heading" className="mb-4 text-xl font-bold">Customer reviews</h2>
      {error && !summary ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4">
            {summary && (
              <div className="card p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-4xl font-bold">{summary.average ? summary.average.toFixed(1) : "-"}</span>
                  <div>
                    <StarRating value={summary.average} size="h-5 w-5" />
                    <p className="muted text-xs">{summary.count} review{summary.count === 1 ? "" : "s"}</p>
                  </div>
                </div>
                <RatingBars summary={summary} />
              </div>
            )}
            {user ? (
              hasMine ? (
                <p className="muted card p-4 text-sm">You have reviewed this product. Thank you!</p>
              ) : (
                <ReviewForm productId={productId} onSubmitted={changed} />
              )
            ) : (
              <p className="card p-4 text-sm">
                <Link to="/login" state={{ from: location }} className="link font-medium">Log in</Link> to write a review.
              </p>
            )}
          </div>

          <div className="lg:col-span-2">
            {loading && reviews.length === 0 ? (
              <p className="muted text-sm" role="status">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No reviews yet" message="Be the first to share your thoughts." />
            ) : (
              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li key={review.id} className="card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <StarRating value={review.rating} />
                        <p className="mt-1 text-sm font-medium">
                          {review.user.name}
                          {review.verified && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-emerald-600 dark:text-emerald-400">
                              <BadgeCheck className="h-3.5 w-3.5" />Verified purchase
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <time className="muted text-xs" dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
                        {review.isMine && (
                          <button onClick={() => setToDelete(review.id)} aria-label="Delete your review" className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm">{review.comment}</p>
                  </li>
                ))}
              </ul>
            )}
            {pagination && pagination.page < pagination.totalPages && (
              <div className="mt-4 text-center">
                <Button variant="secondary" onClick={loadMore} loading={loading}>Load more reviews</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete your review?"
        message="This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </section>
  );
}
