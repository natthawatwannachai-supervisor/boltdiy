import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { NeuCard } from '@/components/ui/NeuCard';
import type { CategoryStat, MonthlyStat } from '@/types';

const PALETTE = ['#10B981', '#14B8A6', '#34D399', '#0D9488', '#6EE7B7', '#047857', '#5EEAD4', '#065F46', '#99F6E4'];

const AXIS_STYLE = { fontSize: 12, fill: '#6B7A90', fontFamily: 'Kanit, sans-serif' } as const;

const TOOLTIP_STYLE = {
  borderRadius: 16,
  border: 'none',
  background: '#E0E5EC',
  boxShadow: '8px 8px 16px #c8c8c8, -8px -8px 16px #ffffff',
  fontFamily: 'Kanit, sans-serif',
  fontSize: 13,
  color: '#1F2937',
} as const;

function ChartShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <NeuCard className="p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold text-ink-800">{title}</h3>
        {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
      </div>
      <div className="h-72 w-full">{children}</div>
    </NeuCard>
  );
}

/** Bar chart: number of supervisions per month. */
export function MonthlyBarChart({ data }: { data: MonthlyStat[] }) {
  return (
    <ChartShell title="จำนวนครั้งการนิเทศรายเดือน" subtitle="เปรียบเทียบปริมาณงานในแต่ละเดือน">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -18 }}>
          <defs>
            <linearGradient id="barBrand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 6" stroke="#CBD5E1" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} interval={0} angle={-12} textAnchor="end" height={56} />
          <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(16,185,129,0.08)' }} formatter={(value: number) => [`${value} ครั้ง`, 'จำนวน']} />
          <Bar dataKey="total" name="จำนวนครั้ง" fill="url(#barBrand)" radius={[10, 10, 4, 4]} maxBarSize={54} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

/** Area/line chart: supervision days and photos over time. */
export function MonthlyTrendChart({ data }: { data: MonthlyStat[] }) {
  return (
    <ChartShell title="แนวโน้มวันปฏิบัติงานนิเทศ" subtitle="จำนวนวันนิเทศและภาพประกอบสะสมในแต่ละเดือน">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -18 }}>
          <defs>
            <linearGradient id="areaDays" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="areaImages" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 6" stroke="#CBD5E1" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} interval={0} angle={-12} textAnchor="end" height={56} />
          <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontFamily: 'Kanit, sans-serif', fontSize: 12 }} />
          <Area type="monotone" dataKey="days" name="วันนิเทศ" stroke="#059669" strokeWidth={3} fill="url(#areaDays)" animationDuration={900} />
          <Area type="monotone" dataKey="images" name="ภาพประกอบ" stroke="#0D9488" strokeWidth={2} fill="url(#areaImages)" animationDuration={1100} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

/** Donut chart: distribution across supervision tasks. */
export function CategoryPieChart({ data }: { data: CategoryStat[] }) {
  return (
    <ChartShell title="สัดส่วนงานนิเทศ" subtitle="จำแนกตามประเภทงานนิเทศที่บันทึกไว้">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="52%"
            outerRadius="80%"
            paddingAngle={3}
            animationDuration={900}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} stroke="#E0E5EC" strokeWidth={3} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [`${value} ครั้ง`, 'จำนวน']} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontFamily: 'Kanit, sans-serif', fontSize: 11, maxWidth: 170 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
