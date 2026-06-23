import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Check, X, Loader2, Inbox } from "lucide-react"
import { toast } from "sonner"

import { userApi } from "@/services/api"
import type { User } from "@/types"
import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ROLE_LABELS } from "@/lib/roles"

export const Route = createFileRoute("/_authenticated/approvals")({
  component: ApprovalsPage,
})

function ApprovalsPage() {
  const { isAdmin, isOrganizer } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!isAdmin && !isOrganizer) navigate({ to: "/dashboard" })
  }, [isAdmin, isOrganizer, navigate])
  const [filter, setFilter] = useState<"pending" | "all">("pending")
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ["users-pending", filter],
    queryFn: filter === "pending" ? userApi.pending : userApi.list,
  })

  const approveMutation = useMutation({
    mutationFn: async (id: number) => { await userApi.approve(id); return id },
    onSuccess: () => { toast.success("User approved"); queryClient.invalidateQueries({ queryKey: ["users-pending"] }) },
    onError: () => toast.error("Failed to approve user"),
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => { await userApi.reject(id); return id },
    onSuccess: (id) => { toast.success("User rejected"); queryClient.invalidateQueries({ queryKey: ["users-pending"] }) },
    onError: () => toast.error("Failed to reject user"),
  })

  return (
    <div>
      <PageHeader title="User Approvals" description="Review and approve new accounts before they gain access." />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as "pending" | "all")}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !users || users.length === 0 ? (
          <Card>
            <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
              <Inbox className="h-8 w-8" />
              <p>No users in this list.</p>
            </CardContent>
          </Card>
        ) : (
          users.map((user: User) => (
            <UserRow
              key={user.id}
              user={user}
              approving={approveMutation.isPending && approveMutation.variables === user.id}
              rejecting={rejectMutation.isPending && rejectMutation.variables === user.id}
              onApprove={() => approveMutation.mutate(user.id)}
              onReject={() => rejectMutation.mutate(user.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "active") return "default"
  if (status === "inactive") return "destructive"
  return "secondary"
}

function UserRow({ user, approving, rejecting, onApprove, onReject }: {
  user: User; approving: boolean; rejecting: boolean
  onApprove: () => void; onReject: () => void
}) {
  const initials = (user.name || user.email).slice(0, 2).toUpperCase()
  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardContent className="flex flex-wrap items-center gap-4 p-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{user.name || "—"}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
          <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={rejecting || user.status !== "pending"} onClick={onReject}>
            {rejecting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4" />}
            Reject
          </Button>
          <Button size="sm" disabled={approving || user.status !== "pending"} onClick={onApprove}>
            {approving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
            Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
