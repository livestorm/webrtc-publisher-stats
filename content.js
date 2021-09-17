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

const updateHTML = (stats) => {
  let container = document.querySelector("#" + _dom_prefix)

  if (!container) {
    container = document.createElement("div")
    container.id = _dom_prefix
    container.className = _dom_prefix + "-container"
    document.body.appendChild(container)
  }

  Object.keys(stats).forEach(key => {
    let domElement = document.querySelector(`#${_dom_prefix} .mediastreamid-${key}`)

    const bitrate = stats[key].stats.bitrate
    const availableOutgoingBitrate = stats[key].stats.availableOutgoingBitrate
    const audioBitrate = stats[key].stats.audio.bitrate
    let bitrateKbits = 0
    let availableOutgoingBitrateKbits = 0
    let audioBitrateKbits = 0

    if (!isNaN(bitrate)) {
      bitrateKbits = Math.round(bitrate/1000)
    }

    if (!isNaN(availableOutgoingBitrate)) {
      availableOutgoingBitrateKbits = Math.round(availableOutgoingBitrate/1000)
    }

    if (!isNaN(audioBitrate)) {
      audioBitrateKbits = Math.round(audioBitrate/1000)
    }

    if (!domElement) {
      const wrapper = document.createElement('div') 
      wrapper.classList.add(`stream-class`)
      wrapper.classList.add(`mediastreamid-${key}`)

      const rtt = document.createElement('div')
      rtt.classList.add('rtt')
      rtt.appendChild(document.createTextNode(`RTT : ${stats[key].stats.rtt}s`))

      const bitrate = document.createElement('div')
      bitrate.classList.add('bitrate')
      bitrate.appendChild(document.createTextNode(`bitrate : ${bitrateKbits} kbps`))

      const availableOutgoingBitrate = document.createElement('div')
      availableOutgoingBitrate.classList.add('availableOutgoingBitrate')
      availableOutgoingBitrate.appendChild(document.createTextNode(`available bitrate : ${availableOutgoingBitrateKbits} kbps`))

      const audioInstantPacketLossPercent = stats[key].stats.audio.instantPacketLossPercent
      const audioWrapper = document.createElement('div')
      audioWrapper.classList.add('audio')

      const audioInstantPacketLossPercentElem = document.createElement('div')
      audioInstantPacketLossPercentElem.classList.add('instant-packet-loss-percent')
      audioInstantPacketLossPercentElem.appendChild(document.createTextNode(`audio loss : ${Math.round(audioInstantPacketLossPercent)}%`))
      const audioBitrateElem = document.createElement('div')
      audioBitrateElem.classList.add('bitrate')
      audioBitrateElem.appendChild(document.createTextNode(`audio bitrate : ${audioBitrateKbits} kbps`))

      audioWrapper.appendChild(audioBitrateElem)
      audioWrapper.appendChild(audioInstantPacketLossPercentElem)

      const videoWrapper = document.createElement('div')
      videoWrapper.classList.add('video')
      Object.entries(stats[key].stats.video).forEach(([key, value]) => {
        const videoStatElement = document.createElement('div')
        videoStatElement.classList.add(`dimensions-${key}`)

        const videoStatTitleElement = document.createElement('div')
        videoStatTitleElement.classList.add(`title`)
        videoStatTitleElement.appendChild(document.createTextNode(`--- ${key} ---`)) 

        const videoRoundTripTimeElement = document.createElement('div')
        videoRoundTripTimeElement.classList.add('rtt')
        videoRoundTripTimeElement.appendChild(document.createTextNode(`RTT : ${value.roundTripTime}s`)) 
        const videoLossElement = document.createElement('div')
        videoLossElement.classList.add('instant-packet-loss-percent')
        videoLossElement.appendChild(document.createTextNode(`video loss : ${Math.round(value.instantPacketLossPercent)}%`)) 
        const videoJitterElement = document.createElement('div')
        videoJitterElement.classList.add('jitter')
        videoJitterElement.appendChild(document.createTextNode(`video jitter : ${value.jitter.toFixed(3)}`)) 
        let videoBitrateKbits = 0
        if (!isNaN(value.bitrate)) {
          videoBitrateKbits = Math.round(value.bitrate/1000)
        }
        const videoBitrateElement = document.createElement('div')
        videoBitrateElement.classList.add('bitrate')
        videoBitrateElement.appendChild(document.createTextNode(`video bitrate : ${videoBitrateKbits} kbps`)) 

        videoStatElement.appendChild(videoStatTitleElement)
        videoStatElement.appendChild(videoRoundTripTimeElement)
        videoStatElement.appendChild(videoBitrateElement)
        videoStatElement.appendChild(videoLossElement)
        videoStatElement.appendChild(videoJitterElement)
        videoWrapper.appendChild(videoStatElement)
      })

      wrapper.appendChild(rtt)
      wrapper.appendChild(availableOutgoingBitrate)
      wrapper.appendChild(bitrate)
      wrapper.appendChild(audioWrapper)
      wrapper.appendChild(videoWrapper)
      container.appendChild(wrapper)
      return
    }

    domElement.querySelector('.rtt').innerText = `RTT : ${stats[key].stats.rtt}s`
    domElement.querySelector('.availableOutgoingBitrate').innerText = `available bitrate : ${availableOutgoingBitrateKbits} kbps`
    domElement.querySelector('.bitrate').innerText = `bitrate : ${bitrateKbits} kbps`
    domElement.querySelector('.audio .bitrate').innerText = `audio bitrate : ${stats[key].stats.audio.bitrate ? Math.round(stats[key].stats.audio.bitrate/1000) : 0} kbps`
    domElement.querySelector('.audio .instant-packet-loss-percent').innerText = `audio loss : ${Math.round(stats[key].stats.audio.instantPacketLossPercent)}%`
    Object.entries(stats[key].stats.video).forEach(([key, value]) => {
      let videoStatElement = domElement.querySelector(`.video .dimensions-${key}`)
      if (!videoStatElement) {
        // Published video switched to another dimension set, need to update
        // and create a new DOM element
        videoStatElement = document.createElement('div')
        videoStatElement.classList.add(`dimensions-${key}`)

        const videoStatTitleElement = document.createElement('div')
        videoStatTitleElement.classList.add(`title`)
        videoStatTitleElement.appendChild(document.createTextNode(`--- ${key} ---`)) 

        const videoRoundTripTimeElement = document.createElement('div')
        videoRoundTripTimeElement.classList.add('rtt')
        videoRoundTripTimeElement.appendChild(document.createTextNode(`RTT : ${value.roundTripTime}s`)) 
        const videoLossElement = document.createElement('div')
        videoLossElement.classList.add('instant-packet-loss-percent')
        videoLossElement.appendChild(document.createTextNode(`video loss : ${Math.round(value.instantPacketLossPercent)}%`)) 
        const videoJitterElement = document.createElement('div')
        videoJitterElement.classList.add('jitter')
        videoJitterElement.appendChild(document.createTextNode(`video jitter : ${value.jitter.toFixed(3)}`)) 
        let videoBitrateKbits = 0
        if (!isNaN(value.bitrate)) {
          videoBitrateKbits = Math.round(value.bitrate/1000)
        }
        const videoBitrateElement = document.createElement('div')
        videoBitrateElement.classList.add('bitrate')
        videoBitrateElement.appendChild(document.createTextNode(`video bitrate : ${videoBitrateKbits} kbps`)) 

        videoStatElement.appendChild(videoStatTitleElement)
        videoStatElement.appendChild(videoRoundTripTimeElement)
        videoStatElement.appendChild(videoBitrateElement)
        videoStatElement.appendChild(videoLossElement)
        videoStatElement.appendChild(videoJitterElement)
        domElement.querySelector('.video').appendChild(videoStatElement)
      } else {
        domElement.querySelector(`.video .dimensions-${key} .rtt`).innerText = `RTT : ${value.roundTripTime}s`
        domElement.querySelector(`.video .dimensions-${key} .instant-packet-loss-percent`).innerText = `video loss : ${Math.round(value.instantPacketLossPercent)}%`
        domElement.querySelector(`.video .dimensions-${key} .jitter`).innerText = `video jitter : ${value.jitter.toFixed(3)}`
        domElement.querySelector(`.video .dimensions-${key} .bitrate`).innerText = `video bitrate : ${value.bitrate ? Math.round(value.bitrate/1000) : 0} kbps`
      }
    })
  })
}

const clearMediaStreamsFromStats = (stats) => {
  Object.keys(stats).forEach(key => {
    let trackExistsInDOM = false
    document.querySelectorAll("audio, video").forEach((element) => {
      if (!element?.srcObject) {
        return
      }

      if (element.srcObject.id === key) {
        trackExistsInDOM = true
      }
    })

    if (!trackExistsInDOM) {
      delete stats[key]
      document.querySelector(`#${_dom_prefix} .mediastreamid-${key}`).remove()
    }
  })
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

  updateHTML(window._webrtc_getstats.rtcRtpSenderStats)

  clearMediaStreamsFromStats(window._webrtc_getstats.rtcRtpSenderStats)

  setTimeout(loopGetStats, interval * 1000)
}

setTimeout(loopGetStats, interval * 1000)
