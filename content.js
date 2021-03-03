const interval = 5; // in seconds

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
};

setTimeout(loopGetStats, interval * 1000);
