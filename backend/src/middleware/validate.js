import { ApiError } from "../utils/ApiError.js";

// validate(schema, "body" | "query" | "params")
// On success the parsed (and type-converted) data replaces the raw input.
export const validate = (schema, source = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return next(new ApiError(400, errors[0]?.message || "Validation failed.", errors));
  }
  req[source] = result.data;
  next();
};
