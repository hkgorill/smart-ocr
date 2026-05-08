import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { HomeScreen } from '../screens/HomeScreen'
import { CameraScreen } from '../screens/CameraScreen'
import { GalleryScreen } from '../screens/GalleryScreen'
import { ResultScreen } from '../screens/ResultScreen'
import { OCRResult } from '../types/ocr'

export type RootStackParamList = {
  Home: undefined
  Camera: undefined
  Gallery: undefined
  Result: { imageUri: string; result: OCRResult }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'SmartOCR' }} />
      <Stack.Screen name="Camera" component={CameraScreen} options={{ title: '카메라 OCR' }} />
      <Stack.Screen name="Gallery" component={GalleryScreen} options={{ title: '갤러리' }} />
      <Stack.Screen name="Result" component={ResultScreen} options={{ title: '인식 결과' }} />
    </Stack.Navigator>
  )
}
