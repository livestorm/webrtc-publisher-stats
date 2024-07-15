const domPrefix = 'webrtc-getstats-extension'
const interval = 5 // in seconds

const findCodec = (codecId, codecs) => codecs.find(c => codecId.includes(c.payloadType))

const formatRTT = (number) => {
  return Number.parseFloat(number).toFixed(3)
}

const updateHTML = (stats) => {
  let container = document.querySelector('#' + domPrefix)

  if (!container) {
    container = document.createElement('div')
    container.id = domPrefix
    container.className = domPrefix + '-container'
    const header = document.createElement('div')
    header.className = domPrefix + '-header'
    const title = document.createElement('div')
    title.innerText = 'WebRTC stats'
    const body = document.createElement('div')
    body.className = domPrefix + '-body'

    header.addEventListener('dblclick', (e) => {
      if (body.style.display !== 'none') {
        body.style.display = 'none'
      } else {
        body.style.display = 'block'
      }
    })

    header.appendChild(title)
    container.appendChild(header)
    container.appendChild(body)
    document.body.appendChild(container)
  }

  makeDraggable(container)

  Object.keys(stats).forEach(key => {
    const domElement = document.querySelector(`#${domPrefix} .mediastreamtrack-${key}`)

    if (!domElement) {
      const wrapper = document.createElement('div')

      const labelElem = document.createElement('div')
      labelElem.appendChild(document.createTextNode(`${stats[key].label}`))

      wrapper.classList.add('stream-class')
      wrapper.classList.add(`mediastreamtrack-${key}`)
      wrapper.appendChild(labelElem)

      switch (stats[key].kind) {
        case 'audio': {
          console.log('New DOM element to add of kind audio')
          const audioWrapper = document.createElement('div')
          audioWrapper.classList.add('audio')
          audioWrapper.appendChild(document.createTextNode('Gathering data...'))
          wrapper.appendChild(audioWrapper)
        }
          break
        case 'video': {
          console.log('New DOM element to add of kind video')
          const videoWrapper = document.createElement('div')
          videoWrapper.classList.add('video')
          videoWrapper.appendChild(document.createTextNode('Gathering data...'))
          wrapper.appendChild(videoWrapper)
        }
          break
        default:
          break
      }

      container.querySelector(`.${domPrefix}-body`).appendChild(wrapper)
      return
    }

    const codecElem = document.createElement('div')
    codecElem.appendChild(document.createTextNode(`codec: ${stats[key].codec?.mimeType}`))

    switch (stats[key].kind) {
      case 'audio': {
        const audioBitrate = stats[key].stats.audio.bitrate
        let audioRoundTripTime = 0
        let audioBitrateKbits = 0
        let audioInstantPacketLossPercent = 0
        //    let audioJitter = 0

        if (!isNaN(audioBitrate)) {
          audioBitrateKbits = Math.round(audioBitrate / 1000)
        }

        if (stats[key].stats.audio.roundTripTime && !isNaN(stats[key].stats.audio.roundTripTime)) {
          audioRoundTripTime = formatRTT(stats[key].stats.audio.roundTripTime)
        }

        if (stats[key].stats.audio.instantPacketLossPercent && !isNaN(stats[key].stats.audio.instantPacketLossPercent)) {
          audioInstantPacketLossPercent = Math.round(stats[key].stats.audio.instantPacketLossPercent)
        }

        const rttAudioStatElement = domElement.querySelector('.audio .rtt')
        const bitrateAudioStatElement = domElement.querySelector('.audio .bitrate')

        if (rttAudioStatElement && bitrateAudioStatElement) {
          domElement.querySelector('.audio .rtt').innerText = `RTT / loss: ${audioRoundTripTime}s / ${audioInstantPacketLossPercent}%`
          domElement.querySelector('.audio .bitrate').innerText = `bitrate : ${audioBitrateKbits} kbps`
        } else {
          const audioRoundTripTimeElement = document.createElement('div')
          audioRoundTripTimeElement.classList.add('rtt')
          audioRoundTripTimeElement.appendChild(document.createTextNode(`RTT / loss: ${audioRoundTripTime}s / ${audioInstantPacketLossPercent}%`))
          const audioBitrateElem = document.createElement('div')
          audioBitrateElem.classList.add('bitrate')
          audioBitrateElem.appendChild(document.createTextNode(`bitrate : ${audioBitrateKbits} kbps`))
          domElement.querySelector('.audio').replaceChildren(codecElem, audioRoundTripTimeElement, audioBitrateElem)
        }
      }
        break
      case 'video':
        domElement.querySelector('.video').replaceChildren(codecElem)
        Object.entries(stats[key].stats.video).forEach(([key, value]) => {
          let videoStatElement = domElement.querySelector(`.video .dimensions-${key}`)
          if (!videoStatElement && !isNaN(value.bitrate) && value.bitrate > 0) {
            // Published video switched to another dimension set, need to update
            // and create a new DOM element
            videoStatElement = document.createElement('div')
            videoStatElement.classList.add(`dimensions-${key}`)

            const videoStatTitleElement = document.createElement('div')
            videoStatTitleElement.classList.add('title')
            videoStatTitleElement.appendChild(document.createTextNode(`--- ${key} ---`))

            const videoRoundTripTimeElement = document.createElement('div')
            videoRoundTripTimeElement.classList.add('rtt')
            videoRoundTripTimeElement.appendChild(document.createTextNode(`RTT / loss: ${value.roundTripTime}s / ${Math.round(value.instantPacketLossPercent)}%`))
            let videoBitrateKbits = 0
            videoBitrateKbits = Math.round(value.bitrate / 1000)
            const videoBitrateElement = document.createElement('div')
            videoBitrateElement.classList.add('bitrate')
            videoBitrateElement.appendChild(document.createTextNode(`bitrate : ${videoBitrateKbits} kbps`))

            videoStatElement.appendChild(videoStatTitleElement)
            videoStatElement.appendChild(videoRoundTripTimeElement)
            videoStatElement.appendChild(videoBitrateElement)
            domElement.querySelector('.video').appendChild(videoStatElement)
          } else if (videoStatElement) {
            if (!value.bitrate || value.bitrate <= 0 || isNaN(value.bitrate)) {
              // bitrate set to 0, remove video track stats from the DOM
              videoStatElement.remove()
            } else {
              domElement.querySelector(`.video .dimensions-${key} .rtt`).innerText = `RTT / loss: ${value.roundTripTime}s / ${Math.round(value.instantPacketLossPercent)}%`
              domElement.querySelector(`.video .dimensions-${key} .bitrate`).innerText = `bitrate : ${value.bitrate ? Math.round(value.bitrate / 1000) : 0} kbps`
            }
          }
        })
        break
      default:
        break
    }
  })
}

