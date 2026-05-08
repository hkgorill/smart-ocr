module.exports = {
  launchImageLibrary: jest.fn().mockResolvedValue({
    assets: [{ uri: 'file:///mock/image.jpg', type: 'image/jpeg', fileName: 'image.jpg' }],
  }),
  launchCamera: jest.fn().mockResolvedValue({
    assets: [{ uri: 'file:///mock/camera.jpg', type: 'image/jpeg', fileName: 'camera.jpg' }],
  }),
}
