import { ResponsiveContainer, Tooltip } from 'recharts';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ChartConfig = Record<string, { label: string; color: string }>;

/**
 * Charts redraw at most this often while their box changes size. Folding the
 * sidebar resizes the page on every frame for 200ms; redrawing every chart
 * each time made it stutter, so they redraw once, as it settles.
 */
export const CHART_RESIZE_THROTTLE = 250;

// shadcn-style composable chart surface: series colors are CSS variables, while
// the actual chart remains regular Recharts for straightforward customization.
export function ChartContainer({ config, children, className, style, ...props }: ComponentProps<'div'> & { config: ChartConfig; children: ComponentProps<typeof ResponsiveContainer>['children'] }) {
    const variables = Object.fromEntries(Object.entries(config).map(([key, value]) => [`--color-${key}`, value.color])) as CSSProperties;
    // A style passed in (such as a minimum width) joins the series colours rather than replacing them.
    return <div data-slot="chart" className={cn('chart-container', className)} style={{ ...variables, ...style }} {...props}><ResponsiveContainer width="100%" height="100%" debounce={CHART_RESIZE_THROTTLE}>{children}</ResponsiveContainer></div>;
}
export const ChartTooltip = Tooltip;

export function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: ReadonlyArray<{ name?: string; value?: number | string; color?: string }>; label?: ReactNode }) {
    if (!active || !payload?.length) return null;
    return <div className="chart-tooltip"><strong>{label}</strong>{payload.map(item => <div key={item.name}><span style={{ background: item.color }} />{item.name}<b>{Number(item.value).toLocaleString('en-PH')}</b></div>)}</div>;
}
