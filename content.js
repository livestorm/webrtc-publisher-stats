const inject =
  "(" +
  function () {
    // Pushes every newly created RTCPeerConnection to an array.
    window._webrtc_getstats = Object.assign({}, window._webrtc_getstats, {
      peerConnections: [],
    });

    class customRTCPeerConnection extends RTCPeerConnection {
      constructor(configuration) {
        super(configuration);

        window._webrtc_getstats.peerConnections.push(this);
      }
    }

    window.RTCPeerConnection = customRTCPeerConnection;
  } +
  ")();";

const script = document.createElement("script");
script.textContent = inject;
const parentNode = document.head || document.documentElement;
parentNode.insertBefore(script, parentNode.firstChild);
script.parentNode.removeChild(script);
