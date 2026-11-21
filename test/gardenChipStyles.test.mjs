import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  HERO_CHIP_ACTIVE,
  HERO_CHIP_INACTIVE,
  TOPIC_ALL_CHIP_ACTIVE,
  TOPIC_ALL_CHIP_INACTIVE,
  TOPIC_CHIP_ACTIVE,
  TOPIC_CHIP_INACTIVE,
  TOPIC_STRIP_WRAPPER,
  TOPIC_STRIP_CONTAINER,
  TOPIC_STRIP_ROW,
  TOPIC_STRIP_LABEL,
  getHeroChipClass,
  getTopicAllChipClass,
  getTopicChipClass,
} from '../lib/gardenChipStyles.ts'

describe('gardenChipStyles - exact class string preservation', () => {
  it('hero chip active matches the exact inline string from Resources page', () => {
    const expected =
      'shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#FDF8F1] focus-visible:outline-offset-2 bg-[#CF3F29] text-white shadow-sm'
    assert.equal(HERO_CHIP_ACTIVE, expected)
    assert.equal(getHeroChipClass(true), expected)
  })

  it('hero chip inactive matches the exact inline string from Resources page', () => {
    const expected =
      'shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#FDF8F1] focus-visible:outline-offset-2 bg-white/10 text-[#FDF8F1] hover:bg-white/20 border border-white/10'
    assert.equal(HERO_CHIP_INACTIVE, expected)
    assert.equal(getHeroChipClass(false), expected)
  })

  it('topic all active matches the exact inline string from Resources page', () => {
    const expected =
      'text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer bg-[#232536] text-white font-bold'
    assert.equal(TOPIC_ALL_CHIP_ACTIVE, expected)
    assert.equal(getTopicAllChipClass(true), expected)
  })

  it('topic all inactive matches the exact inline string from Resources page', () => {
    const expected =
      'text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
    assert.equal(TOPIC_ALL_CHIP_INACTIVE, expected)
    assert.equal(getTopicAllChipClass(false), expected)
  })

  it('topic category active matches the exact inline string from Resources page', () => {
    const expected =
      'text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer bg-[#2AA198] text-white font-bold'
    assert.equal(TOPIC_CHIP_ACTIVE, expected)
    assert.equal(getTopicChipClass(true), expected)
  })

  it('topic category inactive matches the exact inline string from Resources page', () => {
    const expected =
      'text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#2AA198]'
    assert.equal(TOPIC_CHIP_INACTIVE, expected)
    assert.equal(getTopicChipClass(false), expected)
  })

  it('topic strip wrapper and container classes match Resources page', () => {
    assert.equal(TOPIC_STRIP_WRAPPER, 'bg-[#FAF3E8]/60 border-b border-[#F5ECDE] py-4')
    assert.equal(TOPIC_STRIP_CONTAINER, 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8')
    assert.equal(TOPIC_STRIP_ROW, 'flex flex-wrap items-center gap-2')
    assert.equal(TOPIC_STRIP_LABEL, 'text-xs font-semibold text-[#5A5D70] mr-1')
  })
})
