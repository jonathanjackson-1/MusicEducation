import * as React from 'react';

import { cn } from '../lib';

export interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Caption text displayed below the table. */
  caption?: React.ReactNode;
}

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ className, caption, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'w-full overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    >
      <div className="relative w-full overflow-x-auto">
        <table className="w-full caption-bottom text-sm">{children}</table>
      </div>
      {caption ? <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">{caption}</div> : null}
    </div>
  )
);
DataTable.displayName = 'DataTable';

export interface DataTableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const DataTableHeader = React.forwardRef<HTMLTableSectionElement, DataTableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground', className)} {...props} />
  )
);
DataTableHeader.displayName = 'DataTableHeader';

export interface DataTableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const DataTableBody = React.forwardRef<HTMLTableSectionElement, DataTableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
);
DataTableBody.displayName = 'DataTableBody';

export interface DataTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
}

export const DataTableRow = React.forwardRef<HTMLTableRowElement, DataTableRowProps>(
  ({ className, hoverable = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-colors',
        hoverable && 'hover:bg-muted/60',
        className
      )}
      {...props}
    />
  )
);
DataTableRow.displayName = 'DataTableRow';

export interface DataTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const DataTableHead = React.forwardRef<HTMLTableCellElement, DataTableHeadProps>(
  ({ className, ...props }, ref) => (
    <th ref={ref} className={cn('px-4 py-3 text-left font-medium text-muted-foreground', className)} {...props} />
  )
);
DataTableHead.displayName = 'DataTableHead';

export interface DataTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const DataTableCell = React.forwardRef<HTMLTableCellElement, DataTableCellProps>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('px-4 py-3 align-middle text-sm', className)} {...props} />
  )
);
DataTableCell.displayName = 'DataTableCell';

export interface DataTableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

export const DataTableCaption = React.forwardRef<HTMLTableCaptionElement, DataTableCaptionProps>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-left text-xs text-muted-foreground', className)} {...props} />
  )
);
DataTableCaption.displayName = 'DataTableCaption';

export interface DataTableEmptyStateProps extends React.HTMLAttributes<HTMLTableRowElement> {
  colSpan?: number;
  message?: React.ReactNode;
}

export const DataTableEmptyState = React.forwardRef<HTMLTableRowElement, DataTableEmptyStateProps>(
  ({ className, colSpan = 1, message = 'No data available.', ...props }, ref) => (
    <DataTableRow ref={ref} className={cn('hover:bg-transparent', className)} {...props}>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </DataTableRow>
  )
);
DataTableEmptyState.displayName = 'DataTableEmptyState';
