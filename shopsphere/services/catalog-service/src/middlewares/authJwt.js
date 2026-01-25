import jwt from "jsonwebtoken";

// Require a valid JWT
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      return next({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Missing or invalid Authorization header",
      });
    }

    if (!process.env.JWT_SECRET) {
      return next({
        status: 500,
        code: "SERVER_CONFIG_ERROR",
        message: "JWT_SECRET not set",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // expected: { id, role, ... }
    next();
  } catch (err) {
    return next({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
}

// Require role(s)
export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role) {
      return next({
        status: 401,
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    if (!roles.includes(role)) {
      return next({
        status: 403,
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      });
    }

    next();
  };
}
