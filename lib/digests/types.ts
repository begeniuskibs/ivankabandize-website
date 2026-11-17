export interface StatsBlock {
  k: 'stats'
  items: [string, string][]
}

export interface NoteBlock {
  k: 'note'
  h: string
  p: string
}

export interface CardsBlock {
  k: 'cards'
  items: [string, string][]
}

export type CompareSliderGroup = [label: string, a: number[], b: number[], short?: string]

export interface CompareSliderBlock {
  k: 'cmp'
  la: string
  lb: string
  max: number
  dec: number
  suf?: string
  sub: string[]
  groups: CompareSliderGroup[]
  src: string
}

export interface CopyBoxBlock {
  k: 'copy'
  h: string
  p: string
  text: string
}

export interface HorizontalBarsBlock {
  k: 'hbars'
  max: number
  dec: number
  suf?: string
  cols: [string, [string, number][], string][]
  note?: string
}

export interface RingsBlock {
  k: 'rings'
  a: [string, string, number]
  b: [string, string, number]
  p: string
}

export interface SegmentedTabsBlock {
  k: 'segs'
  tabs: [string, string][]
}

export interface RoleSwitcherBlock {
  k: 'roles'
  roles: Record<string, string[]>
}

export type QuizQuestion = [string, string[], number, string]

export interface QuizBlock {
  k: 'quiz'
  q: QuizQuestion[]
}

export interface TakeBlock {
  k: 'take'
  approved?: boolean
  paras: string[]
}

export interface StoryStepDot {
  x: number
  y: number
  c: string
  s: number
  o?: number
  t?: string
}

export interface StoryStep {
  k: string
  t: string
  p: string
  cap: [string, string]
  f: (stepIndex: number, dotIndex: number) => StoryStepDot
}

export interface ScrollStoryBlock {
  k: 'story'
  n: number
  legend?: string[]
  steps: StoryStep[]
}

export interface AskBlock {
  k: 'ask'
}

export interface HeatmapBlock {
  k: 'heat'
}

export interface AttachmentBlock {
  k: 'attach'
}

export interface PluralismBlock {
  k: 'plural'
}

export interface JargonTerm {
  t: string
  p: string
}

export interface JargonBlock {
  k: 'jargon'
  terms: JargonTerm[]
}

export type DigestBlock =
  | StatsBlock
  | NoteBlock
  | CardsBlock
  | CompareSliderBlock
  | CopyBoxBlock
  | HorizontalBarsBlock
  | RingsBlock
  | SegmentedTabsBlock
  | RoleSwitcherBlock
  | QuizBlock
  | TakeBlock
  | ScrollStoryBlock
  | AskBlock
  | HeatmapBlock
  | AttachmentBlock
  | PluralismBlock
  | JargonBlock

export interface DigestChapter {
  id?: string
  t: string
  l?: string
  alt?: boolean
  draft?: boolean
  approved?: boolean
  b: DigestBlock[]
}

export type DigestHeroArt = 'models' | 'trends' | 'coverage'

export interface Digest {
  id: string
  slug: string
  topic: string
  color: string
  heroArt: DigestHeroArt
  title: string
  pub: string
  mins: number
  kick: string
  h1: string
  lead: string
  facts: [number, string][]
  key: string[]
  credit: string
  sourceUrl: string | null
  pdfUrl: string | null
  ch: DigestChapter[]
  foot: string
  pages: string
}
