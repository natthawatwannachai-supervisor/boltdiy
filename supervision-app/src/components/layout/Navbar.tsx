import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '@/components/illustrations/Logo';
import { NeuButton } from '@/components/ui/NeuButton';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { APP_NAME_SHORT, ORGANISATION_SHORT } from '@/config/constants';
import { cn } from '@/utils/cn';

interface NavItem {
  to: string;
  label: string;
}

const GUEST_LINKS: NavItem[] = [
  { to: '/', label: 'หน้าแรก' },
  { to: '/how-to-use', label: 'วิธีใช้งาน' },
];

const USER_LINKS: NavItem[] = [
  { to: '/', label: 'หน้าแรก' },
  { to: '/how-to-use', label: 'วิธีใช้งาน' },
  { to: '/record', label: 'บันทึกการนิเทศ' },
  { to: '/dashboard', label: 'แดชบอร์ด' },
];

export function Navbar() {
  const { user, isAdmin, profile, openAuthModal, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const links = user ? USER_LINKS : GUEST_LINKS;

  const handleLogout = async () => {
    await logout();
    success('ออกจากระบบเรียบร้อยแล้ว');
    navigate('/');
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'bg-neu-200/85 shadow-neu-sm backdrop-blur-lg' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <Logo size={48} />
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate font-display text-sm font-bold text-ink-800">
              {APP_NAME_SHORT}
            </span>
            <span className="truncate text-[11px] text-ink-500">{ORGANISATION_SHORT}</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {({ isActive }) => (
                <span
                  className={cn(
                    'relative rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-brand-700 shadow-neu-inset-sm'
                      : 'text-ink-600 hover:text-brand-600',
                  )}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-gradient"
                    />
                  )}
                </span>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'rounded-2xl px-4 py-2 text-sm font-semibold transition-all',
                  isActive ? 'text-brand-700 shadow-neu-inset-sm' : 'text-ink-600 hover:text-brand-600',
                )
              }
            >
              ผู้ดูแลระบบ
            </NavLink>
          )}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <div className="flex items-center gap-3 rounded-2xl bg-neu-200 px-3 py-2 shadow-neu-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                  {(profile?.fullName ?? user.email ?? '?').trim().charAt(0)}
                </span>
                <span className="max-w-[10rem] truncate text-sm font-medium text-ink-700">
                  {profile?.fullName ?? (isAdmin ? 'ผู้ดูแลระบบ' : user.email)}
                </span>
              </div>
              <NeuButton variant="neu" onClick={handleLogout}>
                ออกจากระบบ
              </NeuButton>
            </>
          ) : (
            <>
              <NeuButton variant="neu" onClick={() => openAuthModal('login')}>
                เข้าสู่ระบบ
              </NeuButton>
              <NeuButton onClick={() => openAuthModal('register')}>ลงทะเบียน</NeuButton>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="เปิดเมนู"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neu-200 text-ink-600 shadow-neu active:shadow-neu-inset lg:hidden"
        >
          <span className="relative block h-4 w-5">
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              className="absolute inset-x-0 top-0 h-0.5 rounded bg-current"
            />
            <motion.span
              animate={{ opacity: menuOpen ? 0 : 1 }}
              className="absolute inset-x-0 top-1.5 h-0.5 rounded bg-current"
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              className="absolute inset-x-0 top-3.5 h-0.5 rounded bg-current"
            />
          </span>
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden lg:hidden"
          >
            <div className="mx-4 mb-4 space-y-2 rounded-neu bg-neu-200 p-4 shadow-neu">
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-2xl px-4 py-3 text-sm font-medium transition-all',
                      isActive ? 'text-brand-700 shadow-neu-inset-sm' : 'text-ink-600',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {isAdmin && (
                <NavLink
                  to="/admin"
                  className="block rounded-2xl px-4 py-3 text-sm font-semibold text-ink-600"
                >
                  ผู้ดูแลระบบ
                </NavLink>
              )}

              <div className="flex gap-2 pt-2">
                {user ? (
                  <NeuButton variant="neu" fullWidth onClick={handleLogout}>
                    ออกจากระบบ
                  </NeuButton>
                ) : (
                  <>
                    <NeuButton variant="neu" fullWidth onClick={() => openAuthModal('login')}>
                      เข้าสู่ระบบ
                    </NeuButton>
                    <NeuButton fullWidth onClick={() => openAuthModal('register')}>
                      ลงทะเบียน
                    </NeuButton>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
