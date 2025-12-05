// Inject hook script before page scripts so we can override RTCPeerConnection.
const injectedScript = document.createElement('script')
injectedScript.setAttribute('src', chrome.runtime.getURL('pageHook.js'))
injectedScript.addEventListener('load', () => injectedScript.remove())
const parentNode = document.head || document.documentElement
parentNode.insertBefore(injectedScript, parentNode.firstChild)

const mainScript = document.createElement('script')
mainScript.setAttribute('type', 'text/javascript')
mainScript.setAttribute('src', chrome.runtime.getURL('content.js'))
;(document.head || document.documentElement).appendChild(mainScript)
