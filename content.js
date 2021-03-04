const _dom_prefix = "webrtc-getstats-extension";
const interval = 5; // in seconds

const findDOMElementForTrack = (track) => {
  let foundElement = null;

  document.querySelectorAll("video").forEach((element) => {
    if (!element?.srcObject) {
      return;
    }

    const audioTracksFromDOM = element.srcObject.getAudioTracks();
    const videoTracksFromDOM = element.srcObject.getVideoTracks();

    const foundAudioTrack = audioTracksFromDOM.find((e) => e === track);
    const foundVideoTrack = videoTracksFromDOM.find((e) => e === track);

    if (foundAudioTrack) {
      console.log("Found DOM element for audio track : ", element);
      foundElement = element;
      return;
    }

    if (foundVideoTrack) {
      console.log("Found DOM element for video track : ", element);
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

  window._webrtc_getstats.peerConnections.forEach((pc) => {
    if (pc.iceConnectionState !== "completed") {
      return;
    }

    pc.getReceivers().forEach((receiver) => {
      if (!receiver?.track) {
        // No RTCRtpReceiver or MediaTrack, return
        return;
      }

      const element = findDOMElementForTrack(receiver.track);
      if (!element) {
        // Cannot find DOM element that matches with MediaTrack
        return;
      }

      const container = document.createElement("div");
      container.className = _dom_prefix + "-container";
      container.innerText = "Audio";

      const trackStats = {
        audio: {},
        video: {},
      };

      console.log(`[${receiver.track.kind}][Receiver] stats ------`);
      receiver.getStats().then((stats) => {
        stats.forEach((stat) => {
          switch (stat.type) {
            case "candidate-pair": {
              if (stat.nominated) {
                trackStats[receiver.track.kind] = stat.currentRoundTripTime;
              }
              break;
            }
            default:
              break;
          }
        });
      });

      if (
        element &&
        !element.parentNode.querySelector("." + container.className)
      ) {
        element.parentNode.insertBefore(container, element);
      }

      console.log(`[${receiver.track.kind}][Receiver] element :`, element);
    });

    pc.getSenders().forEach((sender) => {
      console.log("sender :", sender);
      if (!sender?.track) {
        // No RTCRtpSender or MediaTrack, return
        return;
      }

      const element = findDOMElementForTrack(sender.track);
      if (!element) {
        // Cannot find DOM element that matches with MediaTrack
        return;
      }

      const container = document.createElement("div");
      container.className = _dom_prefix + "-container";
      container.innerText = "Video";

      const trackStats = {
        audio: {},
        video: {},
      };

      console.log(`[${sender.track.kind}][Sender] stats ------`);
      console.log(
        `[${sender.track.kind}][Sender] sender.track :`,
        sender.track
      );
      sender.getStats().then((stats) => {
        console.log(`[${sender.track.kind}][Sender] stats :`, stats);
        stats.forEach((stat) => {
          switch (stat.type) {
            case "candidate-pair": {
              if (stat.nominated) {
                trackStats[sender.track.kind] = stat.currentRoundTripTime;
              }
              break;
            }
            default:
              break;
          }
        });
      });

      if (
        element &&
        !element.parentNode.querySelector("." + container.className)
      ) {
        element.parentNode.insertBefore(container, element);
      }

      console.log(`[${sender.track.kind}][Sender] element :`, element);
    });
  });

  setTimeout(loopGetStats, interval * 1000);
};

setTimeout(loopGetStats, interval * 1000);
