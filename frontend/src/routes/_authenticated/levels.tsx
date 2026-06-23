import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Inbox, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { levelApi } from "@/services/api"
import type { Level } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_authenticated/levels")({
  component: LevelsPage,
})

function LevelsPage() {
  const { isAdmin, isOrganizer } = useAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/levels"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")

  const { data: levels, isLoading } = useQuery({
    queryKey: ["levels"],
    queryFn: levelApi.list,
  })

  const levelsList = levels ?? []
  const filteredLevels = useMemo(() => {
    if (!search.trim()) return levelsList
    return levelsList.filter((l: Level) =>
      (l.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.description ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [levelsList, search])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => levelApi.delete(id),
    onSuccess: () => {
      toast.success("Level deleted")
      queryClient.invalidateQueries({ queryKey: ["levels"] })
    },
    onError: () => toast.error("Failed to delete level"),
  })

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="Levels" description="Manage academic levels.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search levels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        {(isAdmin || isOrganizer) && (
          <a href="/levels/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Level
            </Button>
          </a>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredLevels.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "No levels match your search." : "No levels found."}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  {(isAdmin || isOrganizer) && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLevels.map((l: Level) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.description ?? "—"}</TableCell>
                    <TableCell>{l.order}</TableCell>
                    <TableCell>
                      <Badge variant={l.is_active ? "default" : "secondary"}>
                        {l.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {(isAdmin || isOrganizer) && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <a href={`/levels/${l.id}/edit`}>
                            <Button variant="outline" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={deleteMutation.isPending && deleteMutation.variables === l.id}
                            onClick={() => {
                              if (confirm("Are you sure?")) deleteMutation.mutate(l.id)
                            }}
                          >
                            {deleteMutation.isPending && deleteMutation.variables === l.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
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
