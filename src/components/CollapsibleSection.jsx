import { motion, AnimatePresence } from 'framer-motion'

export function CollapsibleSection({ index, title, isOpen, onToggle, delay = 0, children }) {
  return (
    <motion.section
      className="collapsible-block"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <button
        type="button"
        onClick={() => onToggle(index)}
        className="collapsible-trigger"
        aria-expanded={isOpen}
      >
        <span className="collapsible-title">{title}</span>
        <span className="collapsible-action">{isOpen ? 'Hide' : 'Show'}</span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="collapsible-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

