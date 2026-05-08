import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { OCRBlock } from '../types/ocr'

interface Props {
  block: OCRBlock
}

export function ResultCard({ block }: Props) {
  const confidencePct = Math.round(block.confidence * 100)
  const confidenceColor = block.confidence >= 0.8 ? '#059669' : block.confidence >= 0.6 ? '#D97706' : '#DC2626'

  return (
    <View style={styles.card} testID="result-card">
      <Text style={styles.text} testID="block-text">
        {block.text}
      </Text>
      <Text style={[styles.confidence, { color: confidenceColor }]} testID="block-confidence">
        신뢰도: {confidencePct}%
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  text: { fontSize: 15, marginBottom: 4 },
  confidence: { fontSize: 12, fontWeight: '600' },
})
