A chrome extension that gathers and displays WebRTC stats for the published audio/video streams in real time.

## Description

This Chrome extension detects upstream audio / video streams using `RTCPeerConnections`, and gathers and displays stats in real time with `getStats`. It works on the upstream `RTCPeerConnections` only, to give quality information on the perception remote participants can have of the audio/video streams you publish.

## Installation

Clone the repository, then install the extension, in Chrome:
- go to `chrome://extensions/`
- enable the `Developer mode` if not done already
- click `Load unpacked` and get the local directory where the repository was cloned
