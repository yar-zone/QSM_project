import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { z } from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { studentApi, classApi } from "@/services/api"
import type { Classe } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export const Route = createFileRoute("/_authenticated/students/$id/edit")({
  component: EditStudentPage,
})

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  date_of_birth: z.string().trim().optional().or(z.literal("")),
  gender: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  emergency_contact: z.string().trim().optional().or(z.literal("")),
  enrollment_date: z.string().trim().optional().or(z.literal("")),
  is_active: z.boolean().optional(),
  class_ids: z.array(z.number()).optional(),
})

type Values = z.infer<typeof schema>

function EditStudentPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ["student", id],
    queryFn: () => studentApi.get(Number(id)),
  })

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classApi.list(),
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Values>({
    resolver: zodResolver(schema),
    values: student ? {
      name: student.user?.name ?? "",
      email: student.user?.email ?? "",
      phone: student.phone ?? "",
      date_of_birth: student.date_of_birth ?? "",
      gender: student.gender ?? "",
      address: student.address ?? "",
      emergency_contact: student.emergency_contact ?? "",
      enrollment_date: student.enrollment_date ?? "",
      is_active: student.is_active,
      class_ids: (student as any).enrollments?.map((e: any) => e.class_id) ?? [],
    } : undefined,
  })

  const selectedClasses = watch("class_ids") || []
  const isActive = watch("is_active")

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await studentApi.update(Number(id), {
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        date_of_birth: values.date_of_birth || undefined,
        gender: values.gender || undefined,
        address: values.address || undefined,
        emergency_contact: values.emergency_contact || undefined,
        enrollment_date: values.enrollment_date || undefined,
        is_active: values.is_active,
        class_ids: values.class_ids || undefined,
      })
      toast.success("Student updated")
      navigate({ to: "/students" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update student")
    } finally {
      setSaving(false)
    }
  }

  if (loadingStudent) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Edit Student" description={`Editing ${student?.user?.name ?? "student"}.`}>
        <Button variant="outline" asChild>
          <a href="/students">
            <ArrowLeft className="h-4 w-4" />
            Back
          </a>
        </Button>
      </PageHeader>
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
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
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label>Classes</Label>
              <p className="text-xs text-muted-foreground">Select classes this student is enrolled in.</p>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {(classes ?? []).map((c: Classe) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`class-${c.id}`}
                      checked={selectedClasses.includes(c.id)}
                      onCheckedChange={(checked) => {
                        const newVals = checked
                          ? [...selectedClasses, c.id]
                          : selectedClasses.filter((id: number) => id !== c.id)
                        setValue("class_ids", newVals)
                      }}
                    />
                    <Label htmlFor={`class-${c.id}`} className="text-sm font-normal">{c.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Input id="gender" {...register("gender")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emergency_contact">Emergency Contact</Label>
              <Input id="emergency_contact" {...register("emergency_contact")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enrollment_date">Enrollment Date</Label>
              <Input id="enrollment_date" type="date" {...register("enrollment_date")} />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setValue("is_active", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
