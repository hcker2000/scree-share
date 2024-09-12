function init() {
  window.addEventListener('DOMContentLoaded', () => {
    getVideoSources()
    setupStartButton()
    setupQuadButtons()
  })
}

function setupStartButton() {
  const button = document.getElementById('startButton')
  button?.addEventListener('click', () => {
    window.electron.ipcRenderer.send('setVideoSource', selectMenu.value)
    window.electron.ipcRenderer.send('showVideoWindow')
  })
}

function setupQuadButtons() {
  const tl = document.getElementById('tl')
  tl?.addEventListener('click', () => {
    window.electron.ipcRenderer.send('setQuad', '00')
  })

  const tr = document.getElementById('tr')
  tr?.addEventListener('click', () => {
    window.electron.ipcRenderer.send('setQuad', '01')
  })

  const bl = document.getElementById('bl')
  bl?.addEventListener('click', () => {
    window.electron.ipcRenderer.send('setQuad', '10')
  })

  const br = document.getElementById('br')
  br?.addEventListener('click', () => {
    window.electron.ipcRenderer.send('setQuad', '11')
  })
}

init()

const selectMenu = document.getElementById('selectMenu')
async function getVideoSources() {
  const inputSources = await window.electron.ipcRenderer.invoke('getSources')

  inputSources.forEach((source) => {
    const element = document.createElement('option')
    element.value = source.id
    element.innerHTML = source.name
    selectMenu.appendChild(element)
  })
}