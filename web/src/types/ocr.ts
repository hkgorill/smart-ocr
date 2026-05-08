export interface OCRBlock {
  text: string
  confidence: number
  bbox: number[][]  // [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
}

export interface OCRResponse {
  task_id: string
  status: 'done' | 'failed'
  result: OCRBlock[]
  plain_text: string
}

export interface BatchResponse {
  task_id: string
  status: 'pending'
  message: string
}

export interface TaskStatus {
  task_id: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  result?: OCRBlock[][]
  error?: string
}
