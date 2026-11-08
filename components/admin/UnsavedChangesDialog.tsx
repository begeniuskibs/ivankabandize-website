'use client'

import React, { useEffect, useRef } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

export interface UnsavedChangesDialogProps {
  isOpen: boolean
  isSaving?: boolean
  saveLabel?: string
  onSaveAndLeave: () => void | Promise<void>
  onLeaveWithoutSaving: () => void
  onKeepEditing: () => void
}

export default function UnsavedChangesDialog({
  isOpen,
  isSaving = false,
  saveLabel = 'Save and leave',
  onSaveAndLeave,
  onLeaveWithoutSaving,
  onKeepEditing,
}: UnsavedChangesDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const keepEditingBtnRef = useRef<HTMLButtonElement>(null)

  // Focus management: default focus to 'Keep editing', trap Tab focus, handle Escape
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      keepEditingBtnRef.current?.focus()
    }, 50)

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (!isSaving) {
          onKeepEditing()
        }
        return
      }

      if (e.key === 'Tab') {
        if (!dialogRef.current) return
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSaving, onKeepEditing])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 motion-reduce:animate-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      aria-describedby="unsaved-changes-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onKeepEditing()
        }
      }}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 motion-reduce:animate-none"
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="unsaved-changes-title" className="text-base font-bold text-gray-900">
                You have unsaved changes
              </h3>
              <p id="unsaved-changes-desc" className="text-xs text-gray-500 mt-1 leading-relaxed">
                If you leave now, your latest edits will be lost.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onKeepEditing}
            disabled={isSaving}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer disabled:opacity-50 transition motion-reduce:transition-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <button
            type="button"
            onClick={onLeaveWithoutSaving}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl transition motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed text-center"
          >
            Leave without saving
          </button>
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2">
            <button
              ref={keepEditingBtnRef}
              type="button"
              onClick={onKeepEditing}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={onSaveAndLeave}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-black hover:bg-gray-800 rounded-xl transition motion-reduce:transition-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{saveLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

