import { createRoot } from "react-dom/client"
import { useState } from "react"

function App() {
  const [val, setVal] = useState("")
  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h2>Standalone React (No Router)</h2>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="Type here..."
        style={{ border: "1px solid #ccc", padding: "8px 12px", fontSize: 16, width: 300 }}
      />
      <p>You typed: {val}</p>
    </div>
  )
}

createRoot(document.getElementById("root")!).render(<App />)
