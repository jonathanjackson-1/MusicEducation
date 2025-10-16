import * as React from 'react';
import type { TooltipProps } from 'recharts';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { cn } from '../lib';

const isBrowser = typeof window !== 'undefined';

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Height of the chart container in pixels. */
  height?: number;
  /** Width passed down to the responsive container. */
  width?: number | string;
  /**
   * When true, a minimal placeholder will be rendered when charts are used in
   * non-browser environments (SSR) instead of returning null.
   */
  renderPlaceholder?: boolean;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  className,
  children,
  height = 240,
  width = '100%',
  renderPlaceholder = true,
  ...props
}) => {
  const containerStyles = React.useMemo<React.CSSProperties>(
    () => ({ height }),
    [height]
  );

  if (!isBrowser) {
    if (!renderPlaceholder) return null;
    return (
      <div
        className={cn('flex w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6', className)}
        style={containerStyles}
        aria-hidden="true"
        {...props}
      >
        <span className="text-xs text-muted-foreground">Chart preview</span>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} style={containerStyles} {...props}>
      <ResponsiveContainer width={width} height="100%">
        {React.isValidElement(children) ? children : null}
      </ResponsiveContainer>
    </div>
  );
};

ChartContainer.displayName = 'ChartContainer';

export interface ChartTooltipContentProps<TValue, TName> extends TooltipProps<TValue, TName> {
  /** Optional class name applied to the tooltip container. */
  className?: string;
  /**
   * Allows custom formatting of the value rendered for each payload entry.
   * Defaults to the value provided by Recharts.
   */
  formatValue?: (value: TValue, name: TName, index: number) => React.ReactNode;
}

export function ChartTooltipContent<TValue, TName extends React.ReactText | undefined = string>(
  props: ChartTooltipContentProps<TValue, TName>
) {
  const { active, payload, label, className, formatValue } = props;

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={cn('min-w-[160px] rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-md', className)}>
      {label !== undefined ? (
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      ) : null}
      <div className="space-y-1">
        {payload.map((item, index) => {
          const key = `${item.dataKey ?? index}`;
          return (
            <div key={key} className="flex items-center justify-between gap-6">
              <span className="text-xs text-muted-foreground">{item.name ?? item.dataKey}</span>
              <span className="text-sm font-semibold text-foreground">
                {formatValue ? formatValue(item.value as TValue, item.name as TName, index) : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type ChartTooltipProps<TValue, TName> = TooltipProps<TValue, TName> & {
  /** Custom tooltip content component. Defaults to {@link ChartTooltipContent}. */
  content?: React.ReactNode;
};

export function ChartTooltip<TValue, TName extends React.ReactText | undefined = string>({ content, ...props }: ChartTooltipProps<TValue, TName>) {
  return <Tooltip {...props} content={content ?? <ChartTooltipContent />} />;
}

ChartTooltip.displayName = 'ChartTooltip';

export interface ChartLegendProps extends React.ComponentProps<typeof Legend> {
  /** Optional custom formatter for legend labels. */
  formatLabel?: (value: string) => React.ReactNode;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ formatLabel, ...props }) => (
  <Legend
    {...props}
    formatter={formatLabel ? (value) => formatLabel(String(value)) : props.formatter}
    wrapperStyle={{
      paddingTop: 8,
      textTransform: 'none'
    }}
  />
);

ChartLegend.displayName = 'ChartLegend';

export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
};
