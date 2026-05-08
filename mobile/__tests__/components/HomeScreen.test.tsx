import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'
import { HomeScreen } from '../../src/screens/HomeScreen'

function mockNavigation() {
  return { navigate: jest.fn() } as any
}

describe('HomeScreen', () => {
  it('제목이 렌더링된다', () => {
    render(<HomeScreen navigation={mockNavigation()} />)
    expect(screen.getByText('SmartOCR')).toBeTruthy()
  })

  it('카메라 버튼이 존재한다', () => {
    render(<HomeScreen navigation={mockNavigation()} />)
    expect(screen.getByTestId('camera-button')).toBeTruthy()
  })

  it('갤러리 버튼이 존재한다', () => {
    render(<HomeScreen navigation={mockNavigation()} />)
    expect(screen.getByTestId('gallery-button')).toBeTruthy()
  })

  it('카메라 버튼 클릭 시 Camera 화면으로 이동한다', () => {
    const navigation = mockNavigation()
    render(<HomeScreen navigation={navigation} />)
    fireEvent.press(screen.getByTestId('camera-button'))
    expect(navigation.navigate).toHaveBeenCalledWith('Camera')
  })

  it('갤러리 버튼 클릭 시 Gallery 화면으로 이동한다', () => {
    const navigation = mockNavigation()
    render(<HomeScreen navigation={navigation} />)
    fireEvent.press(screen.getByTestId('gallery-button'))
    expect(navigation.navigate).toHaveBeenCalledWith('Gallery')
  })
})
