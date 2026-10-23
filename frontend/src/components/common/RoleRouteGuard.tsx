import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserRole } from "../../types/index.js";

interface RoleRouteGuardProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export const RoleRouteGuard: React.FC<RoleRouteGuardProps> = ({ allowedRoles, children }) => {
  const location = useLocation();
  const token = localStorage.getItem("cms_token");
  const rawUser = localStorage.getItem("cms_user");

  if (!token) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  let userRole: UserRole | null = null;
  try {
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      userRole = parsed.role;
    }
  } catch {
    localStorage.removeItem("cms_token");
    localStorage.removeItem("cms_refresh_token");
    localStorage.removeItem("cms_user");
    return <Navigate to="/login" replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    // Redirect unauthorized user to their respective legitimate home portal
    if (userRole === UserRole.STUDENT) {
      return <Navigate to="/student" replace />;
    }
    if (userRole === UserRole.TEACHER) {
      return <Navigate to="/teacher" replace />;
    }
    if (userRole === UserRole.APPLICANT) {
      return <Navigate to="/teacher/application-status" replace />;
    }
    if (
      userRole === UserRole.SUPER_ADMIN ||
      userRole === UserRole.BRANCH_ADMIN ||
      userRole === UserRole.STAFF
    ) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleRouteGuard;
