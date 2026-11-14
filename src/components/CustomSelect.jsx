import { useState, useRef, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown01Icon, Tick02Icon } from 'hugeicons-react'

export function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  variant = 'default',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const generatedId = useId()
  const listboxId = `${id || generatedId}-listbox`

  const selectedIndex = options.findIndex((opt) => opt.value === value)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null

  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  const openMenu = () => {
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setIsOpen(true)
  }

  const selectOption = (optValue) => {
    onChange(optValue)
    setIsOpen(false)
  }

  const handleKeyDown = (event) => {
    if (!isOpen) {
      if (
        event.key === 'Enter' ||
        event.key === ' ' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp'
      ) {
        event.preventDefault()
        openMenu()
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setIsOpen(false)
      return
    }

    if (event.key === 'Tab') {
      setIsOpen(false)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((prev) =>
        options.length === 0 ? -1 : (prev + 1) % options.length
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((prev) =>
        options.length === 0 ? -1 : (prev - 1 + options.length) % options.length
      )
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      if (options.length > 0) setHighlightedIndex(0)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      if (options.length > 0) setHighlightedIndex(options.length - 1)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (highlightedIndex >= 0 && options[highlightedIndex]) {
        selectOption(options[highlightedIndex].value)
      }
    }
  }

  const isSidebar = variant === 'sidebar'

  return (
    <div
      ref={containerRef}
      className={`custom-select-wrapper ${isSidebar ? 'sidebar-variant' : ''}`}
    >
      <button
        id={id}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${isSidebar ? 'sidebar-variant' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
      >
        <span className="custom-select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`custom-select-chevron ${isOpen ? 'open' : ''}`}>
          <ArrowDown01Icon size={16} />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            id={listboxId}
            role="listbox"
            className={`custom-select-menu ${isSidebar ? 'sidebar-variant' : ''}`}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value
              const isHighlighted = idx === highlightedIndex
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectOption(opt.value)
                  }}
                  className={`custom-select-option ${isSelected ? 'selected' : ''} ${
                    isHighlighted ? 'highlighted' : ''
                  } ${isSidebar ? 'sidebar-variant' : ''}`}
                >
                  <span className="custom-select-option-label">{opt.label}</span>
                  {isSelected && (
                    <span className="custom-select-check">
                      <Tick02Icon size={15} />
                    </span>
                  )}
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomSelect
