export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface OCRBlock {
  text: string
  confidence: number
  bbox: BoundingBox
}

export interface OCRResult {
  blocks: OCRBlock[]
  plainText: string
  processedAt: string
}

export interface HistoryItem {
  id: string
  imageUri: string
  result: OCRResult
  createdAt: string
}

export type OCRLanguage = 'ko' | 'en' | 'ko+en'

export interface OCROptions {
  language: OCRLanguage
  confidenceThreshold: number
}
