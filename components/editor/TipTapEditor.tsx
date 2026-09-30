'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CharacterCount from '@tiptap/extension-character-count'
import { ReactRenderer } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import { Video, Gallery, YouTube, Callout, validateYouTubeUrl } from './customNodes'
import { SlashCommands, SlashMenuList, SlashItem } from './SlashCommand'
import { UploadProgressCard, uploadFileDirect, formatBytes } from './UploadProgress'

export function sanitizeUrl(input: string): string | null {
  let url = (input || '').trim()
  if (!url) return null
  // If no protocol is provided, prefix https://
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
    url = 'https://' + url
  }
  try {
    const parsed = new URL(url)
    const protocol = parsed.protocol.toLowerCase()
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:']
    if (!allowedProtocols.includes(protocol)) {
      return null
    }
    return url
  } catch {
    return null
  }
}

export function YoutubeIcon({ className = 'w-4 h-4', ...props }: React.SVGProps<SVGSVGElement>) {
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
      {...props}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
    </svg>
  )
}

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
  const videoInputRef = useRef<HTMLInputElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const [wordCount, setWordCount] = useState(0)
  const [isEditingLink, setIsEditingLink] = useState(false)
  const [linkInputVal, setLinkInputVal] = useState('')
  const [singleUpload, setSingleUpload] = useState<{
    filename: string
    percent: number
    loadedText?: string
    totalText?: string
  } | null>(null)

  const handleToggleHeading1 = (ed?: any) => (ed || editor)?.chain().focus().toggleHeading({ level: 1 }).run()
  const handleToggleHeading2 = (ed?: any) => (ed || editor)?.chain().focus().toggleHeading({ level: 2 }).run()
  const handleToggleHeading3 = (ed?: any) => (ed || editor)?.chain().focus().toggleHeading({ level: 3 }).run()
  const handleToggleBulletList = (ed?: any) => (ed || editor)?.chain().focus().toggleBulletList().run()
  const handleToggleOrderedList = (ed?: any) => (ed || editor)?.chain().focus().toggleOrderedList().run()
  const handleToggleQuote = (ed?: any) => (ed || editor)?.chain().focus().toggleBlockquote().run()
  const handleToggleCallout = (ed?: any) => (ed || editor)?.chain().focus().toggleCallout().run()
  const handleToggleCode = (ed?: any) => (ed || editor)?.chain().focus().toggleCodeBlock().run()
  const handleTriggerImageUpload = () => fileInputRef.current?.click()
  const handleTriggerVideoUpload = () => videoInputRef.current?.click()

  function handleInsertImageUrl(ed?: any) {
    const targetEditor = ed || editor
    if (!targetEditor) return
    const url = window.prompt('Enter image URL:')
    if (url && url.trim()) {
      targetEditor.chain().focus().setImage({ src: url.trim() }).run()
    }
  }

  function handleInsertVideoUrl(ed?: any) {
    const targetEditor = ed || editor
    if (!targetEditor) return
    const url = window.prompt('Enter video URL (e.g. Supabase storage or durable mp4 host):')
    if (url && url.trim()) {
      const caption = window.prompt('Enter video caption (optional):') || ''
      targetEditor.chain().focus().insertContent({
        type: 'video',
        attrs: {
          url: url.trim(),
          caption: caption.trim(),
        },
      }).run()
    }
  }

  function handleInsertGallery(ed?: any) {
    const targetEditor = ed || editor
    if (!targetEditor) return
    targetEditor.chain().focus().insertContent({
      type: 'gallery',
      attrs: {
        images: [],
        caption: '',
      },
    }).run()
  }

  function handleInsertYouTube(ed?: any) {
    const targetEditor = ed || editor
    if (!targetEditor) return
    const url = window.prompt('Enter YouTube URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...):')
    if (!url || !url.trim()) return

    const validation = validateYouTubeUrl(url.trim())
    if (!validation.valid) {
      alert(validation.error || 'Invalid YouTube URL. Only youtube.com and youtu.be addresses are allowed.')
      return
    }

    targetEditor.chain().focus().insertContent({
      type: 'youtube',
      attrs: {
        url: url.trim(),
      },
    }).run()
  }

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
        autolink: true,
        linkOnPaste: true,
        protocols: ['http', 'https', 'mailto', 'tel'],
        defaultProtocol: 'https',
        isAllowedUri: (url) => !!sanitizeUrl(url),
        validate: (href) => !!sanitizeUrl(href),
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
      Video,
      Gallery,
      YouTube,
      Callout,
      SlashCommands.configure({
        suggestion: {
          char: '/',
          items: ({ query }: { query: string }) => {
            const allItems: SlashItem[] = [
              {
                title: 'Heading 1',
                icon: 'H1',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleToggleHeading1(ed)
                },
              },
              {
                title: 'Heading 2',
                icon: 'H2',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleToggleHeading2(ed)
                },
              },
              {
                title: 'Heading 3',
                icon: 'H3',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleToggleHeading3(ed)
                },
              },
              {
                title: 'Bullet list',
                icon: '•',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleToggleBulletList(ed)
                },
              },
              {
                title: 'Ordered list',
                icon: '1.',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleToggleOrderedList(ed)
                },
              },
              {
                title: 'Quote',
                icon: '”',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleToggleQuote(ed)
                },
              },
              {
                title: 'Callout',
                icon: '💬',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleToggleCallout(ed)
                },
              },
              {
                title: 'Code',
                icon: '</>',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleToggleCode(ed)
                },
              },
              {
                title: 'Image (upload)',
                icon: '📷',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleTriggerImageUpload()
                },
              },
              {
                title: 'Image (URL)',
                icon: '🔗',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleInsertImageUrl(ed)
                },
              },
              {
                title: 'Video (upload)',
                icon: '🎥',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleTriggerVideoUpload()
                },
              },
              {
                title: 'Video (URL)',
                icon: '🎬',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleInsertVideoUrl(ed)
                },
              },
              {
                title: 'Gallery',
                icon: '🖼️',
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleInsertGallery(ed)
                },
              },
              {
                title: 'YouTube',
                icon: <YoutubeIcon className="w-3.5 h-3.5 text-red-500" />,
                command: ({ editor: ed, range }) => {
                  ed.chain().focus().deleteRange(range).run()
                  handleInsertYouTube(ed)
                },
              },
            ]
            const q = (query || '').toLowerCase().trim()
            if (!q) return allItems
            return allItems.filter((item) => item.title.toLowerCase().includes(q))
          },
          render: () => {
            let component: ReactRenderer<any> | null = null
            let popup: HTMLDivElement | null = null

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(SlashMenuList, {
                  props,
                  editor: props.editor,
                })

                popup = document.createElement('div')
                popup.className = 'slash-command-popup-container'
                popup.style.position = 'fixed'
                popup.style.zIndex = '99999'
                document.body.appendChild(popup)
                popup.appendChild(component.element)

                const rect = props.clientRect?.()
                if (rect && popup) {
                  const top = rect.bottom + 8
                  const left = Math.min(window.innerWidth - 275, Math.max(16, rect.left))
                  popup.style.top = `${top}px`
                  popup.style.left = `${left}px`
                }
              },

              onUpdate: (props: any) => {
                component?.updateProps(props)

                const rect = props.clientRect?.()
                if (rect && popup) {
                  const top = rect.bottom + 8
                  const left = Math.min(window.innerWidth - 275, Math.max(16, rect.left))
                  popup.style.top = `${top}px`
                  popup.style.left = `${left}px`
                }
              },

              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  if (popup) {
                    popup.remove()
                    popup = null
                  }
                  component?.destroy()
                  component = null
                  return true
                }
                return component?.ref?.onKeyDown(props) || false
              },

              onExit: () => {
                if (popup) {
                  popup.remove()
                  popup = null
                }
                component?.destroy()
                component = null
              },
            }
          },
        },
      }),
    ],
    content: typeof content === 'object' && content !== null ? content : {},
    editorProps: {
      attributes: {
        class: 'min-h-[380px] focus:outline-none p-6 text-gray-900',
      },
      handleKeyDown: (view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          if (editor && (!editor.state.selection.empty || editor.isActive('link'))) {
            event.preventDefault()
            const currentHref = editor.getAttributes('link').href || ''
            setLinkInputVal(currentHref)
            setIsEditingLink(true)
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain')?.trim()
        if (text && editor && !editor.state.selection.empty && !editor.isActive('codeBlock')) {
          const sanitized = sanitizeUrl(text)
          if (sanitized && (/^https?:\/\//i.test(text) || /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/i.test(text) || /^mailto:/i.test(text) || /^tel:/i.test(text))) {
            editor.chain().focus().setLink({ href: sanitized }).run()
            return true
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>)
      setWordCount(editor.storage.characterCount?.words() ?? 0)
    },
    onCreate: ({ editor }) => {
      setWordCount(editor.storage.characterCount?.words() ?? 0)
    },
    onSelectionUpdate: ({ editor }) => {
      if (!editor.isActive('link') && editor.state.selection.empty) {
        setIsEditingLink(false)
      }
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

  useEffect(() => {
    if (isEditingLink && linkInputRef.current) {
      linkInputRef.current.focus()
      linkInputRef.current.select()
    }
  }, [isEditingLink])

  const handleLinkSubmit = () => {
    if (!editor) return
    const raw = linkInputVal.trim()
    if (!raw) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setIsEditingLink(false)
      setLinkInputVal('')
    } else {
      const sanitized = sanitizeUrl(raw)
      if (sanitized) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: sanitized }).run()
        setIsEditingLink(false)
        setLinkInputVal('')
      } else {
        alert('Invalid link address. Allowed protocols: http, https, mailto, tel')
      }
    }
  }

  const handleLinkRemove = () => {
    if (!editor) return
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setIsEditingLink(false)
    setLinkInputVal('')
  }

  const handleLinkCancel = () => {
    setIsEditingLink(false)
    setLinkInputVal('')
    editor?.commands.focus()
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    setSingleUpload({
      filename: file.name,
      percent: 0,
      loadedText: '0 B',
      totalText: formatBytes(file.size),
    })

    try {
      const res = await uploadFileDirect({
        file,
        bucket: 'post-images',
        onProgress: (p) => {
          setSingleUpload({
            filename: file.name,
            percent: p.percent,
            loadedText: p.formattedLoaded,
            totalText: p.formattedTotal,
          })
        },
      })
      editor.chain().focus().setImage({ src: res.url, alt: file.name }).run()
    } catch (err: any) {
      console.error('Image direct upload error:', err)
      alert(`Failed to upload image: ${err?.message || 'Unknown error'}`)
    } finally {
      setSingleUpload(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }



  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    setSingleUpload({
      filename: file.name,
      percent: 0,
      loadedText: '0 B',
      totalText: formatBytes(file.size),
    })

    try {
      const res = await uploadFileDirect({
        file,
        bucket: 'post-videos',
        onProgress: (p) => {
          setSingleUpload({
            filename: file.name,
            percent: p.percent,
            loadedText: p.formattedLoaded,
            totalText: p.formattedTotal,
          })
        },
      })
      editor.chain().focus().insertContent({
        type: 'video',
        attrs: {
          url: res.url,
          caption: '',
        },
      }).run()
    } catch (err: any) {
      console.error('Video direct upload error:', err)
      alert(`Failed to upload video: ${err?.message || 'Unknown error'}`)
    } finally {
      setSingleUpload(null)
      if (videoInputRef.current) {
        videoInputRef.current.value = ''
      }
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
        /* Restyled Quote (blockquote) */
        .tiptap-editor-scope .ProseMirror blockquote {
          text-align: center;
          font-size: 20px;
          font-weight: 500;
          line-height: 1.5;
          border-left: none;
          background-color: transparent;
          padding: 8px 24px;
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
          color: #232536;
          position: relative;
        }
        .tiptap-editor-scope .ProseMirror blockquote::before {
          content: "";
          display: block;
          width: 22px;
          height: 22px;
          margin: 0 auto 0.75rem auto;
          background-color: #EF5B45;
          -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v2c0 2.667 -1.333 4.333 -4 5'%3E%3C/path%3E%3Cpath d='M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v2c0 2.667 -1.333 4.333 -4 5'%3E%3C/path%3E%3C/svg%3E") no-repeat center;
          mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v2c0 2.667 -1.333 4.333 -4 5'%3E%3C/path%3E%3Cpath d='M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v2c0 2.667 -1.333 4.333 -4 5'%3E%3C/path%3E%3C/svg%3E") no-repeat center;
          mask-size: contain;
          -webkit-mask-size: contain;
        }
        .tiptap-editor-scope .ProseMirror blockquote p {
          text-align: center;
          font-size: 20px;
          font-weight: 500;
          line-height: 1.5;
          margin-bottom: 0.5rem;
        }
        /* Callout Block */
        .tiptap-editor-scope .ProseMirror div[data-type="callout"],
        .tiptap-editor-scope .ProseMirror .callout-block {
          background-color: #FAECE7 !important;
          border: 1px solid #D85A30 !important;
          border-radius: 10px !important;
          padding: 16px 18px !important;
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
          color: #1f2937;
        }
        .tiptap-editor-scope .ProseMirror div[data-type="callout"] p,
        .tiptap-editor-scope .ProseMirror .callout-block p {
          color: #1f2937;
          font-size: 1.125rem;
          line-height: 1.625;
          margin-bottom: 0.75rem;
        }
        .tiptap-editor-scope .ProseMirror div[data-type="callout"] p:last-child,
        .tiptap-editor-scope .ProseMirror .callout-block p:last-child {
          margin-bottom: 0;
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

      {/* Hidden file input for video upload */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/*"
        onChange={handleVideoUpload}
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
          onClick={() => handleToggleHeading1()}
          className={`px-2.5 py-1 rounded font-bold transition ${
            editor.isActive('heading', { level: 1 }) ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => handleToggleHeading2()}
          className={`px-2.5 py-1 rounded font-bold transition ${
            editor.isActive('heading', { level: 2 }) ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => handleToggleHeading3()}
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
          onClick={() => handleToggleBulletList()}
          className={`px-2.5 py-1 rounded transition text-xs font-medium ${
            editor.isActive('bulletList') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => handleToggleOrderedList()}
          className={`px-2.5 py-1 rounded transition text-xs font-medium ${
            editor.isActive('orderedList') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
        >
          Ordered List
        </button>
        <button
          type="button"
          onClick={() => handleToggleQuote()}
          className={`px-2.5 py-1 rounded transition text-xs font-medium ${
            editor.isActive('blockquote') ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Centered Quote"
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => handleToggleCallout()}
          className={`px-2.5 py-1 rounded transition text-xs font-medium ${
            editor.isActive('callout') ? 'bg-[#D85A30] text-white' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title="Callout Box"
        >
          Callout
        </button>
        <button
          type="button"
          onClick={() => handleToggleCode()}
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
          onClick={handleTriggerImageUpload}
          className="px-2.5 py-1 rounded transition text-xs font-medium hover:bg-gray-200 text-gray-700 flex items-center gap-1"
          title="Upload image into post body"
        >
          <span>📷 Upload Image</span>
        </button>
        <button
          type="button"
          onClick={() => handleInsertImageUrl()}
          className="px-2.5 py-1 rounded transition text-xs font-medium hover:bg-gray-200 text-gray-700"
          title="Insert image by web URL"
        >
          Image URL
        </button>
        <div className="w-[1px] h-5 bg-gray-300 mx-1.5 self-center" />
        {/* Insert Video Controls */}
        <button
          type="button"
          onClick={handleTriggerVideoUpload}
          className="px-2.5 py-1 rounded transition text-xs font-medium hover:bg-gray-200 text-gray-700 flex items-center gap-1"
          title="Upload video into post body"
        >
          <span>🎥 Upload Video</span>
        </button>
        <button
          type="button"
          onClick={() => handleInsertVideoUrl()}
          className="px-2.5 py-1 rounded transition text-xs font-medium hover:bg-gray-200 text-gray-700"
          title="Insert video by URL"
        >
          Video URL
        </button>
        <div className="w-[1px] h-5 bg-gray-300 mx-1.5 self-center" />
        {/* Insert Gallery Control */}
        <button
          type="button"
          onClick={() => handleInsertGallery()}
          className="px-2.5 py-1 rounded transition text-xs font-medium hover:bg-gray-200 text-gray-700 flex items-center gap-1"
          title="Insert image gallery"
        >
          <span>🖼️ Gallery</span>
        </button>
        {/* Insert YouTube Control */}
        <button
          type="button"
          onClick={() => handleInsertYouTube()}
          className="px-2.5 py-1 rounded transition text-xs font-medium hover:bg-gray-200 text-gray-700 flex items-center gap-1.5"
          title="Insert YouTube embed"
        >
          <YoutubeIcon className="w-3.5 h-3.5 text-red-600" />
          <span>YouTube</span>
        </button>
      </div>

      {/* TipTap v3 Selection Bubble Menu */}
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor, from, to }) => {
          if (!editor.isEditable) return false
          if (editor.isActive('codeBlock')) return false
          if (editor.isActive('link')) return true
          return from !== to
        }}
      >
        <div className="bg-[#232536] text-white rounded-xl shadow-2xl p-1.5 flex items-center gap-1 border border-white/10 text-xs backdrop-blur-md">
          {isEditingLink ? (
            <div className="flex items-center gap-1.5 px-1 py-0.5">
              <input
                ref={linkInputRef}
                type="text"
                value={linkInputVal}
                onChange={e => setLinkInputVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleLinkSubmit()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    handleLinkCancel()
                  }
                }}
                placeholder="https://example.com"
                aria-label="Link address"
                className="bg-white/10 text-white placeholder-gray-400 text-xs px-2.5 py-1 rounded-lg border border-white/20 focus:outline-none focus:ring-1 focus:ring-white w-48 sm:w-60"
              />
              <button
                type="button"
                onClick={handleLinkSubmit}
                aria-label="Apply link"
                className="px-2 py-1 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition text-xs"
              >
                Apply
              </button>
              {editor.isActive('link') && (
                <button
                  type="button"
                  onClick={handleLinkRemove}
                  aria-label="Remove link"
                  className="px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition text-xs font-medium"
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={handleLinkCancel}
                aria-label="Cancel link edit"
                className="p-1 text-gray-400 hover:text-white rounded-lg transition text-xs"
              >
                &times;
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                aria-label="Bold"
                aria-pressed={editor.isActive('bold')}
                className={`px-2 py-1 rounded font-semibold transition ${
                  editor.isActive('bold') ? 'bg-white text-black' : 'hover:bg-white/15 text-gray-200'
                }`}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                aria-label="Italic"
                aria-pressed={editor.isActive('italic')}
                className={`px-2 py-1 rounded italic transition ${
                  editor.isActive('italic') ? 'bg-white text-black' : 'hover:bg-white/15 text-gray-200'
                }`}
              >
                I
              </button>
              <div className="w-[1px] h-4 bg-white/20 mx-0.5 self-center" />
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                aria-label="Heading 2"
                aria-pressed={editor.isActive('heading', { level: 2 })}
                className={`px-2 py-1 rounded font-bold transition ${
                  editor.isActive('heading', { level: 2 }) ? 'bg-white text-black' : 'hover:bg-white/15 text-gray-200'
                }`}
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                aria-label="Heading 3"
                aria-pressed={editor.isActive('heading', { level: 3 })}
                className={`px-2 py-1 rounded font-bold transition ${
                  editor.isActive('heading', { level: 3 }) ? 'bg-white text-black' : 'hover:bg-white/15 text-gray-200'
                }`}
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                aria-label="Quote"
                aria-pressed={editor.isActive('blockquote')}
                className={`px-2 py-1 rounded transition ${
                  editor.isActive('blockquote') ? 'bg-white text-black' : 'hover:bg-white/15 text-gray-200'
                }`}
              >
                Quote
              </button>
              <button
                type="button"
                onClick={handleToggleCallout}
                aria-label="Callout"
                aria-pressed={editor.isActive('callout')}
                className={`px-2 py-1 rounded transition ${
                  editor.isActive('callout') ? 'bg-white text-black' : 'hover:bg-white/15 text-gray-200'
                }`}
              >
                Callout
              </button>
              <div className="w-[1px] h-4 bg-white/20 mx-0.5 self-center" />
              {editor.isActive('link') ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkInputVal(editor.getAttributes('link').href || '')
                      setIsEditingLink(true)
                    }}
                    aria-label="Edit link"
                    aria-pressed="true"
                    className="px-2 py-1 rounded bg-white text-black font-semibold transition"
                  >
                    Edit Link
                  </button>
                  <button
                    type="button"
                    onClick={handleLinkRemove}
                    aria-label="Remove link"
                    className="px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setLinkInputVal('')
                    setIsEditingLink(true)
                  }}
                  aria-label="Link"
                  aria-pressed="false"
                  className="px-2 py-1 rounded hover:bg-white/15 text-gray-200 transition"
                >
                  Link
                </button>
              )}
            </>
          )}
        </div>
      </BubbleMenu>

      {/* Single Upload Progress Card */}
      {singleUpload && (
        <div className="py-6 px-4 bg-gray-50/80 border-b border-gray-200 flex flex-col items-center justify-center">
          <UploadProgressCard
            filename={singleUpload.filename}
            percent={singleUpload.percent}
            loadedText={singleUpload.loadedText}
            totalText={singleUpload.totalText}
          />
        </div>
      )}

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
