import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
  StyleSheet,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { ResultCard } from '../components/ResultCard'

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>

export function ResultScreen({ route }: Props) {
  const { result } = route.params
  const [editedText, setEditedText] = useState(result.plainText)

  const handleShare = async () => {
    await Share.share({ message: editedText })
  }

  return (
    <ScrollView style={styles.container} testID="result-screen">
      <Text style={styles.sectionTitle}>인식된 블록</Text>
      {result.blocks.map((block, i) => (
        <ResultCard key={i} block={block} />
      ))}

      <Text style={styles.sectionTitle}>전체 텍스트</Text>
      <TextInput
        style={styles.textInput}
        value={editedText}
        onChangeText={setEditedText}
        multiline
        testID="text-editor"
      />

      <TouchableOpacity style={styles.shareButton} onPress={handleShare} testID="share-button">
        <Text style={styles.shareButtonText}>텍스트 공유</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  shareButton: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  shareButtonText: { color: '#fff', fontWeight: '600' },
})
