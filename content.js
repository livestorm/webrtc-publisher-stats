const _dom_prefix = "webrtc-getstats-extension";
const interval = 5; // in seconds

const findDOMElementForTrack = (track) => {
  let foundElement = null;

  document.querySelectorAll("audio, video").forEach((element) => {
    if (!element?.srcObject) {
      return;
    }

    const audioTracksFromDOM = element.srcObject.getAudioTracks();
    const videoTracksFromDOM = element.srcObject.getVideoTracks();

    const foundAudioTrack = audioTracksFromDOM.find((e) => e === track);
    const foundVideoTrack = videoTracksFromDOM.find((e) => e === track);

    if (foundAudioTrack) {
      console.log(
        `Found <${element.tagName} /> DOM element for audio track : `,
        element
      );
      foundElement = element;
      return;
    }

    if (foundVideoTrack) {
      console.log(
        `Found <${element.tagName} /> DOM element for video track : `,
        element
      );
      foundElement = element;
      return;
    }
  });

  return foundElement;
};

const loopGetStats = () => {
  console.log("I would like to get stats from those RTCPeerConnections...");

  if (!window._webrtc_getstats?.peerConnections) {
    return;
  }

  window._webrtc_getstats.peerConnections.forEach(async (pc) => {
    if (pc.iceConnectionState !== "completed") {
      return;
    }

    /**
     * 'transporter' contains either a RTCRtpReceiver or a RTCRtpSender
     */
    for (const transporter of [...pc.getReceivers(), ...pc.getSenders()]) {
      if (!transporter?.track) {
        // No RTCRtpReceiver/RTCRtpSender or MediaTrack, return
        break;
      }

      const element = findDOMElementForTrack(transporter.track);
      if (!element || !element.srcObject) {
        // Cannot find DOM element that matches with MediaTrack
        break;
      }

      let container = document.querySelector(
        "#" + _dom_prefix + "_" + element.srcObject.id
      );

      if (!container) {
        // DOM container not found, create it and insert above its <video />
        // element.
        const container = document.createElement("div");
        container.id = _dom_prefix + "_" + element.srcObject.id;
        container.className = _dom_prefix + "-container";
        element.parentNode.appendChild(container);
      }

      if (!window._webrtc_getstats.transporterStats[element.srcObject.id]) {
        /**
         * Create stats object for transporter :
         * - type : RTCRtpReceiver or RTCRtpSender
         * - identify it with the corresponding MediaStream id in the DOM
         * - store the MediaStream track
         * - gather stats
         */
        window._webrtc_getstats.transporterStats[element.srcObject.id] = {
          type: transporter.constructor.name,
          track: transporter.track,
          stats: {
            audio: {},
            video: {},
          },
        };
      }

      try {
        const trackStats =
          window._webrtc_getstats.transporterStats[element.srcObject.id].stats;

        console.log(
          `[${transporter.track.kind}][${transporter.constructor.name}] stats ------`
        );
        const stats = await transporter.getStats();

        stats.forEach((stat) => {
          switch (stat.type) {
            case "candidate-pair": {
              console.log(
                `[${transporter.track.kind}][${transporter.constructor.name}][${stat.type}] :`,
                stat
              );
              if (stat.nominated) {
                trackStats[transporter.track.kind] = stat.currentRoundTripTime;
                container.innerText = trackStats[transporter.track.kind];
              }
              break;
            }
            default:
              break;
          }
        });

        console.log(
          `[${transporter.track.kind}][${transporter.constructor.name}] element :`,
          element
        );
      } catch (error) {
        console.log(
          "[webrtc_getstats_extension] Failed to get stats for transporter"
        );
      }
    }
  });

  setTimeout(loopGetStats, interval * 1000);
};

setTimeout(loopGetStats, interval * 1000);
