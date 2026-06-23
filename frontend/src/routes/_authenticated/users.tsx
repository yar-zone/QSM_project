import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Inbox, Search } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { userApi } from "@/services/api"
import type { User } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ROLE_LABELS } from "@/lib/roles"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
})

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "active") return "default"
  if (status === "inactive") return "destructive"
  return "secondary"
}

function UsersPage() {
  const { isAdmin, isOrganizer } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => userApi.list(),
  })

  const approveMutation = useMutation({
    mutationFn: async (id: number) => { await userApi.approve(id); return id },
    onSuccess: () => { toast.success("User approved"); queryClient.invalidateQueries({ queryKey: ["users"] }) },
    onError: () => toast.error("Failed to approve user"),
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => { await userApi.reject(id); return id },
    onSuccess: () => { toast.success("User rejected"); queryClient.invalidateQueries({ queryKey: ["users"] }) },
    onError: () => toast.error("Failed to reject user"),
  })

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => { await userApi.deactivate(id); return id },
    onSuccess: () => { toast.success("User deactivated"); queryClient.invalidateQueries({ queryKey: ["users"] }) },
    onError: () => toast.error("Failed to deactivate user"),
  })

  const reactivateMutation = useMutation({
    mutationFn: async (id: number) => { await userApi.reactivate(id); return id },
    onSuccess: () => { toast.success("User reactivated"); queryClient.invalidateQueries({ queryKey: ["users"] }) },
    onError: () => toast.error("Failed to reactivate user"),
  })

  const userList = users ?? []
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return userList
    return userList.filter((u: User) =>
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.role ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [userList, search])

  return (
    <div>
      <PageHeader title="Users" description="Manage all users in the system.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "No users match your search." : "No users found."}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-[var(--shadow-card)] overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: User) => (
                  <TableRow key={user.id} className="transition-colors hover:bg-accent/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {(user.name || user.email).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell><Badge variant="outline">{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}</Badge></TableCell>
                    <TableCell><Badge variant={statusVariant(user.status)}>{user.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {(isAdmin || isOrganizer) && user.status === "pending" && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" disabled={rejectMutation.isPending} onClick={() => rejectMutation.mutate(user.id)}>
                            {rejectMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Reject
                          </Button>
                          <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate(user.id)}>
                            {approveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Approve
                          </Button>
                        </div>
                      )}
                      {(isAdmin || isOrganizer) && user.status === "active" && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" disabled={deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(user.id)}>
                            {deactivateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Deactivate
                          </Button>
                        </div>
                      )}
                      {(isAdmin || isOrganizer) && user.status === "inactive" && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" disabled={reactivateMutation.isPending} onClick={() => reactivateMutation.mutate(user.id)}>
                            {reactivateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Reactivate
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}