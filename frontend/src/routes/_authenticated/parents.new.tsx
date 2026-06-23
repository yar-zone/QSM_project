import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { z } from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"

import { parentApi, studentApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_authenticated/parents/new")({
  component: NewParentPage,
})

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password_confirmation: z.string().min(1, "Confirm your password"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  student_ids: z.array(z.number()).optional(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
})

type Values = z.infer<typeof schema>

function NewParentPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentApi.list(),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", email: "", password: "", password_confirmation: "",
      phone: "", student_ids: [],
    },
  })

  const toggleStudent = (id: number) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await parentApi.create({
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
        role: "parent",
        phone: values.phone || undefined,
        student_ids: selectedStudents,
      })
      toast.success("Parent created")
      navigate({ to: "/parents" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create parent")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="New Parent" description="Create a new parent account.">
        <a href="/parents">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </a>
      </PageHeader>
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Parent Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password_confirmation">Confirm Password</Label>
              <Input id="password_confirmation" type="password" {...register("password_confirmation")} />
              {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Linked Students</Label>
              {students && students.length > 0 ? (
                <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted rounded px-1 py-0.5">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      {s.user?.name ?? `Student #${s.id}`}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No students available.</p>
              )}
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Parent
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
