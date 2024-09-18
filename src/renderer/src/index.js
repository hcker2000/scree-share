function init() {
  const toggleDarkMode = (value) => {
    const htmlElemenet = document.documentElement
    if (value == true) {
      htmlElemenet.setAttribute('data-bs-theme', 'dark')
    } else {
      htmlElemenet.setAttribute('data-bs-theme', 'light')
    }
  }

  let followMouseInput
  let showRegionInput
  let darkModeInput

  window.electron.ipcRenderer.on('getFollowMouse', (event, arg) => {
    followMouseInput.checked = arg
  })

  window.electron.ipcRenderer.on('getShowRegion', (event, arg) => {
    showRegionInput.checked = arg
  })

  window.electron.ipcRenderer.on('getDarkMode', (event, arg) => {
    darkModeInput.checked = arg
    toggleDarkMode(arg)
  })

  window.addEventListener('DOMContentLoaded', () => {
    getVideoSources()
    setupStartButton()
    setupQuadButtons()

    followMouseInput = document.getElementById('followMouse')
    followMouseInput?.addEventListener('click', (event) => {
      window.electron.ipcRenderer.send('setFollowMouse', event.target.checked)
    })

    showRegionInput = document.getElementById('showRegion')
    showRegionInput?.addEventListener('click', (event) => {
      window.electron.ipcRenderer.send('setShowRegion', event.target.checked)
    })

    darkModeInput = document.getElementById('darkMode')
    darkModeInput?.addEventListener('click', (event) => {
      window.electron.ipcRenderer.send('setDarkMode', event.target.checked)
      toggleDarkMode(event.target.checked)
    })
  })
}

function setupStartButton() {
  const button = document.getElementById('startButton')
  button?.addEventListener('click', () => {
    if (button.dataset.state == '0') {
      button.dataset.state = 1
      button.textContent = 'Stop'
      button.classList.remove('btn-success')
      button.classList.add('btn-danger')
      window.electron.ipcRenderer.send('setVideoSource', selectMenu.value)
      window.electron.ipcRenderer.send('showVideoWindow')
    } else {
      button.dataset.state = 0
      button.textContent = 'Start'
      button.classList.remove('btn-danger')
      button.classList.add('btn-success')
      window.electron.ipcRenderer.send('stopVideo')
    }
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
