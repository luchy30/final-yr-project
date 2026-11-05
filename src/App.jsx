import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  Rocket01Icon,
  SparklesIcon,
  CheckmarkCircle02Icon,
  Folder01Icon,
} from 'hugeicons-react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const gsapBadgeRef = useRef(null)

  useGSAP(() => {
    gsap.to(gsapBadgeRef.current, {
      y: -6,
      repeat: -1,
      yoyo: true,
      duration: 1.5,
      ease: 'power1.inOut',
    })
  }, [])

  const stack = [
    { name: 'React 19', tag: 'UI Library' },
    { name: 'Vite', tag: 'Fast Bundler' },
    { name: 'Hugeicons', tag: 'Icon System' },
    { name: 'Framer Motion', tag: 'Gestures & Motion' },
    { name: 'GSAP', tag: 'Timeline Animations' },
  ]

  return (
    <main className="container">
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="logos">
          <a href="https://vite.dev" target="_blank" rel="noreferrer">
            <img src={viteLogo} className="logo vite" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>

        <div className="badge-row">
          <span ref={gsapBadgeRef} className="badge gsap-badge">
            <SparklesIcon size={16} /> GSAP Animated
          </span>
          <span className="badge">
            <Folder01Icon size={16} /> final-yr-project
          </span>
        </div>

        <h1>final-yr-project</h1>
        <p className="subtitle">
          React + Vite environment loaded with Hugeicons, Framer Motion, and GSAP.
        </p>

        <div className="stack-grid">
          {stack.map((item) => (
            <div key={item.name} className="stack-item">
              <CheckmarkCircle02Icon size={18} className="check-icon" />
              <div>
                <strong>{item.name}</strong>
                <span>{item.tag}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="actions">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCount((c) => c + 1)}
            className="primary-btn"
          >
            <Rocket01Icon size={18} />
            <span>Interactive Counter: {count}</span>
          </motion.button>
        </div>
      </motion.div>
    </main>
  )
}

export default App
