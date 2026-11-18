export type {
  AnalyticsData,
  CompactAnalyticsData,
  PublishedArticleRecord,
} from '@/lib/adminAnalytics'

export type GoogleStatus =
  | 'loading'
  | 'not_configured'
  | 'error'
  | 'empty'
  | 'ready'

export interface ChannelGroupRow {
  channelGroup: string
  sessions: number
  users: number
  share: number
}

export interface SourceMediumRow {
  sourceMedium: string
  sessions: number
  users: number
  share: number
}

export interface CountryRow {
  country: string
  users: number
  sessions: number
  share: number
}

export interface DeviceCategoryRow {
  deviceCategory: string
  users: number
  sessions: number
  share: number
}

export interface GoogleAnalyticsData {
  status: GoogleStatus
  errorMessage?: string
  totalUsers?: number
  channels: ChannelGroupRow[]
  sources: SourceMediumRow[]
  countries: CountryRow[]
  devices: DeviceCategoryRow[]
}

export interface SearchConsoleTotals {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsoleItem {
  key: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsoleData {
  status: GoogleStatus
  errorMessage?: string
  totals: SearchConsoleTotals
  queries: SearchConsoleItem[]
  pages: SearchConsoleItem[]
}

export interface GoogleDataBundle {
  configured: boolean
  setupStatus: {
    searchConsoleConnected: boolean
    googleAnalyticsConnected: boolean
  }
  ga: GoogleAnalyticsData
  gsc: SearchConsoleData
}
