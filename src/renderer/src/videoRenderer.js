let videoSource
let videoElement
let canvasElement
let quad = '11'

async function startVideo() {
  const constraints = {
    audio: false, // Disable audio
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: videoSource
      }
    }
  }

  // Create a Stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints)

  // Preview the source in a video element
  videoElement.srcObject = stream
  await videoElement.play()
}

async function stopVideo() {
  videoElement.srcObject = null
}

const paintOnCanvas = () => {
  const FPS = 30
  const ctx = canvasElement.getContext('2d')
  let myTimeout

  const draw = () => {
    // clear the canvas before writing to it.
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)

    // to avoid an ugly closure from the set timeout
    clearTimeout(myTimeout)

    let srcX = 0
    let srcY = 0

    if (quad.toString() == '01') {
      srcX = 0
      srcY = canvasElement.height
    } else if (quad.toString() == '10') {
      srcX = canvasElement.width
      srcY = 0
    } else if (quad.toString() == '11') {
      srcX = videoElement.videoWidth / 2
      srcY = videoElement.videoHeight / 2
    }

    ctx.drawImage(
      videoElement,
      srcX,
      srcY,
      videoElement.videoWidth,
      videoElement.videoHeight,
      0,
      0,
      videoElement.videoWidth,
      videoElement.videoHeight
    )

    myTimeout = setTimeout(draw, 1000 / FPS)
  }
  myTimeout = setTimeout(draw, 1000 / FPS)
}

window.electron.ipcRenderer.on('getVideoSource', function (event, arg) {
  stopVideo()
  videoSource = arg
  startVideo()
  paintOnCanvas()
})

window.electron.ipcRenderer.on('stopVideo', function () {
  stopVideo()
})

window.electron.ipcRenderer.on('getQuad', function (event, arg) {
  quad = arg
})

window.electron.ipcRenderer.on('getMousePosition', function (event, arg) {
  let output = ''

  if (arg.x >= 0 && arg.x <= videoElement.videoWidth / 2) {
    output += '0'
  } else {
    output += '1'
  }

  if (arg.y >= 0 && arg.y <= videoElement.videoHeight / 2) {
    output += '0'
  } else {
    output += '1'
  }

  quad = output
})

window.addEventListener('DOMContentLoaded', () => {
  videoElement = document.querySelector('video')
  canvasElement = document.querySelector('canvas')
})

window.electron.ipcRenderer.on('resizeWindow', (event, args) => {
  canvasElement.width = args[0]
  canvasElement.height = args[1]
})
