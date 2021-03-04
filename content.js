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
        if (receiver?.track) {
          console.log(`[${receiver.track.kind}][Receiver] stats ------`);
          receiver.getStats().then((stats) => {
            stats.forEach((stat) => {
              stat.type == "candidate-pair" &&
                stat.nominated &&
                console.log(
                  "stat.currentRoundTripTime :",
                  stat.currentRoundTripTime
                );
            });
          });

          const element = findDOMElementForTrack(receiver.track);
          const div = document.createElement("div");
          div.innerText = "Audio";

          if (element) {
            element.parentNode.insertBefore(div, element);
          }

          console.log(`[${receiver.track.kind}][Receiver] element :`, element);
        }
      });

      pc.getSenders().forEach((sender) => {
        console.log("sender :", sender);

        if (sender?.track) {
          console.log(`[${sender.track.kind}][Sender] stats ------`);
          console.log(
            `[${sender.track.kind}][Sender] sender.track :`,
            sender.track
          );
          sender.getStats().then((stats) => {
            console.log(`[${sender.track.kind}][Sender] stats :`, stats);
            stats.forEach((stat) => {
              stat.type == "candidate-pair" &&
                stat.nominated &&
                console.log(
                  "stat.currentRoundTripTime :",
                  stat.currentRoundTripTime
                );
            });
          });

          const element = findDOMElementForTrack(sender.track);
          const div = document.createElement("div");
          div.innerText = "Video";

          if (element) {
            //            element.parentNode.insertBefore(div, element);
          }

          console.log(`[${sender.track.kind}][Sender] element :`, element);
        }
      });
    }
  });

  setTimeout(loopGetStats, interval * 1000);
};

setTimeout(loopGetStats, interval * 1000);
