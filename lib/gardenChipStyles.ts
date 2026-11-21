// Shared styling constants for Garden hero key category chips and topic strips
// House style: spaced hyphen " - " only

export const HERO_CHIP_BASE =
  'shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#FDF8F1] focus-visible:outline-offset-2'

export const HERO_CHIP_ACTIVE = `${HERO_CHIP_BASE} bg-[#CF3F29] text-white shadow-sm`
export const HERO_CHIP_INACTIVE = `${HERO_CHIP_BASE} bg-white/10 text-[#FDF8F1] hover:bg-white/20 border border-white/10`

export const TOPIC_CHIP_BASE =
  'text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer'

export const TOPIC_ALL_CHIP_ACTIVE = `${TOPIC_CHIP_BASE} bg-[#232536] text-white font-bold`
export const TOPIC_ALL_CHIP_INACTIVE = `${TOPIC_CHIP_BASE} bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]`

export const TOPIC_CHIP_ACTIVE = `${TOPIC_CHIP_BASE} bg-[#2AA198] text-white font-bold`
export const TOPIC_CHIP_INACTIVE = `${TOPIC_CHIP_BASE} bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#2AA198]`

export const TOPIC_STRIP_WRAPPER =
  'bg-[#FAF3E8]/60 border-b border-[#F5ECDE] py-4'

export const TOPIC_STRIP_CONTAINER =
  'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'

export function getHeroChipClass(isActive: boolean): string {
  return isActive ? HERO_CHIP_ACTIVE : HERO_CHIP_INACTIVE
}

export function getTopicAllChipClass(isActive: boolean): string {
  return isActive ? TOPIC_ALL_CHIP_ACTIVE : TOPIC_ALL_CHIP_INACTIVE
}

export function getTopicChipClass(isActive: boolean): string {
  return isActive ? TOPIC_CHIP_ACTIVE : TOPIC_CHIP_INACTIVE
}
