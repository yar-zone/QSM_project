import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Inbox, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { classApi } from "@/services/api"
import type { Classe } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_authenticated/classes")({
  component: ClassesPage,
})

function ClassesPage() {
  const { isAdmin, isOrganizer, isTeacher, isStudent, isParent } = useAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/classes"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: classApi.list,
  })

  const classesList = classes ?? []
  const filteredClasses = useMemo(() => {
    if (!search.trim()) return classesList
    return classesList.filter((c: Classe) =>
      (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.level?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.teacher?.user?.name ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [classesList, search])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => classApi.delete(id),
    onSuccess: () => {
      toast.success("Class deleted")
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
    onError: () => toast.error("Failed to delete class"),
  })

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="Classes" description="Manage all classes.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        {(isAdmin || isOrganizer) && (
          <a href="/classes/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Class
            </Button>
          </a>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "No classes match your search." : "No classes found."}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Max Students</TableHead>
                  <TableHead>Status</TableHead>
                  {(isAdmin || isOrganizer) && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((c: Classe) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.level?.name ?? "—"}</TableCell>
                    <TableCell>{c.teacher?.user?.name ?? "—"}</TableCell>
                    <TableCell>{c.academic_year ?? "—"}</TableCell>
                    <TableCell>{c.max_students ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "secondary"}>
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {(isAdmin || isOrganizer) && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <a href={`/classes/${c.id}/edit`}>
                            <Button variant="outline" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={deleteMutation.isPending && deleteMutation.variables === c.id}
                            onClick={() => {
                              if (confirm("Are you sure?")) deleteMutation.mutate(c.id)
                            }}
                          >
                            {deleteMutation.isPending && deleteMutation.variables === c.id ? (
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
