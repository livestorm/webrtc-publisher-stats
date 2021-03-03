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
    if (pc.iceConnectionState === "completed") {
      pc.getReceivers().forEach((receiver) => {
        console.log("receiver :", receiver);

        if (receiver?.track?.kind === "audio") {
          receiver.getStats().then((stats) => {
            console.log("Receiver stats :", stats);
          });
        }
      });

      pc.getSenders().forEach((sender) => {
        console.log("sender :", sender);

        if (sender?.track?.kind === "audio") {
          sender.getStats().then((stats) => {
            console.log("Sender stats :", stats);
          });
        }
      });
    }
  });

  setTimeout(loopGetStats, interval * 1000);
};

setTimeout(loopGetStats, interval * 1000);
