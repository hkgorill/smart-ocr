import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  loadHistory,
  saveHistoryItem,
  deleteHistoryItem,
  clearHistory,
} from '../../src/store/historyStore'

const mockOCRResult = {
  blocks: [{ text: '테스트', confidence: 0.9, bbox: { x: 0, y: 0, width: 50, height: 20 } }],
  plainText: '테스트',
  processedAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  ;(AsyncStorage.clear as jest.Mock).mockClear()
  ;(AsyncStorage.getItem as jest.Mock).mockReset()
  ;(AsyncStorage.setItem as jest.Mock).mockReset()
  ;(AsyncStorage.removeItem as jest.Mock).mockReset()
  ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
})

describe('loadHistory', () => {
  it('저장된 내역이 없으면 빈 배열을 반환한다', async () => {
    const history = await loadHistory()
    expect(history).toEqual([])
  })

  it('저장된 내역을 파싱해서 반환한다', async () => {
    const stored = JSON.stringify([{ id: '1', imageUri: 'file:///img.jpg', result: mockOCRResult, createdAt: '2024-01-01' }])
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(stored)
    const history = await loadHistory()
    expect(history).toHaveLength(1)
    expect(history[0].id).toBe('1')
  })

  it('파싱 오류 시 빈 배열을 반환한다', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json{')
    const history = await loadHistory()
    expect(history).toEqual([])
  })
})

describe('saveHistoryItem', () => {
  it('새 항목을 저장하고 반환한다', async () => {
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
    const item = await saveHistoryItem('file:///test.jpg', mockOCRResult)
    expect(item.id).toBeTruthy()
    expect(item.imageUri).toBe('file:///test.jpg')
    expect(item.result).toEqual(mockOCRResult)
    expect(AsyncStorage.setItem).toHaveBeenCalled()
  })

  it('새 항목이 목록 앞에 추가된다', async () => {
    const existing = [{ id: 'old', imageUri: 'file:///old.jpg', result: mockOCRResult, createdAt: '2024-01-01' }]
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing))
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

    await saveHistoryItem('file:///new.jpg', mockOCRResult)

    const [, saved] = (AsyncStorage.setItem as jest.Mock).mock.calls[0]
    const parsed = JSON.parse(saved)
    expect(parsed[0].imageUri).toBe('file:///new.jpg')
    expect(parsed[1].id).toBe('old')
  })
})

describe('deleteHistoryItem', () => {
  it('특정 ID의 항목을 삭제한다', async () => {
    const existing = [
      { id: 'keep', imageUri: 'file:///a.jpg', result: mockOCRResult, createdAt: '2024-01-01' },
      { id: 'delete-me', imageUri: 'file:///b.jpg', result: mockOCRResult, createdAt: '2024-01-02' },
    ]
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing))
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

    await deleteHistoryItem('delete-me')

    const [, saved] = (AsyncStorage.setItem as jest.Mock).mock.calls[0]
    const parsed = JSON.parse(saved)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe('keep')
  })
})

describe('clearHistory', () => {
  it('모든 내역을 삭제한다', async () => {
    ;(AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined)
    await clearHistory()
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('ocr_history')
  })
})
