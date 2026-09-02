import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { auth } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { FullPageLoader } from '@/components/ui/Loader';

/** Requires a signed-in account; otherwise bounces home with the login modal open. */
export function ProtectedRoute() {
  const { user, initialising, openAuthModal } = useAuth();
  const location = useLocation();
  // A sign-in that has not reached the context yet still counts as signed in.
  const pending = !user && Boolean(auth.currentUser);
  // Signing out from a protected page should send the user home quietly, not
  // greet them with the login modal they just escaped.
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (user) {
      wasSignedIn.current = true;
    }
  }, [user]);

  useEffect(() => {
    if (!initialising && !user && !auth.currentUser && !wasSignedIn.current) {
      openAuthModal('login');
    }
  }, [initialising, user, openAuthModal]);

  if (initialising || pending) {
    return <FullPageLoader label="กำลังตรวจสอบสิทธิ์การเข้าใช้งาน..." />;
  }

  return user ? <Outlet /> : <Navigate to="/" replace state={{ from: location.pathname }} />;
}

/** Requires membership of the `admins` collection. */
export function AdminRoute() {
  const { user, isAdmin, initialising } = useAuth();

  if (initialising || (!user && auth.currentUser)) {
    return <FullPageLoader label="กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
