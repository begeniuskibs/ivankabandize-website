'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CharacterCount from '@tiptap/extension-character-count'
import { useEffect, useRef, useState } from 'react'

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
  const [wordCount, setWordCount] = useState(0)

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
          class: 'text-[#D94834] underline hover:text-[#B93A2A] visited:text-[#D94834]',
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full my-6 shadow-sm border border-gray-100',
        },
      }),
      CharacterCount.configure(),
    ],
    content: typeof content === 'object' && content !== null ? content : {},
    editorProps: {
      attributes: {
        class:
          'min-h-[380px] focus:outline-none p-6 text-gray-900',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>)
      setWordCount(editor.storage.characterCount?.words() ?? 0)
    },
    onCreate: ({ editor }) => {
      setWordCount(editor.storage.characterCount?.words() ?? 0)
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
        setWordCount(editor.storage.characterCount?.words() ?? 0)
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
    <div className="tiptap-editor-scope border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-black focus-within:border-transparent relative">
      <style>{`
        .tiptap-editor-scope .ProseMirror {
          outline: none;
          min-height: 380px;
          padding: 1.5rem;
          color: #111827;
          font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .tiptap-editor-scope .ProseMirror h1 {
          font-family: 'MTN Brighter Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.875rem;
          line-height: 2.25rem;
          font-weight: 700;
          color: #111827;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          letter-spacing: -0.025em;
        }
        .tiptap-editor-scope .ProseMirror h2 {
          font-family: 'MTN Brighter Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.5rem;
          line-height: 2rem;
          font-weight: 700;
          color: #111827;
          margin-top: 2rem;
          margin-bottom: 1rem;
          letter-spacing: -0.025em;
        }
        .tiptap-editor-scope .ProseMirror h3 {
          font-family: 'MTN Brighter Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.25rem;
          line-height: 1.75rem;
          font-weight: 600;
          color: #111827;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .tiptap-editor-scope .ProseMirror p {
          color: #1f2937;
          line-height: 1.625;
          margin-bottom: 1.5rem;
          font-size: 1.125rem;
        }
        .tiptap-editor-scope .ProseMirror blockquote {
          border-left: 4px solid #EF5B45;
          padding-left: 1.5rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
          color: #232536;
          background-color: #FDF8F1;
          border-top-right-radius: 1rem;
          border-bottom-right-radius: 1rem;
          font-size: 1.125rem;
          font-weight: 500;
        }
        .tiptap-editor-scope .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
          color: #1f2937;
          font-size: 1.125rem;
        }
        .tiptap-editor-scope .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
          color: #1f2937;
          font-size: 1.125rem;
        }
        .tiptap-editor-scope .ProseMirror li {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .tiptap-editor-scope .ProseMirror li p {
          margin-bottom: 0.25rem;
        }
        .tiptap-editor-scope .ProseMirror code:not(pre code) {
          background-color: #f3f4f6;
          color: #dc2626;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: monospace;
        }
        .tiptap-editor-scope .ProseMirror pre {
          background-color: #232536;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 1rem;
          overflow-x: auto;
          font-size: 0.875rem;
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
          font-family: monospace;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .tiptap-editor-scope .ProseMirror pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
          border-radius: 0;
          font-size: inherit;
          font-family: inherit;
        }
        .tiptap-editor-scope .ProseMirror hr {
          margin-top: 2rem;
          margin-bottom: 2rem;
          border: 0;
          border-top: 1px solid #e5e7eb;
        }
        .tiptap-editor-scope .ProseMirror img {
          width: 100%;
          max-width: 100%;
          height: auto;
          border-radius: 1rem;
          border: 1px solid #F5ECDE;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          object-fit: cover;
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .tiptap-editor-scope .ProseMirror a {
          color: #D94834;
          text-decoration: underline;
          cursor: pointer;
        }
        .tiptap-editor-scope .ProseMirror a:hover {
          color: #B93A2A;
        }
        .tiptap-editor-scope .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
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

      {/* Editor Status Footer - Word Counter */}
      <div className="flex items-center justify-end px-6 py-2.5 bg-gray-50/70 border-t border-gray-100 text-xs text-[#5A5D70] select-none">
        <span className="font-medium tracking-wide">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
      </div>
    </div>
  )
}
