import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>
}

export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SmartOCR</Text>
      <Text style={styles.subtitle}>사진에서 문자를 추출하세요</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Camera')}
        testID="camera-button"
      >
        <Text style={styles.buttonText}>카메라로 촬영</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.galleryButton]}
        onPress={() => navigation.navigate('Gallery')}
        testID="gallery-button"
      >
        <Text style={styles.buttonText}>갤러리에서 선택</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 48 },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  galleryButton: { backgroundColor: '#059669' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
