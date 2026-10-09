'use client'

import React, { useEffect, useRef, useState } from 'react'
import { isDeleteConfirmationValid } from '@/lib/postDelete'

export interface PostToDelete {
  id: string
  title: string
  slug: string
  publish_status: 'draft' | 'scheduled' | 'published'
}

interface DeletePostModalProps {
  post: PostToDelete | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (deletedPost: PostToDelete) => void
  onError: (error: string) => void
}

export default function DeletePostModal({
  post,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: DeletePostModalProps) {
  const [typedSlug, setTypedSlug] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  // Reset local state when opened with a new post
  useEffect(() => {
    if (isOpen) {
      setTypedSlug('')
      setModalError(null)
      setIsDeleting(false)
    }
  }, [isOpen, post])

  // Focus management & Escape key & Focus Trap
  useEffect(() => {
    if (!isOpen) return

    // Auto-focus input for published/scheduled, or cancel button for draft
    const timer = setTimeout(() => {
      if (post && post.publish_status !== 'draft') {
        inputRef.current?.focus()
      } else {
        cancelButtonRef.current?.focus()
      }
    }, 50)

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (!isDeleting) {
          onClose()
        }
        return
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isDeleting, onClose, post])

  if (!isOpen || !post) return null

  const isDraft = post.publish_status === 'draft'
  const isSlugConfirmed = isDeleteConfirmationValid(post.publish_status, post.slug, typedSlug)
  const canDelete = isSlugConfirmed && !isDeleting

  async function handleDelete() {
    if (!post || !canDelete) return

    try {
      setIsDeleting(true)
      setModalError(null)

      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'DELETE',
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const errorMsg = data.error || 'Failed to delete post'
        setModalError(errorMsg)
        onError(errorMsg)
        setIsDeleting(false)
        return
      }

      setIsDeleting(false)
      onSuccess(post)
      onClose()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error deleting post'
      setModalError(errorMsg)
      onError(errorMsg)
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      aria-labelledby="delete-post-title"
      aria-describedby="delete-post-desc"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">
              &times;
            </div>
            <div>
              <h3 id="delete-post-title" className="text-sm font-bold text-gray-900">
                {isDraft ? 'Delete Draft' : 'Delete Post'}
              </h3>
              <p className="text-[11px] text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close delete confirmation"
            className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 cursor-pointer disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Post Details Summary */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 space-y-2">
            <div>
              <span className="text-[10px] uppercase font-semibold text-gray-400 block tracking-wider">
                Title
              </span>
              <p className="text-xs font-bold text-gray-900 truncate">{post.title}</p>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[11px]">
              <div>
                <span className="text-gray-400">Status: </span>
                <span
                  className={`inline-block uppercase tracking-wider text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    post.publish_status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : post.publish_status === 'scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {post.publish_status}
                </span>
              </div>
              <div className="truncate max-w-[200px]">
                <span className="text-gray-400">Slug: </span>
                <code className="text-gray-700 font-mono text-[10px] bg-gray-100 px-1 py-0.5 rounded">
                  {post.slug}
                </code>
              </div>
            </div>
          </div>

          {/* Description & Confirmation */}
          <div id="delete-post-desc" className="text-gray-600 space-y-3">
            {isDraft ? (
              <p>
                Are you sure you want to delete this draft? The post content and associated tags
                will be permanently deleted.
              </p>
            ) : (
              <>
                <p>
                  This post is currently{' '}
                  <strong className="text-gray-900 uppercase">{post.publish_status}</strong>.
                  Deleting it will immediately remove it from public view and delete all views,
                  comments, and tag associations.
                </p>
                <div className="space-y-1.5 pt-1">
                  <label htmlFor="confirm-slug-input" className="block font-medium text-gray-700">
                    To confirm, please type{' '}
                    <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                      {post.slug}
                    </code>{' '}
                    below:
                  </label>
                  <input
                    ref={inputRef}
                    id="confirm-slug-input"
                    type="text"
                    value={typedSlug}
                    onChange={(e) => setTypedSlug(e.target.value)}
                    placeholder={post.slug}
                    disabled={isDeleting}
                    autoComplete="off"
                    className="w-full text-xs font-mono px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Error Banner */}
          {modalError && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs"
            >
              {modalError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cancel deletion"
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-black hover:bg-gray-200/70 rounded-lg transition border border-gray-200 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete}
            aria-label={isDraft ? 'Confirm delete draft' : 'Confirm delete post'}
            className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition shadow-xs flex items-center gap-1.5 ${
              canDelete
                ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                : 'bg-red-300 cursor-not-allowed opacity-60'
            }`}
          >
            {isDeleting ? (
              <span>Deleting...</span>
            ) : isDraft ? (
              <span>Delete draft</span>
            ) : (
              <span>Delete post</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
