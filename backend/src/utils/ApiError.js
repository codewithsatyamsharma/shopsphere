// An error we throw on purpose. The error handler turns it into a JSON response.
export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // optional: [{ field, message }] for forms
  }
}
