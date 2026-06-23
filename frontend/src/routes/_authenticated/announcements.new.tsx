import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { announcementApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(255),
  content: z.string().trim().min(10, "Content must be at least 10 characters"),
  category: z.string({ required_error: "Select a category" }),
  target_audience: z.string().optional().or(z.literal("")),
  is_pinned: z.boolean().default(false),
  published_at: z.string().min(1, "Date is required"),
})
type Values = z.infer<typeof schema>

export const Route = createFileRoute("/_authenticated/announcements/new")({
  component: NewAnnouncementPage,
})

function NewAnnouncementPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { category: "general", is_pinned: false, published_at: new Date().toISOString().slice(0, 10) },
  })

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await announcementApi.create(values)
      toast.success("Announcement created")
      navigate({ to: "/announcements" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create announcement")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="New Announcement" description="Create a new announcement." />
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader><CardTitle>Announcement Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" rows={5} {...register("content")} />
              {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(v) => setValue("category", v)} defaultValue="general">
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="exams">Exams</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="meetings">Meetings</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Input id="target_audience" {...register("target_audience")} placeholder="e.g. all, teachers, students" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="is_pinned" checked={watch("is_pinned")} onCheckedChange={(v) => setValue("is_pinned", v === true)} />
              <Label htmlFor="is_pinned">Pin this announcement</Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="published_at">Publish Date</Label>
              <Input id="published_at" type="date" {...register("published_at")} />
              {errors.published_at && <p className="text-xs text-destructive">{errors.published_at.message}</p>}
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Announcement
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
