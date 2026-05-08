import React, { useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useOCR } from '../hooks/useOCR'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Camera'>
}

export function CameraScreen({ navigation }: Props) {
  const cameraRef = useRef<Camera>(null)
  const device = useCameraDevice('back')
  const { hasPermission, requestPermission } = useCameraPermission()
  const { recognize, status, error } = useOCR()

  React.useEffect(() => {
    if (error) {
      Alert.alert('오류', error)
    }
  }, [error])

  const handleCapture = async () => {
    if (!cameraRef.current) return
    try {
      const photo = await cameraRef.current.takePhoto()
      const imageUri = `file://${photo.path}`
      await recognize(imageUri)
    } catch {
      Alert.alert('오류', '사진 촬영 중 오류가 발생했습니다')
    }
  }

  if (!hasPermission) {
    return (
      <View style={styles.centered} testID="permission-view">
        <Text>카메라 권한이 필요합니다</Text>
        <TouchableOpacity onPress={requestPermission} testID="request-permission-button">
          <Text style={styles.link}>권한 요청</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!device) {
    return (
      <View style={styles.centered} testID="no-device-view">
        <Text>카메라를 찾을 수 없습니다</Text>
      </View>
    )
  }

  return (
    <View style={styles.container} testID="camera-screen">
      <Camera ref={cameraRef} style={styles.camera} device={device} isActive photo />
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCapture}
          disabled={status === 'processing'}
          testID="capture-button"
        >
          <Text style={styles.captureText}>
            {status === 'processing' ? '처리 중...' : '촬영'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#fff',
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureText: { fontWeight: 'bold' },
  link: { color: '#2563EB', marginTop: 12 },
})
