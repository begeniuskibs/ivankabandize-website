'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { useEffect } from 'react'

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
    ],
    content: typeof content === 'object' && content !== null ? content : {},
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none min-h-[300px] focus:outline-none p-4 text-gray-900',
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

  if (!editor) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 min-h-[300px] flex items-center justify-center text-gray-400">
        Loading editor...
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-black focus-within:border-transparent">
      {/* Formatting Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex flex-wrap gap-1 text-sm">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded font-semibold transition ${
            editor.isActive('bold') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded italic transition ${
            editor.isActive('italic') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded font-bold transition ${
            editor.isActive('heading', { level: 1 }) ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded font-bold transition ${
            editor.isActive('heading', { level: 2 }) ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded font-bold transition ${
            editor.isActive('heading', { level: 3 }) ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          H3
        </button>
        <div className="w-[1px] h-6 bg-gray-300 mx-1 self-center" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded transition ${
            editor.isActive('bulletList') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded transition ${
            editor.isActive('orderedList') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          Ordered List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 rounded transition ${
            editor.isActive('blockquote') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-2 py-1 rounded font-mono transition ${
            editor.isActive('codeBlock') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          Code
        </button>
      </div>

      {/* Editor Body */}
      <EditorContent editor={editor} />
    </div>
  )
}
