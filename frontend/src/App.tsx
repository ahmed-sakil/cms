import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SonnerToaster } from "./components/ui/SonnerToaster.js";
import { RoleRouteGuard } from "./components/common/RoleRouteGuard.js";
import { UserRole } from "./types/index.js";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Delay slightly to let target render if navigating from another route
      const timer = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, hash]);

  return null;
}

// Lazy-loaded Layouts
const PublicLayout = lazy(() =>
  import("./layouts/PublicLayout.js").then((m) => ({ default: m.PublicLayout }))
);
const AdminLayout = lazy(() =>
  import("./layouts/AdminLayout.js").then((m) => ({ default: m.AdminLayout }))
);
const StudentLayout = lazy(() =>
  import("./layouts/StudentLayout.js").then((m) => ({ default: m.StudentLayout }))
);

// Lazy-loaded Public & Auth Pages
const LandingPage = lazy(() =>
  import("./modules/public/LandingPage.js").then((m) => ({ default: m.LandingPage }))
);
const BatchDetailsPage = lazy(() =>
  import("./modules/public/BatchDetailsPage.js").then((m) => ({ default: m.BatchDetailsPage }))
);
const LoginPage = lazy(() =>
  import("./modules/auth/LoginPage.js").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("./modules/auth/RegisterPage.js").then((m) => ({ default: m.RegisterPage }))
);

// Lazy-loaded Admin Modules
const AdminDashboard = lazy(() =>
  import("./modules/admin/AdminDashboard.js").then((m) => ({ default: m.AdminDashboard }))
);
const StudentsManagement = lazy(() =>
  import("./modules/admin/StudentsManagement.js").then((m) => ({ default: m.StudentsManagement }))
);
const BranchesManagement = lazy(() =>
  import("./modules/admin/BranchesManagement.js").then((m) => ({ default: m.BranchesManagement }))
);
const TeachersManagement = lazy(() =>
  import("./modules/admin/TeachersManagement.js").then((m) => ({ default: m.TeachersManagement }))
);
const BatchesManagement = lazy(() =>
  import("./modules/admin/BatchesManagement.js").then((m) => ({ default: m.BatchesManagement }))
);
const CoursesManagement = lazy(() =>
  import("./modules/admin/CoursesManagement.js").then((m) => ({ default: m.CoursesManagement }))
);
const StudyMaterialsManagement = lazy(() =>
  import("./modules/admin/StudyMaterialsManagement.js").then((m) => ({
    default: m.StudyMaterialsManagement,
  }))
);
const FeesAndAccountsManagement = lazy(() =>
  import("./modules/admin/FeesAndAccountsManagement.js").then((m) => ({
    default: m.FeesAndAccountsManagement,
  }))
);
const ExpensesManagement = lazy(() =>
  import("./modules/admin/ExpensesManagement.js").then((m) => ({
    default: m.ExpensesManagement,
  }))
);
const NoticesManagement = lazy(() =>
  import("./modules/admin/NoticesManagement.js").then((m) => ({ default: m.NoticesManagement }))
);
const ExamsAndResultsManagement = lazy(() =>
  import("./modules/admin/ExamsAndResultsManagement.js").then((m) => ({
    default: m.ExamsAndResultsManagement,
  }))
);
const ReferralsManagement = lazy(() =>
  import("./modules/admin/ReferralsManagement.js").then((m) => ({
    default: m.ReferralsManagement,
  }))
);
const OrganizationSettingsPage = lazy(() =>
  import("./modules/admin/OrganizationSettings.js").then((m) => ({
    default: m.OrganizationSettingsPage,
  }))
);

// Lazy-loaded Student Modules
const StudentDashboard = lazy(() =>
  import("./modules/student/StudentDashboard.js").then((m) => ({ default: m.StudentDashboard }))
);
const StudentProfilePage = lazy(() =>
  import("./modules/student/StudentProfilePage.js").then((m) => ({
    default: m.StudentProfilePage,
  }))
);
const StudentMaterialsPage = lazy(() =>
  import("./modules/student/StudentMaterialsPage.js").then((m) => ({
    default: m.StudentMaterialsPage,
  }))
);
const StudentFeesPage = lazy(() =>
  import("./modules/student/StudentFeesPage.js").then((m) => ({ default: m.StudentFeesPage }))
);
const StudentExamsPage = lazy(() =>
  import("./modules/student/StudentExamsPage.js").then((m) => ({ default: m.StudentExamsPage }))
);
const StudentReferralsPage = lazy(() =>
  import("./modules/student/StudentReferralsPage.js").then((m) => ({
    default: m.StudentReferralsPage,
  }))
);

const RouteLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh] p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium text-text-muted">Loading module...</p>
    </div>
  </div>
);

export function App() {
  return (
    <BrowserRouter>
      {/* Scroll restoration & smooth hash jumps */}
      <ScrollToTop />

      {/* Global Toaster with instant cross button */}
      <SonnerToaster />

      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Public Landing & Marketing */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/batches/:id" element={<BatchDetailsPage />} />
          </Route>

          {/* Auth Entry */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Admin Portal */}
          <Route
            path="/admin"
            element={
              <RoleRouteGuard
                allowedRoles={[
                  UserRole.SUPER_ADMIN,
                  UserRole.BRANCH_ADMIN,
                  UserRole.TEACHER,
                  UserRole.STAFF,
                ]}
              >
                <AdminLayout />
              </RoleRouteGuard>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentsManagement />} />
            <Route path="branches" element={<BranchesManagement />} />
            <Route path="teachers" element={<TeachersManagement />} />
            <Route path="batches" element={<BatchesManagement />} />
            <Route path="materials" element={<StudyMaterialsManagement />} />
            <Route path="courses" element={<CoursesManagement />} />
            <Route path="exams" element={<ExamsAndResultsManagement />} />
            <Route path="notices" element={<NoticesManagement />} />
            <Route path="fees" element={<FeesAndAccountsManagement />} />
            <Route path="expenses" element={<ExpensesManagement />} />
            <Route path="referrals" element={<ReferralsManagement />} />
            <Route path="settings" element={<OrganizationSettingsPage />} />
          </Route>

          {/* Protected Student Portal */}
          <Route
            path="/student"
            element={
              <RoleRouteGuard allowedRoles={[UserRole.STUDENT]}>
                <StudentLayout />
              </RoleRouteGuard>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="materials" element={<StudentMaterialsPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
            <Route path="attendance" element={<StudentDashboard />} />
            <Route path="exams" element={<StudentExamsPage />} />
            <Route path="fees" element={<StudentFeesPage />} />
            <Route path="referrals" element={<StudentReferralsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
