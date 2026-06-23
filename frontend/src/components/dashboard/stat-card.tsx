import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  hint?: string
  loading?: boolean
  delay?: string
}

export function StatCard({ label, value, icon: Icon, hint, loading, delay = "" }: StatCardProps) {
  return (
    <Card className={`card-hover shadow-[var(--shadow-card)] fade-in-up ${delay}`}>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          )}
          {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
