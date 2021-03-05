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
        `Found <${element.tagName} /> DOM element for audio track : `,
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

    for (const receiver of pc.getReceivers()) {
      if (!receiver?.track) {
        // No RTCRtpReceiver or MediaTrack, return
        return;
      }

      const element = findDOMElementForTrack(receiver.track);
      if (!element || !element.srcObject) {
        // Cannot find DOM element that matches with MediaTrack
        return;
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
        element.parentNode.insertBefore(container, element);
      }

      if (!window._webrtc_getstats.receiverStats[element.srcObject.id]) {
        /**
         * Create stats object for receiver :
         * - identify it with the corresponding MediaStream id in the DOM
         * - store the MediaStream track
         * - gather stats
         */
        window._webrtc_getstats.receiverStats[element.srcObject.id] = {
          track: receiver.track,
          stats: {
            audio: {},
            video: {},
          },
        };
      }

      try {
        const trackStats =
          window._webrtc_getstats.receiverStats[element.srcObject.id].stats;

        console.log(`[${receiver.track.kind}][Receiver] stats ------`);
        const stats = await receiver.getStats();

        stats.forEach((stat) => {
          switch (stat.type) {
            case "candidate-pair": {
              console.log(
                `[${receiver.track.kind}][Receiver][${stat.type}] :`,
                stat
              );
              if (stat.nominated) {
                trackStats[receiver.track.kind] = stat.currentRoundTripTime;
                container.innerText = trackStats[receiver.track.kind];
              }
              break;
            }
            default:
              break;
          }
        });

        console.log(`[${receiver.track.kind}][Receiver] element :`, element);
      } catch (error) {
        console.log(
          "[webrtc_getstats_extension] Failed to get stats for receiver"
        );
      }
    }

    for (const sender of pc.getSenders()) {
      console.log("sender :", sender);
      if (!sender?.track) {
        // No RTCRtpSender or MediaTrack, return
        return;
      }

      const element = findDOMElementForTrack(sender.track);
      if (!element || !element.srcObject) {
        // Cannot find DOM element that matches with MediaTrack
        return;
      }

      let container = document.querySelector(
        "#" + _dom_prefix + "_" + element.srcObject.id
      );

      if (!container) {
        // DOM container not found, create it and insert above its <video />
        // element.
        container = document.createElement("div");
        container.id = _dom_prefix + "_" + element.srcObject.id;
        container.className = _dom_prefix + "-container";
        element.parentNode.insertBefore(container, element);
      }

      if (!window._webrtc_getstats.senderStats[element.srcObject.id]) {
        /**
         * Create stats object for sender :
         * - identify it with the corresponding MediaStream id in the DOM
         * - store the MediaStream track
         * - gather stats
         */
        window._webrtc_getstats.senderStats[element.srcObject.id] = {
          track: sender.track,
          stats: {
            audio: {},
            video: {},
          },
        };
      }

      try {
        const trackStats =
          window._webrtc_getstats.senderStats[element.srcObject.id].stats;

        console.log(`[${sender.track.kind}][Sender] stats ------`);
        const stats = await sender.getStats();

        stats.forEach((stat) => {
          switch (stat.type) {
            case "candidate-pair": {
              console.log(
                `[${sender.track.kind}][Sender][${stat.type}] :`,
                stat
              );
              if (stat.nominated) {
                trackStats[sender.track.kind] = stat.currentRoundTripTime;
                container.innerText = trackStats[sender.track.kind];
              }
              break;
            }
            default:
              break;
          }
        });

        console.log(`[${sender.track.kind}][Sender] element :`, element);
      } catch (error) {
        console.log(
          "[webrtc_getstats_extension] Failed to get stats for sender"
        );
      }
    }
  });

  setTimeout(loopGetStats, interval * 1000);
};

setTimeout(loopGetStats, interval * 1000);
