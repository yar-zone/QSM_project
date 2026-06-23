import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { z } from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { levelApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export const Route = createFileRoute("/_authenticated/levels/$id/edit")({
  component: EditLevelPage,
})

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0, "Order must be 0 or greater"),
  is_active: z.boolean(),
})

type Values = z.infer<typeof schema>

function EditLevelPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const { data: level, isLoading: loadingLevel } = useQuery({
    queryKey: ["level", id],
    queryFn: () => levelApi.get(Number(id)),
  })

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: level ? {
      name: level.name,
      description: level.description ?? "",
      order: level.order,
      is_active: level.is_active,
    } : undefined,
  })

  const isActive = watch("is_active")

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await levelApi.update(Number(id), {
        name: values.name,
        description: values.description || undefined,
        order: values.order,
        is_active: values.is_active,
      })
      toast.success("Level updated")
      navigate({ to: "/levels" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update level")
    } finally {
      setSaving(false)
    }
  }

  if (loadingLevel) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Edit Level" description={`Editing ${level?.name ?? "level"}.`}>
        <Button variant="outline" asChild>
          <a href="/levels">
            <ArrowLeft className="h-4 w-4" />
            Back
          </a>
        </Button>
      </PageHeader>
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Level Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order">Order</Label>
              <Input id="order" type="number" {...register("order")} />
              {errors.order && <p className="text-xs text-destructive">{errors.order.message}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={isActive}
                onCheckedChange={(v) => setValue("is_active", v === true)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
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
