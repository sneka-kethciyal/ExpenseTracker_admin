import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../components/layout/AdminLayout';

// Pages
import LoginPage from '../pages/Login/LoginPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import UsersPage from '../pages/Users/UsersPage';
import UserDetailsPage from '../pages/Users/UserDetailsPage';
import GroupsPage from '../pages/Groups/GroupsPage';
import SchedulesPage from '../pages/Schedules/SchedulesPage';
import GeoLocationPage from '../pages/GeoLocation/GeoLocationPage';
import ExpenseCreditPage from '../pages/ExpenseCredit/ExpenseCreditPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import AccessDeniedPage from '../pages/AccessDenied/AccessDeniedPage';
import NotFoundPage from '../pages/NotFound/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Authenticated Dashboard Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Super Admin only — user creation, group, schedule management */}
        <Route
          path="/users"
          element={
            <ProtectedRoute superAdminOnly>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:userId"
          element={
            <ProtectedRoute superAdminOnly>
              <UserDetailsPage />
            </ProtectedRoute>
          }
        />
        {/* Super Admin Groups & Schedules */}
        <Route
          path="/groups"
          element={
            <ProtectedRoute superAdminOnly>
              <GroupsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/schedules" element={<Navigate to="/groups" replace />} />

        {/* Authenticated + permission-gated routes */}
        <Route
          path="/geo-location"
          element={
            <ProtectedRoute requiredPermission="view_geo">
              <GeoLocationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <ProtectedRoute requiredPermission="view_finance">
              <ExpenseCreditPage />
            </ProtectedRoute>
          }
        />

        {/* Legacy profile redirected to dashboard */}
        <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
