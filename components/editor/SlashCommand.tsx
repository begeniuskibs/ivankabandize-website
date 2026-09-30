'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Extension } from '@tiptap/core'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'

export interface SlashItem {
  title: string
  icon?: string
  command: (params: { editor: any; range: any }) => void
}

export interface SlashMenuListProps {
  items: SlashItem[]
  command: (item: SlashItem) => void
}

export const SlashMenuList = forwardRef<any, SlashMenuListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedIndex(0)
  }, [props.items])

  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.children[selectedIndex] as HTMLElement | undefined
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev <= 0 ? props.items.length - 1 : prev - 1))
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev >= props.items.length - 1 ? 0 : prev + 1))
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  if (props.items.length === 0) {
    return (
      <div className="bg-[#232536] text-white rounded-xl shadow-2xl p-3 border border-white/10 text-xs w-64 text-center text-gray-400 font-sans">
        No matching commands
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="bg-[#232536] text-white rounded-xl shadow-2xl p-1.5 border border-white/10 text-xs backdrop-blur-md w-64 max-h-72 overflow-y-auto flex flex-col gap-0.5 font-sans"
    >
      {props.items.map((item, index) => {
        const isSelected = index === selectedIndex
        return (
          <button
            key={index}
            type="button"
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between transition cursor-pointer ${
              isSelected ? 'bg-white text-black font-semibold shadow-sm' : 'text-gray-200 hover:bg-white/15'
            }`}
          >
            <span className="flex items-center gap-2">
              {item.icon && <span className="text-xs w-4 text-center opacity-90">{item.icon}</span>}
              <span>{item.title}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
})

SlashMenuList.displayName = 'SlashMenuList'

export interface SlashCommandsOptions {
  suggestion: Omit<SuggestionOptions, 'editor'>
}

export const SlashCommands = Extension.create<SlashCommandsOptions>({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
