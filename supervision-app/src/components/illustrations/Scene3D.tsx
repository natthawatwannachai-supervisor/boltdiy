import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

/**
 * Hand-built "3D render" illustrations: layered gradients, a warm rim light and
 * a contact shadow give the soft, rounded Pixar look without shipping heavy
 * bitmap assets. Everything is inline SVG, so it stays crisp at any size and
 * recolours with the brand palette.
 */

const SharedDefs = ({ id }: { id: string }) => (
  <defs>
    <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FFE0C2" />
      <stop offset="100%" stopColor="#F1BE95" />
    </linearGradient>
    <linearGradient id={`${id}-shirt`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#34D399" />
      <stop offset="100%" stopColor="#0D9488" />
    </linearGradient>
    <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="100%" stopColor="#DCE4EE" />
    </linearGradient>
    <linearGradient id={`${id}-board`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#F8FAFC" />
      <stop offset="100%" stopColor="#CBD5E1" />
    </linearGradient>
    <linearGradient id={`${id}-accent`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#10B981" />
      <stop offset="100%" stopColor="#14B8A6" />
    </linearGradient>
    <radialGradient id={`${id}-glow`} cx="50%" cy="45%" r="55%">
      <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.55" />
      <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0" />
    </radialGradient>
    <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0F766E" floodOpacity="0.22" />
    </filter>
    <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
  </defs>
);

const Ground = ({ id }: { id: string }) => (
  <ellipse cx="200" cy="352" rx="120" ry="18" fill={`url(#${id}-glow)`} filter={`url(#${id}-soft)`} />
);

interface SceneProps {
  className?: string;
  /** Disables the idle float for use inside dense layouts. */
  still?: boolean;
}

const floatProps = (still?: boolean, distance = 12, duration = 6) =>
  still
    ? {}
    : {
        animate: { y: [0, -distance, 0] },
        transition: { duration, repeat: Infinity, ease: 'easeInOut' as const },
      };

/** Supervisor with a clipboard — the hero character. */
export function SupervisorScene({ className, still }: SceneProps) {
  return (
    <motion.svg viewBox="0 0 400 380" className={cn('h-auto w-full', className)} {...floatProps(still)}>
      <SharedDefs id="sup" />
      <Ground id="sup" />

      {/* floating documents behind the character */}
      <motion.g
        animate={still ? undefined : { y: [0, -14, 0], rotate: [-4, 2, -4] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="60" y="70" width="80" height="104" rx="12" fill="url(#sup-paper)" filter="url(#sup-shadow)" />
        <rect x="74" y="92" width="52" height="7" rx="3.5" fill="#B6C3D2" />
        <rect x="74" y="108" width="40" height="7" rx="3.5" fill="#C7D2DF" />
        <rect x="74" y="124" width="48" height="7" rx="3.5" fill="#C7D2DF" />
      </motion.g>

      <motion.g
        animate={still ? undefined : { y: [0, 12, 0], rotate: [5, -2, 5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="268" y="96" width="76" height="98" rx="12" fill="url(#sup-paper)" filter="url(#sup-shadow)" />
        <circle cx="306" cy="132" r="18" fill="url(#sup-accent)" opacity="0.9" />
        <path d="M298 132l6 7 12-14" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="282" y="162" width="48" height="7" rx="3.5" fill="#C7D2DF" />
      </motion.g>

      {/* body */}
      <g filter="url(#sup-shadow)">
        <path d="M138 340v-84a62 62 0 0 1 124 0v84Z" fill="url(#sup-shirt)" />
        <path d="M170 196c12 18 48 18 60 0l14 8-20 34-48 2-20-36Z" fill="#ffffff" opacity="0.35" />
        {/* arms */}
        <rect x="118" y="230" width="34" height="86" rx="17" fill="url(#sup-shirt)" />
        <rect x="248" y="230" width="34" height="86" rx="17" fill="url(#sup-shirt)" />
        <circle cx="135" cy="316" r="18" fill="url(#sup-skin)" />
        <circle cx="265" cy="312" r="18" fill="url(#sup-skin)" />
        {/* head */}
        <circle cx="200" cy="140" r="58" fill="url(#sup-skin)" />
        <path d="M144 132c4-40 30-58 56-58s52 18 56 58c-16-14-34-22-56-22s-40 8-56 22Z" fill="#3F3A56" />
        <circle cx="180" cy="146" r="7" fill="#2B2440" />
        <circle cx="222" cy="146" r="7" fill="#2B2440" />
        <circle cx="182.5" cy="143.5" r="2.5" fill="#fff" />
        <circle cx="224.5" cy="143.5" r="2.5" fill="#fff" />
        <path d="M186 170c9 8 19 8 28 0" stroke="#B5766B" strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="163" cy="162" r="9" fill="#F7A8A0" opacity="0.55" />
        <circle cx="239" cy="162" r="9" fill="#F7A8A0" opacity="0.55" />
      </g>

      {/* clipboard */}
      <motion.g
        filter="url(#sup-shadow)"
        animate={still ? undefined : { rotate: [-2, 2, -2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '200px 300px' }}
      >
        <rect x="146" y="248" width="108" height="120" rx="14" fill="url(#sup-board)" />
        <rect x="182" y="240" width="36" height="18" rx="9" fill="url(#sup-accent)" />
        <rect x="164" y="282" width="72" height="8" rx="4" fill="#AFBCCB" />
        <rect x="164" y="302" width="56" height="8" rx="4" fill="#C2CDD9" />
        <rect x="164" y="322" width="64" height="8" rx="4" fill="#C2CDD9" />
        <circle cx="228" cy="344" r="14" fill="url(#sup-accent)" />
        <path d="M221 344l5 6 10-12" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </motion.g>
    </motion.svg>
  );
}

/** Phone + cloud: the paperless promise. */
export function PaperlessScene({ className, still }: SceneProps) {
  return (
    <motion.svg viewBox="0 0 400 380" className={cn('h-auto w-full', className)} {...floatProps(still, 10, 7)}>
      <SharedDefs id="pl" />
      <Ground id="pl" />

      <g filter="url(#pl-shadow)">
        <rect x="140" y="96" width="120" height="212" rx="26" fill="url(#pl-board)" />
        <rect x="152" y="118" width="96" height="168" rx="14" fill="url(#pl-paper)" />
        <rect x="182" y="104" width="36" height="7" rx="3.5" fill="#B6C3D2" />
        <rect x="164" y="140" width="72" height="10" rx="5" fill="url(#pl-accent)" />
        <rect x="164" y="162" width="56" height="8" rx="4" fill="#C7D2DF" />
        <rect x="164" y="180" width="64" height="8" rx="4" fill="#C7D2DF" />
        <rect x="164" y="198" width="44" height="8" rx="4" fill="#C7D2DF" />
        <circle cx="200" cy="250" r="24" fill="url(#pl-accent)" />
        <path d="M189 250l8 9 15-18" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      <motion.g
        filter="url(#pl-shadow)"
        animate={still ? undefined : { y: [0, -16, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path
          d="M96 92a34 34 0 0 1 66-12 28 28 0 0 1 40 22 26 26 0 0 1-6 51H108a30 30 0 0 1-12-61Z"
          fill="url(#pl-paper)"
        />
        <path d="M150 108v40m0 0l-14-14m14 14l14-14" stroke="url(#pl-accent)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </motion.g>

      <motion.g
        animate={still ? undefined : { y: [0, 14, 0], opacity: [0.9, 0.6, 0.9] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="286" y="176" width="70" height="90" rx="12" fill="url(#pl-paper)" filter="url(#pl-shadow)" />
        <rect x="300" y="198" width="42" height="7" rx="3.5" fill="#C7D2DF" />
        <rect x="300" y="214" width="30" height="7" rx="3.5" fill="#C7D2DF" />
        <rect x="300" y="230" width="38" height="7" rx="3.5" fill="#C7D2DF" />
      </motion.g>
    </motion.svg>
  );
}

/** Bar chart + magnifier: the dashboard promise. */
export function AnalyticsScene({ className, still }: SceneProps) {
  const bars = [
    { x: 128, h: 70, delay: 0 },
    { x: 176, h: 116, delay: 0.15 },
    { x: 224, h: 92, delay: 0.3 },
    { x: 272, h: 142, delay: 0.45 },
  ];

  return (
    <motion.svg viewBox="0 0 400 380" className={cn('h-auto w-full', className)} {...floatProps(still, 9, 8)}>
      <SharedDefs id="an" />
      <Ground id="an" />

      <g filter="url(#an-shadow)">
        <rect x="90" y="80" width="230" height="212" rx="24" fill="url(#an-board)" />
        <rect x="106" y="100" width="198" height="172" rx="16" fill="url(#an-paper)" />

        {bars.map((bar) => (
          <motion.rect
            key={bar.x}
            x={bar.x}
            width="30"
            rx="10"
            fill="url(#an-accent)"
            initial={{ height: 0, y: 250 }}
            whileInView={{ height: bar.h, y: 250 - bar.h }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: bar.delay, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}

        <path d="M118 250h180" stroke="#B6C3D2" strokeWidth="5" strokeLinecap="round" />
        <motion.path
          d="M128 168l48-30 48 16 48-42"
          fill="none"
          stroke="#0F766E"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 1"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.5 }}
        />
      </g>

      <motion.g
        filter="url(#an-shadow)"
        animate={still ? undefined : { x: [0, 14, 0], y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="292" cy="266" r="40" fill="#E0E5EC" fillOpacity="0.9" stroke="url(#an-accent)" strokeWidth="11" />
        <path d="M320 296l30 30" stroke="url(#an-accent)" strokeWidth="18" strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  );
}

/** PDF sheet flying out of a printer-like tray: the export promise. */
export function PdfScene({ className, still }: SceneProps) {
  return (
    <motion.svg viewBox="0 0 400 380" className={cn('h-auto w-full', className)} {...floatProps(still, 11, 6.5)}>
      <SharedDefs id="pdf" />
      <Ground id="pdf" />

      <motion.g
        filter="url(#pdf-shadow)"
        animate={still ? undefined : { y: [0, -18, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="128" y="52" width="150" height="196" rx="18" fill="url(#pdf-paper)" />
        <path d="M244 52l34 34h-34Z" fill="#C4D0DD" />
        <rect x="150" y="96" width="86" height="9" rx="4.5" fill="#B6C3D2" />
        <rect x="150" y="118" width="104" height="9" rx="4.5" fill="#C7D2DF" />
        <rect x="150" y="140" width="70" height="9" rx="4.5" fill="#C7D2DF" />
        <rect x="150" y="168" width="104" height="52" rx="10" fill="url(#pdf-accent)" opacity="0.18" />
        <rect x="150" y="182" width="104" height="6" rx="3" fill="url(#pdf-accent)" opacity="0.5" />
        <rect x="150" y="196" width="76" height="6" rx="3" fill="url(#pdf-accent)" opacity="0.4" />
        <rect x="186" y="222" width="92" height="30" rx="10" fill="#DC2626" />
        <text x="232" y="243" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff" fontFamily="Kanit, sans-serif">
          PDF
        </text>
      </motion.g>

      <g filter="url(#pdf-shadow)">
        <rect x="96" y="256" width="208" height="72" rx="22" fill="url(#pdf-board)" />
        <rect x="120" y="278" width="160" height="14" rx="7" fill="#E0E5EC" />
        <circle cx="272" cy="308" r="9" fill="url(#pdf-accent)" />
      </g>

      <motion.path
        d="M200 336v26m0 0l-14-14m14 14l14-14"
        stroke="url(#pdf-accent)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={still ? undefined : { opacity: [0.3, 1, 0.3], y: [0, 6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

/** Compact circular badge used for the numbered "how it works" steps. */
export function StepBadge({ index, icon }: { index: number; icon: string }) {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-400/40" />
      <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-neu-200 text-3xl shadow-neu">
        {icon}
      </span>
      <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white shadow-brand-glow">
        {index}
      </span>
    </div>
  );
}
