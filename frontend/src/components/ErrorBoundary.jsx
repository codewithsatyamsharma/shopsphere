import { Component } from "react";

// Error boundaries must be class components: there is no hook for them.
// They catch errors thrown while RENDERING. They do not catch errors in event handlers or async code.
export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true }; // switch to the fallback UI on the next render
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack); // send to a logging service in a real app
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-slate-500">An unexpected error happened. Please try again.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
              onClick={() => (window.location.href = "/")}
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
