import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

export default function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : "An unexpected error occurred.";
  return (
    <div role="alert" className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="muted mt-2">{message}</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white">Go home</Link>
      </div>
    </div>
  );
}
