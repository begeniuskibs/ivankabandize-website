'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useEffect, useRef } from 'react'

interface TipTapEditorProps {
  content?: Record<string, unknown> | string
  onChange: (json: Record<string, unknown>) => void
  placeholder?: string
}

export default function TipTapEditor({
  content,
  onChange,
  placeholder = 'Write your post content here...',
}: TipTapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full my-6 shadow-sm border border-gray-100',
        },
      }),
    ],
    content: typeof content === 'object' && content !== null ? content : {},
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none min-h-[380px] focus:outline-none p-6 text-gray-900',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>)
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && content) {
      const currentJson = JSON.stringify(editor.getJSON())
      const nextJson = JSON.stringify(content)
      if (currentJson !== nextJson) {
        editor.commands.setContent(
          typeof content === 'object' && content !== null ? content : {}
        )
      }
    }
  }, [content, editor])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          editor.chain().focus().setImage({ src: data.url, alt: file.name }).run()
        }
      } else {
        alert('Failed to upload image')
      }
    } catch (err) {
      console.error('Image upload error:', err)
      alert('Error uploading image to server')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleInsertImageUrl() {
    if (!editor) return
    const url = window.prompt('Enter image URL:')
    if (url && url.trim()) {
      editor.chain().focus().setImage({ src: url.trim() }).run()
    }
  }

  if (!editor) {
    return (
      <div className="border border-gray-200 rounded-xl p-8 bg-gray-50 min-h-[380px] flex items-center justify-center text-gray-400">
        Loading editor...
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-black focus-within:border-transparent">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Formatting Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex flex-wrap items-center gap-1 text-sm">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2.5 py-1 rounded font-semibold transition ${
            editor.isActive('bold') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2.5 py-1 rounded italic transition ${
            editor.isActive('italic') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2.5 py-1 rounded font-bold transition ${
            editor.isActive('heading', { level: 1 }) ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2.5 py-1 rounded font-bold transition ${
            editor.isActive('heading', { level: 2 }) ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2.5 py-1 rounded font-bold transition ${
            editor.isActive('heading', { level: 3 }) ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Heading 3"
        >
          H3
        </button>
        <div className="w-[1px] h-5 bg-gray-300 mx-1.5 self-center" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2.5 py-1 rounded transition text-xs font-medium ${
            editor.isActive('bulletList') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2.5 py-1 rounded transition text-xs font-medium ${
            editor.isActive('orderedList') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          Ordered List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2.5 py-1 rounded transition text-xs font-medium ${
            editor.isActive('blockquote') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-2.5 py-1 rounded font-mono transition text-xs font-medium ${
            editor.isActive('codeBlock') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          Code
        </button>
        <div className="w-[1px] h-5 bg-gray-300 mx-1.5 self-center" />
        {/* Insert Image Controls */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1 rounded transition text-xs font-medium hover:bg-gray-200 text-gray-700 flex items-center gap-1"
          title="Upload image into post body"
        >
          <span>📷 Upload Image</span>
        </button>
        <button
          type="button"
          onClick={handleInsertImageUrl}
          className="px-2.5 py-1 rounded transition text-xs font-medium hover:bg-gray-200 text-gray-700"
          title="Insert image by web URL"
        >
          Image URL
        </button>
      </div>

      {/* Editor Body */}
      <EditorContent editor={editor} />
    </div>
  )
}
