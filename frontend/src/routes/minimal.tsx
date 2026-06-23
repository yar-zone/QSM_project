import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/minimal")({
  component: MinimalPage,
})

function MinimalPage() {
  const [val, setVal] = useState("")
  return (
    <div style={{ padding: 40 }}>
      <h2>اختبار React مصغر</h2>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="حاول الكتابة هنا..."
        dir="rtl"
        style={{ border: "1px solid #ccc", padding: "8px 12px", fontSize: 16, width: 300 }}
      />
      <p>لقد كتبت: {val}</p>
    </div>
  )
}
