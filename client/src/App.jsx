import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="page">
      <header className="header">
        <h1>final yr project</h1>
        <p>Simple starter with React, Vite, Tailwind CSS, TanStack, Framer Motion, and GSAP.</p>
      </header>

      <section className="content">
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="counter-btn"
        >
          Count is {count}
        </button>
      </section>
    </main>
  )
}

export default App
