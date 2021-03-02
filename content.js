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

        this._mediaStreamIds = [];

        window._webrtc_getstats.peerConnections.push(this);

        /**
         * DOM <video/> elements play audio/video tracks from local devices
         * (getUserMedia) or from remote peers (RTCPeerConnection.addTrack()).
         * To do do, a MediaStream is set as the 'srcObject' of the <video/>
         * element.
         *
         * A MediaStream has a unique identifier (id), and is composed of audio
         * and video tracks.
         *
         * A track event indicates that a new track has been added to this
         * RTCPeerConnection instance, resulting in audio/video flowing in.
         * Since getRemoteStreams() is being deprecated, we add an object method
         * that retrieves the streams this track is part of so that we can have
         * a match between RTCPeerConnections and DOM <video/> elements.
         */
        this.addEventListener(
          "track",
          (e) => {
            if (!e.streams || e.streams.length < 1) {
              return;
            }

            if (this.iceConnectionState !== "completed") {
              // Track added but PeerConnection is not up
              return;
            }

            // We should get an array of a single element
            this._mediaStreamIds = e.streams.map((elem) => {
              return elem.id;
            });
            console.log(
              "[content.js] this._mediaStreamIds :",
              this._mediaStreamIds
            );
          },
          false
        );
      }

      getMediaStreamIds() {
        return this._mediaStreamIds;
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
