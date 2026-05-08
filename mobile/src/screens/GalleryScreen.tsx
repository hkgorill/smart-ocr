import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { launchImageLibrary } from 'react-native-image-picker'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useOCR } from '../hooks/useOCR'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Gallery'>
}

export function GalleryScreen({ navigation }: Props) {
  const { recognize, status, result, error } = useOCR()

  const handlePickImage = async () => {
    const response = await launchImageLibrary({ mediaType: 'photo' })
    if (response.didCancel || !response.assets?.length) return

    const uri = response.assets[0].uri
    if (!uri) return

    await recognize(uri)
  }

  React.useEffect(() => {
    if (status === 'success' && result) {
      navigation.navigate('Result', { imageUri: '', result })
    }
  }, [status, result, navigation])

  React.useEffect(() => {
    if (error) {
      Alert.alert('OCR 오류', error)
    }
  }, [error])

  return (
    <View style={styles.container} testID="gallery-screen">
      <Text style={styles.title}>갤러리에서 이미지 선택</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePickImage}
        disabled={status === 'processing'}
        testID="pick-image-button"
      >
        <Text style={styles.buttonText}>
          {status === 'processing' ? 'OCR 처리 중...' : '이미지 선택'}
        </Text>
      </TouchableOpacity>
      {status === 'processing' && (
        <Text style={styles.status} testID="processing-indicator">
          문자 인식 중...
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 32 },
  button: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  status: { marginTop: 16, color: '#666' },
})
