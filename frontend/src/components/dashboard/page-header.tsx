// ─── [FILE PURPOSE] ─────────────────────────────────────────────────
// Reusable page header component used by ALL dashboard views.
// Renders: title + optional description + optional action buttons (children)
// Includes a decorative gradient underline bar.
// ─────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
      <div className="mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-primary to-secondary" />
    </div>
  );
}