const clearMediaStreamsFromStats = (stats, activeTracks) => {
  Object.keys(stats).forEach(key => {
    if (!activeTracks.includes(key)) {
      delete stats[key]
      document.querySelector(`#${domPrefix} .mediastreamtrack-${key}`).remove()
    }
  })
}

const loopGetStats = async () => {
  const container = document.querySelector('#' + domPrefix)
  // Change this variable to true if we find at least one RTCRtpSender to display
  let displayContainer = false
  const activeMediaStreamTracks = []

  for (const pc of window._webrtc_getstats.peerConnections) {
    if (pc.iceConnectionState !== 'completed' && pc.iceConnectionState !== 'connected') {
      continue
    }

    // Clone object of the stats before we call getStats on our targets
    let rtcRtpSenderStatsClone = null

    for (const rtcRtpSender of [...pc.getSenders()]) {
      if (!rtcRtpSender?.track) {
        continue
      }

      const mediaStreamTrackId = rtcRtpSender.track?.id
      if (!mediaStreamTrackId) {
        continue
      }

      activeMediaStreamTracks.push(mediaStreamTrackId)

      displayContainer = true

      const rtcRtpSenderStats = window._webrtc_getstats.rtcRtpSenderStats[mediaStreamTrackId]

      if (!rtcRtpSenderStats) {
        window._webrtc_getstats.rtcRtpSenderStats[mediaStreamTrackId] = {
          type: rtcRtpSender.constructor.name,
          kind: rtcRtpSender.track.kind,
          label: rtcRtpSender.track.label,
          stats: {
            audio: {
            },
            video: {
            }
          }
        }

        continue
      }

      rtcRtpSenderStatsClone = JSON.parse(JSON.stringify(rtcRtpSenderStats))

      try {
        const trackStats =
          window._webrtc_getstats.rtcRtpSenderStats[mediaStreamTrackId].stats

        const stats = await rtcRtpSender.getStats()
        const codecs = rtcRtpSender.getParameters()?.codecs || []

        stats.forEach((stat) => {
          switch (stat.type) {
            case 'remote-inbound-rtp': {
              rtcRtpSenderStats.codec = findCodec(stat.codecId, codecs)

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
                    roundTripTime: 0,
                    jitter: 0,
                    bytesSent: 0,
                    bitrate: 0
                  }
                }

                const diffFramesSent = outboundRTPReport.framesSent - trackStats.video[reportVideoIndex].framesSent
                trackStats.video[reportVideoIndex].frameRate = diffFramesSent / interval
                trackStats.video[reportVideoIndex].framesSent = outboundRTPReport.framesSent

                const diffPacketsSent = outboundRTPReport.packetsSent - trackStats.video[reportVideoIndex].packetsSent
                trackStats.video[reportVideoIndex].packetsSent = outboundRTPReport.packetsSent
                const diffPacketsLost = stat.packetsLost - trackStats.video[reportVideoIndex].packetsLost

                trackStats.video[reportVideoIndex].packetsLost = stat.packetsLost
                trackStats.video[reportVideoIndex].instantPacketLossPercent = 100 * diffPacketsLost / diffPacketsSent
                trackStats.video[reportVideoIndex].fractionLost = stat.fractionLost

                trackStats.video[reportVideoIndex].jitter = stat.jitter
                trackStats.video[reportVideoIndex].roundTripTime = formatRTT(stat.roundTripTime)
                trackStats.video[reportVideoIndex].bytesSent = outboundRTPReport.bytesSent
              } else if (stat.kind === 'audio') {
                const diffPacketsSent = outboundRTPReport.packetsSent - trackStats.audio.packetsSent
                trackStats.audio.packetsSent = outboundRTPReport.packetsSent
                const diffPacketsLost = stat.packetsLost - trackStats.audio.packetsLost
                trackStats.audio.packetsLost = stat.packetsLost
                trackStats.audio.instantPacketLossPercent = 100 * diffPacketsLost / diffPacketsSent
                trackStats.audio.fractionLost = stat.fractionLost

                trackStats.audio.jitter = stat.jitter
                trackStats.audio.roundTripTime = formatRTT(stat.roundTripTime)
                trackStats.audio.bytesSent = outboundRTPReport.bytesSent
              }

              break
            }
            default:
              break
          }
        })
      } catch (error) {
        console.log(
          '[webrtc_getstats_extension] Failed to get stats for rtcRtpSender :', error
        )
      }

      if (rtcRtpSenderStats && rtcRtpSenderStatsClone) {
        // Perform computations that need differences
        Object.entries(rtcRtpSenderStats.stats.video).forEach(([key, value]) => {
          if (!rtcRtpSenderStatsClone.stats.video[key]) {
            // No data to compare with
            return
          }
          const diffBytesSent = value.bytesSent - rtcRtpSenderStatsClone.stats.video[key].bytesSent
          value.bitrate = diffBytesSent * 8 / interval
        })

        rtcRtpSenderStats.stats.audio.bitrate = (rtcRtpSenderStats.stats.audio.bytesSent - rtcRtpSenderStatsClone.stats.audio.bytesSent) * 8 / interval
        rtcRtpSenderStats.stats.bitrate = (rtcRtpSenderStats.stats.bytesSent - rtcRtpSenderStatsClone.stats.bytesSent) * 8 / interval
      }
    }
  }

  if (container && container.style) {
    container.style.display = displayContainer ? 'block' : 'none'
  }

  updateHTML(window._webrtc_getstats.rtcRtpSenderStats)

  clearMediaStreamsFromStats(window._webrtc_getstats.rtcRtpSenderStats, activeMediaStreamTracks)

  setTimeout(loopGetStats, interval * 1000)
}

