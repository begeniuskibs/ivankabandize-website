'use client'

import React, { useRef, useState, useEffect } from 'react'
import { isAllowedCaptionUrl, wrapSelectionAsLink } from './captionLinks'

export interface CaptionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

function LinkIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

export default function CaptionInput({
  value,
  onChange,
  placeholder = 'Add a caption (optional). Link with [text](https://...)',
  className = 'w-full text-center text-xs text-gray-600 mt-2 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none py-1',
}: CaptionInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number; text: string } | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [hintMessage, setHintMessage] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current)
      }
    }
  }, [])

  // Auto-focus URL input when dialog opens
  useEffect(() => {
    if (showUrlModal) {
      const timer = setTimeout(() => {
        urlInputRef.current?.focus()
      }, 30)
      return () => clearTimeout(timer)
    }
  }, [showUrlModal])

  // Close URL modal or hint on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (showUrlModal) {
          setShowUrlModal(false)
          setSelectedRange(null)
          setUrlError(null)
        }
        setHintMessage(null)
      }
    }

    if (showUrlModal || hintMessage) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUrlModal, hintMessage])

  function handleLinkButtonClick() {
    const input = inputRef.current
    if (!input) return

    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0

    if (start !== end && start < end) {
      const currentText = value || ''
      const selected = currentText.slice(start, end)
      if (selected.length > 0) {
        setSelectedRange({ start, end, text: selected })
        setUrlInput('')
        setUrlError(null)
        setHintMessage(null)
        setShowUrlModal(true)
        return
      }
    }

    // Nothing selected
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current)
    }
    setHintMessage('Select some caption text first')
    hintTimeoutRef.current = setTimeout(() => {
      setHintMessage(null)
    }, 2500)
  }

  function handleCancel() {
    setShowUrlModal(false)
    setSelectedRange(null)
    setUrlError(null)
    inputRef.current?.focus()
  }

  function handleApply() {
    if (!selectedRange) return

    const cleanUrl = urlInput.trim()
    if (!isAllowedCaptionUrl(cleanUrl)) {
      setUrlError('Allowed: https://, http://, mailto:, or /path')
      return
    }

    const currentText = value || ''
    const wrapped = wrapSelectionAsLink(currentText, selectedRange.start, selectedRange.end, cleanUrl)
    if (wrapped !== null) {
      onChange(wrapped)
    }

    setShowUrlModal(false)
    setSelectedRange(null)
    setUrlError(null)

    // Return focus to main input
    setTimeout(() => {
      inputRef.current?.focus()
    }, 10)
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full group/caption flex items-center justify-center"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsFocused(false)
          }
        }}
        onKeyDown={(e) => {
          // Stop ProseMirror from swallowing keystrokes
          e.stopPropagation()
        }}
        placeholder={placeholder}
        className={className}
      />

      {/* Link button */}
      <button
        type="button"
        aria-label="Add link"
        onMouseDown={(e) => {
          // Prevent input from losing focus / selection
          e.preventDefault()
          handleLinkButtonClick()
        }}
        className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-200/60 transition cursor-pointer ${
          isFocused || isHovered || showUrlModal || hintMessage
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none group-hover/caption:opacity-100 group-hover/caption:pointer-events-auto'
        }`}
        title="Add link to selected text"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>

      {/* Hint when no text is selected */}
      {hintMessage && (
        <div
          role="status"
          className="absolute bottom-full mb-1 z-30 bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-md pointer-events-none animate-in fade-in"
        >
          {hintMessage}
        </div>
      )}

      {/* Inline URL Popover */}
      {showUrlModal && selectedRange && (
        <div
          role="dialog"
          aria-label="Add link to caption"
          className="absolute bottom-full mb-1 z-30 bg-white border border-gray-200 shadow-xl rounded-xl p-2.5 w-72 max-w-[90vw] flex flex-col gap-2 text-xs text-left animate-in fade-in zoom-in-95"
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Escape') {
              e.preventDefault()
              handleCancel()
            }
          }}
        >
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span className="truncate max-w-[200px]">
              Link <strong className="text-gray-900 font-semibold">"{selectedRange.text}"</strong>
            </span>
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Close link dialog"
              className="text-gray-400 hover:text-gray-600 font-bold p-0.5 cursor-pointer"
            >
              &times;
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              ref={urlInputRef}
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value)
                if (urlError) setUrlError(null)
              }}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleApply()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  handleCancel()
                }
              }}
              placeholder="https://... or /garden/..."
              className="flex-1 px-2.5 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-800 bg-white"
            />
            <button
              type="button"
              onClick={handleApply}
              aria-label="Apply link"
              className="px-2.5 py-1 bg-[#191A23] text-white hover:bg-black rounded-md font-semibold text-xs cursor-pointer shrink-0"
            >
              Apply
            </button>
          </div>

          {urlError && (
            <p className="text-[10px] text-red-600 font-medium">{urlError}</p>
          )}
        </div>
      )}
    </div>
  )
}
