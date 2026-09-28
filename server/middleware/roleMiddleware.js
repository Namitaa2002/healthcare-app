import { UserRole } from "../generated/prisma/client.ts";

// =====================================================
// ROLE AUTHORIZATION MIDDLEWARE
// =====================================================
// This middleware checks whether the logged-in user
// has permission to access a particular API route.
//
// Authentication middleware should run BEFORE this
// middleware because req.user is created by authentication.
//
// Example:
//
// router.post(
//   "/branch",
//   authenticate,
//   authorize(UserRole.ORGANIZATION_ADMIN),
//   createBranch
// );

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check whether authenticated user information exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check whether user's role is included in
    // the roles allowed for this route
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    // User has the required role, so continue
    next();
  };
};

export default authorize;