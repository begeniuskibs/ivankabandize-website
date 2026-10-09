import { getSchema, Node } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CharacterCount from '@tiptap/extension-character-count'

const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      url: { default: '' },
      caption: { default: '' },
      playAsGif: { default: false },
      flushBackground: { default: false },
    }
  },
})

const Gallery = Node.create({
  name: 'gallery',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      images: { default: [] },
      caption: { default: '' },
    }
  },
})

const YouTube = Node.create({
  name: 'youtube',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      url: { default: '' },
    }
  },
})

const Bookmark = Node.create({
  name: 'bookmark',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      url: { default: '' },
      title: { default: '' },
      description: { default: '' },
      author: { default: '' },
      publisher: { default: '' },
      thumbnail: { default: '' },
      icon: { default: '' },
      caption: { default: '' },
    }
  },
})

const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
})

const Button = Node.create({
  name: 'button',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      label: { default: 'Click here' },
      url: { default: '' },
      alignment: { default: 'left' },
    }
  },
})

const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Placeholder.configure({
    placeholder: 'Write something...',
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    protocols: ['http', 'https', 'mailto', 'tel'],
    defaultProtocol: 'https',
  }),
  Image.configure({
    allowBase64: true,
  }),
  CharacterCount.configure(),
  Video,
  Gallery,
  YouTube,
  Bookmark,
  Button,
  Callout,
]

export const editorSchema = getSchema(extensions)

export function validateDocSchema(doc) {
  try {
    const pmNode = editorSchema.nodeFromJSON(doc)
    pmNode.check()
    return { valid: true }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) }
  }
}
