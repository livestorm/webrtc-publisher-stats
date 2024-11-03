A chrome extension that gathers and displays WebRTC stats for the published audio/video streams in real time.

## Description

This Chrome extension detects upstream audio / video streams using `RTCPeerConnections`, and gathers and displays stats in real time with `getStats`. It works on the upstream `RTCPeerConnections` only, to give quality information on the perception remote participants can have of the audio/video streams you publish.

![Jitsi example](https://github.com/user-attachments/assets/1e812a4c-9bcc-41b7-9e5d-4e3a02190250)

![Google Meet example](https://github.com/user-attachments/assets/fc4ab079-e2e1-45dd-a1c8-786e2953bd20)

![Livestorm example](https://github.com/user-attachments/assets/507a6dd6-ea81-49ac-b040-021f5a35e19f)

## Installation

Clone the repository, then install the extension, in Chrome:
- go to `chrome://extensions/`
- enable the `Developer mode` if not done already
- click `Load unpacked` and get the local directory where the repository was cloned
