const React = require('react')

const Camera = React.forwardRef(({ children }, ref) => {
  React.useImperativeHandle(ref, () => ({
    takePhoto: jest.fn().mockResolvedValue({ path: '/mock/photo.jpg' }),
  }))
  return React.createElement('View', { testID: 'camera' }, children)
})
Camera.displayName = 'Camera'

module.exports = {
  Camera,
  useCameraDevice: jest.fn(() => ({ id: 'mock-device', position: 'back' })),
  useCameraPermission: jest.fn(() => ({
    hasPermission: true,
    requestPermission: jest.fn().mockResolvedValue(true),
  })),
}