setTimeout(loopGetStats, interval * 1000)

/**
 * The code below make the window draggable
 * Sources :
 * - https://www.w3schools.com/howto/howto_js_draggable.asp
 * - https://stackoverflow.com/questions/48097791/how-to-keep-a-draggable-element-from-being-moved-outside-a-boundary
 */
const PADDING = 0

let rect
const viewport = {
  bottom: 0,
  left: 0,
  right: 0,
  top: 0
}

const makeDraggable = (element) => {
  let pos1 = 0
  let pos2 = 0
  let pos3 = 0
  let pos4 = 0

  if (element.querySelector(`.${domPrefix}-header`)) {
    // if present, the header is where you move the DIV from:
    element.querySelector(`.${domPrefix}-header`).onmousedown = dragMouseDown
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    element.onmousedown = dragMouseDown
  }

  function dragMouseDown (e) {
    e = e || window.event
    e.preventDefault()
    // get the mouse cursor position at startup:
    pos3 = e.clientX
    pos4 = e.clientY

    // store the current viewport and element dimensions when a drag starts
    rect = element.getBoundingClientRect()
    viewport.bottom = window.innerHeight - PADDING
    viewport.left = PADDING
    viewport.right = window.innerWidth - PADDING
    viewport.top = PADDING

    document.onmouseup = closeDragElement
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag
  }

  function elementDrag (e) {
    e = e || window.event
    e.preventDefault()
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY

    // check to make sure the element will be within our viewport boundary
    const newLeft = element.offsetLeft - pos1
    const newTop = element.offsetTop - pos2
    if (newLeft < viewport.left ||
      newTop < viewport.top ||
      newLeft + rect.width > viewport.right ||
      newTop + rect.height > viewport.bottom
    ) {
      // the element will hit the boundary, do nothing...
    } else {
      // set the element's new position:
      element.style.top = (element.offsetTop - pos2) + 'px'
      element.style.left = (element.offsetLeft - pos1) + 'px'
    }
  }

  function closeDragElement () {
    // stop moving when mouse button is released:
    document.onmouseup = null
    document.onmousemove = null
  }
}
