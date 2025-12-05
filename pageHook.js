(() => {
  window._webrtc_getstats = {
    peerConnections: [],
    rtcRtpSenderStats: {}
  }

  // Pushes every newly created RTCPeerConnection to an array.
  class CustomRTCPeerConnection extends RTCPeerConnection {
    constructor (configuration) {
      console.log('New PeerConnection !')
      super(configuration)
      window._webrtc_getstats.peerConnections.push(this)
    }
  }

  window.RTCPeerConnection = CustomRTCPeerConnection
})()

