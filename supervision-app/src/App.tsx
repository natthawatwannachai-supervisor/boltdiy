import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AdminRoute, ProtectedRoute } from '@/components/layout/RouteGuards';
import { FullPageLoader } from '@/components/ui/Loader';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { FirebaseConfigWarning } from '@/components/layout/FirebaseConfigWarning';

// Route-level code splitting keeps the landing page light.
const HomePage = lazy(() => import('@/pages/HomePage'));
const HowToUsePage = lazy(() => import('@/pages/HowToUsePage'));
const RecordSupervisionPage = lazy(() => import('@/pages/RecordSupervisionPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <FirebaseConfigWarning />

          <Suspense fallback={<FullPageLoader />}>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="how-to-use" element={<HowToUsePage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="record" element={<RecordSupervisionPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                </Route>

                <Route element={<AdminRoute />}>
                  <Route path="admin" element={<AdminPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
