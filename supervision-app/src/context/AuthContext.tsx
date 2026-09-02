import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { getUserProfile, isAdminUid } from '@/services/userService';
import { login as loginService, logout as signOutUser, type LoginResult } from '@/services/authService';
import type { UserProfile } from '@/types';

export type AuthModalView = 'login' | 'register' | null;

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  /** True until the first `onAuthStateChanged` callback has resolved. */
  initialising: boolean;
  signIn: (identifier: string, password: string, rememberMe: boolean) => Promise<LoginResult>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  authModal: AuthModalView;
  openAuthModal: (view: Exclude<AuthModalView, null>) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialising, setInitialising] = useState(true);
  const [authModal, setAuthModal] = useState<AuthModalView>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (nextUser) => {
        setUser(nextUser);

        if (nextUser) {
          const [nextProfile, admin] = await Promise.all([
            getUserProfile(nextUser.uid).catch(() => null),
            isAdminUid(nextUser.uid),
          ]);

          setProfile(nextProfile);
          setIsAdmin(admin);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }

        setInitialising(false);
      }),
    [],
  );

  /**
   * `signInWithEmailAndPassword` resolves before `onAuthStateChanged` fires, so
   * a component that navigates straight after signing in would hit a route
   * guard that still believes nobody is signed in. Applying the credential
   * eagerly closes that gap; the listener later confirms the same state.
   */
  const signIn = useCallback(
    async (identifier: string, password: string, rememberMe: boolean) => {
      const result = await loginService(identifier, password, rememberMe);

      setUser(result.user);
      setIsAdmin(result.isAdmin);
      setProfile(await getUserProfile(result.user.uid).catch(() => null));

      return result;
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      return;
    }

    setProfile(await getUserProfile(auth.currentUser.uid).catch(() => null));
  }, []);

  const logout = useCallback(async () => {
    await signOutUser();
    setProfile(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isAdmin,
      initialising,
      signIn,
      refreshProfile,
      logout,
      authModal,
      openAuthModal: (view) => setAuthModal(view),
      closeAuthModal: () => setAuthModal(null),
    }),
    [user, profile, isAdmin, initialising, signIn, refreshProfile, logout, authModal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }

  return context;
}
