import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <div className="py-20 text-center">
      <p className="text-6xl font-bold text-indigo-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="muted mt-2">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
        Back to home
      </Link>
    </div>
  );
}
