import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Inbox, Trash2, Pencil, Search } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { parentApi } from "@/services/api"
import type { User } from "@/types"
import { useAuth } from "@/hooks/use-auth"
import { ROLE_LABELS } from "@/lib/roles"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export const Route = createFileRoute("/_authenticated/parents")({
  component: ParentsPage,
})

function ParentsPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/parents"
  const { isAdmin, isOrganizer } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["parents"],
    queryFn: () => parentApi.list(),
  })

  const parentsList = data ?? []
  const filteredParents = useMemo(() => {
    if (!search.trim()) return parentsList
    return parentsList.filter((p: User) =>
      (p.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [parentsList, search])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => parentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] })
      toast.success("Parent deleted")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete parent")
    },
  })

  if (isChildRoute) return <Outlet />

  const canManage = isAdmin || isOrganizer

  return (
    <div>
      <PageHeader title="Parents" description="Manage parent accounts and profiles.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        {canManage && (
          <a href="/parents/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Parent
            </Button>
          </a>
        )}
      </PageHeader>

      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filteredParents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground">
            <Inbox className="h-7 w-7" />
          </span>
          <div>
            <p className="text-base font-medium text-foreground">{search ? "No results" : "No parents found"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{search ? "No parents match your search." : "Create a parent account to get started."}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border shadow-[var(--shadow-card)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Children</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParents.map((parent: User) => {
                const childrenCount = (parent as any).parent_students?.length ?? 0
                const initials = (parent.name || parent.email).slice(0, 2).toUpperCase()
                return (
                  <TableRow key={parent.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{parent.name ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{parent.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{childrenCount}</Badge>
                    </TableCell>
                    <TableCell>{parent.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={parent.is_active ? "default" : "secondary"}>
                        {parent.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canManage && (
                          <a href={`/parents/${parent.id}/edit`}>
                            <Button variant="outline" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        {canManage && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure?")) deleteMutation.mutate(parent.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
