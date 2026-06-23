import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Inbox, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { subjectApi } from "@/services/api"
import type { Subject } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_authenticated/subjects")({
  component: SubjectsPage,
})

function SubjectsPage() {
  const { isAdmin, isOrganizer } = useAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/subjects"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectApi.list,
  })

  const subjectsList = subjects ?? []
  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return subjectsList
    return subjectsList.filter((s: Subject) =>
      (s.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [subjectsList, search])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => subjectApi.delete(id),
    onSuccess: () => {
      toast.success("Subject deleted")
      queryClient.invalidateQueries({ queryKey: ["subjects"] })
    },
    onError: () => toast.error("Failed to delete subject"),
  })

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="Subjects" description="Manage subjects.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        {(isAdmin || isOrganizer) && (
          <a href="/subjects/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Subject
            </Button>
          </a>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredSubjects.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "No subjects match your search." : "No subjects found."}</p>
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
                  <TableHead>Status</TableHead>
                  {(isAdmin || isOrganizer) && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((s: Subject) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.description ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? "default" : "secondary"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {(isAdmin || isOrganizer) && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <a href={`/subjects/${s.id}/edit`}>
                            <Button variant="outline" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={deleteMutation.isPending && deleteMutation.variables === s.id}
                            onClick={() => {
                              if (confirm("Are you sure?")) deleteMutation.mutate(s.id)
                            }}
                          >
                            {deleteMutation.isPending && deleteMutation.variables === s.id ? (
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
