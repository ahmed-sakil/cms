import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SonnerToaster } from "./components/ui/SonnerToaster.js";

// Layouts
import { PublicLayout } from "./layouts/PublicLayout.js";
import { AdminLayout } from "./layouts/AdminLayout.js";
import { StudentLayout } from "./layouts/StudentLayout.js";

// Modules & Pages
import { LandingPage } from "./modules/public/LandingPage.js";
import { BatchDetailsPage } from "./modules/public/BatchDetailsPage.js";
import { LoginPage } from "./modules/auth/LoginPage.js";
import { RegisterPage } from "./modules/auth/RegisterPage.js";
import { AdminDashboard } from "./modules/admin/AdminDashboard.js";
import { StudentsManagement } from "./modules/admin/StudentsManagement.js";
import { BranchesManagement } from "./modules/admin/BranchesManagement.js";
import { TeachersManagement } from "./modules/admin/TeachersManagement.js";
import { OrganizationSettingsPage } from "./modules/admin/OrganizationSettings.js";
import { BatchesManagement } from "./modules/admin/BatchesManagement.js";
import { StudyMaterialsManagement } from "./modules/admin/StudyMaterialsManagement.js";
import { FeesAndAccountsManagement } from "./modules/admin/FeesAndAccountsManagement.js";
import { ExpensesManagement } from "./modules/admin/ExpensesManagement.js";
import { NoticesManagement } from "./modules/admin/NoticesManagement.js";
import { ExamsAndResultsManagement } from "./modules/admin/ExamsAndResultsManagement.js";
import { ReferralsManagement } from "./modules/admin/ReferralsManagement.js";
import { StudentDashboard } from "./modules/student/StudentDashboard.js";
import { StudentProfilePage } from "./modules/student/StudentProfilePage.js";
import { StudentMaterialsPage } from "./modules/student/StudentMaterialsPage.js";
import { StudentFeesPage } from "./modules/student/StudentFeesPage.js";
import { StudentExamsPage } from "./modules/student/StudentExamsPage.js";
import { StudentReferralsPage } from "./modules/student/StudentReferralsPage.js";
import { RoleRouteGuard } from "./components/common/RoleRouteGuard.js";
import { UserRole } from "./types/index.js";

export function App() {
  return (
    <BrowserRouter>
      {/* Global Toaster with instant cross button */}
      <SonnerToaster />

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
          <Route path="courses" element={<AdminDashboard />} />
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
    </BrowserRouter>
  );
}


export default App;
