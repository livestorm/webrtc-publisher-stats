const _dom_prefix = "webrtc-getstats-extension"
const interval = 5 // in seconds

const findDOMElementForTrack = (track) => {
  let foundElement = null

  document.querySelectorAll("audio, video").forEach((element) => {
    if (!element?.srcObject) {
      return
    }

    const audioTracksFromDOM = element.srcObject.getAudioTracks()
    const videoTracksFromDOM = element.srcObject.getVideoTracks()

    const foundAudioTrack = audioTracksFromDOM.find((e) => e === track)
    const foundVideoTrack = videoTracksFromDOM.find((e) => e === track)

    if (foundAudioTrack) {
//       console.log(
//         `Found <${element.tagName} /> DOM element for audio track : `,
//         element, track
//       )
      foundElement = element
      return
    }

    if (foundVideoTrack) {
//       console.log(
//         `Found <${element.tagName} /> DOM element for video track : `,
//         element, track
//       )
      foundElement = element
      return
    }
  })

  return foundElement
}

const loopGetStats = async () => {
  if (!window._webrtc_getstats?.peerConnections) {
    return
  }

  for (const pc of window._webrtc_getstats.peerConnections) {
    if (pc.iceConnectionState !== "completed" && pc.iceConnectionState !== "connected") {
      continue
    }

    for (const rtcRtpSender of [...pc.getSenders()]) {
      if (!rtcRtpSender?.track) {
        continue
      }

      const element = findDOMElementForTrack(rtcRtpSender.track)
      if (!element || !element.srcObject) {
        // Cannot find DOM element that matches with MediaTrack
        continue
      }

//       let container = document.querySelector(
//         "#" + _dom_prefix + "_" + element.srcObject.id
//       )
// 
//       if (!container) {
//         // DOM container not found, create it and insert above its <video />
//         // element.
//         const container = document.createElement("div")
//         container.id = _dom_prefix + "_" + element.srcObject.id
//         container.className = _dom_prefix + "-container"
//         element.parentNode.appendChild(container)
//       }

      if (!window._webrtc_getstats.rtcRtpSenderStats[element.srcObject.id]) {
        /**
         * Create stats object for rtcRtpSender :
         * - type : RTCRtpReceiver or RTCRtpSender
         * - identify it with the corresponding MediaStream id in the DOM
         * - store the MediaStream track
         * - gather stats
         */
        window._webrtc_getstats.rtcRtpSenderStats[element.srcObject.id] = {
          type: rtcRtpSender.constructor.name,
          stats: {
            rtt: 0,
            bytesSent: 0,
            bitrate: 0,
            availableOutgoingBitrate: 0,
            audio: {
            },
            video: {
            },
          }
        }
      }

      try {
        const trackStats =
          window._webrtc_getstats.rtcRtpSenderStats[element.srcObject.id].stats

        console.log(
          `[${rtcRtpSender.track.kind}][${rtcRtpSender.constructor.name}] stats ------`
        )
        const stats = await rtcRtpSender.getStats()

        stats.forEach((stat) => {
          switch (stat.type) {
            case "remote-inbound-rtp": {
              const outboundRTPReport = stats.get(stat.localId)
              if (stat.kind === 'video' && outboundRTPReport?.frameHeight) {
                const reportVideoIndex = `${outboundRTPReport.frameWidth}x${outboundRTPReport.frameHeight}`

                if (!trackStats.video[reportVideoIndex]) {
                  trackStats.video[reportVideoIndex] = {
                    framesSent: 0,
                    frameRate: 0,
                    packetsSent: 0,
                    packetsLost: 0,
                    instantPacketLossPercent: 0,
                    fractionLost: 0,
                    jitter: 0,
                    bytesSent: 0,
                    bitrate: 0,
                  }
                }

                const diffFramesSent = outboundRTPReport.framesSent-trackStats.video[reportVideoIndex].framesSent
                trackStats.video[reportVideoIndex].frameRate=diffFramesSent/interval
                trackStats.video[reportVideoIndex].framesSent = outboundRTPReport.framesSent

                const diffPacketsSent = outboundRTPReport.packetsSent-trackStats.video[reportVideoIndex].packetsSent
                trackStats.video[reportVideoIndex].packetsSent = outboundRTPReport.packetsSent
                const diffPacketsLost = stat.packetsLost-trackStats.video[reportVideoIndex].packetsLost

                trackStats.video[reportVideoIndex].packetsLost = stat.packetsLost
                trackStats.video[reportVideoIndex].instantPacketLossPercent = 100*diffPacketsLost/diffPacketsSent
                trackStats.video[reportVideoIndex].fractionLost = stat.fractionLost

                trackStats.video[reportVideoIndex].jitter = stat.jitter
                trackStats.video[reportVideoIndex].roundTripTime = stat.roundTripTime

                const diffBytesSent = outboundRTPReport.bytesSent-trackStats.video[reportVideoIndex].bytesSent
                trackStats.video[reportVideoIndex].bitrate = diffBytesSent*8/interval
                trackStats.video[reportVideoIndex].bytesSent = outboundRTPReport.bytesSent
              } else if (stat.kind === 'audio') {
                const diffPacketsSent = outboundRTPReport.packetsSent-trackStats.audio.packetsSent
                trackStats.audio.packetsSent = outboundRTPReport.packetsSent
                const diffPacketsLost = stat.packetsLost-trackStats.audio.packetsLost
                trackStats.audio.packetsLost = stat.packetsLost
                trackStats.audio.instantPacketLossPercent = 100*diffPacketsLost/diffPacketsSent
                trackStats.audio.fractionLost = stat.fractionLost

                trackStats.audio.jitter = stat.jitter
                trackStats.audio.roundTripTime = stat.roundTripTime
                const diffBytesSent = outboundRTPReport.bytesSent-trackStats.audio.bytesSent
                trackStats.audio.bitrate = diffBytesSent*8/interval
                trackStats.audio.bytesSent = outboundRTPReport.bytesSent
              }

              break
            }
            case "candidate-pair": {
              console.log(
                `[${rtcRtpSender.track.kind}][${rtcRtpSender.constructor.name}][${stat.type}] :`,
                stat
              )
              if (stat.nominated && rtcRtpSender.track.kind === 'audio') {
                // The values found in the 'candidate-pair' report are the
                // same in both 'audio' and 'video' tracks. If we want to
                // compute the bitrate, we must extract and store the
                // 'bytesSent' out of one of the two kinds
                console.log('stat.bytesSent :', stat.bytesSent)
                console.log('trackStats.bytesSent :', trackStats.bytesSent)
                trackStats.rtt = stat.currentRoundTripTime
                const diffBytesSent = stat.bytesSent-trackStats.bytesSent
                trackStats.bitrate = diffBytesSent*8/interval
                trackStats.bytesSent = stat.bytesSent
                trackStats.availableOutgoingBitrate = stat.availableOutgoingBitrate
              }
              break
            }
            default:
              break
          }
        })

//         console.log(
//           `[${rtcRtpSender.track.kind}][${rtcRtpSender.constructor.name}] element :`,
//           element
//         )
      } catch (error) {
        console.log(
          "[webrtc_getstats_extension] Failed to get stats for rtcRtpSender :", error
        )
      }
    }
  }

  setTimeout(loopGetStats, interval * 1000)
}

setTimeout(loopGetStats, interval * 1000)
