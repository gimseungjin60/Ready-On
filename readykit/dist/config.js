// Host integration: configure before app.mjs executes. No secret keys belong here.
window.READYKIT_CONFIG = {
  ...window.READYKIT_CONFIG,
  // kakaoJavaScriptKey: 'YOUR_PUBLIC_KAKAO_JAVASCRIPT_KEY',
  // photonBaseUrl: 'https://your-photon-server.example', // optional geocoder
  // parentOrigin: 'https://your-existing-site.example',
  // onChange: result => {},
  // onSelect: result => {},
};
