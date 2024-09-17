import Store from 'electron-store'

const store = new Store()

export function getWindowLocation() {
  const defaultReturn = [0, 0]
  const cords = store.get('settings.window.location')

  if (cords) {
    return cords
  } else {
    store.set('settings.window.location', defaultReturn)
    return defaultReturn
  }
}

export function setWindowLocation(cords) {
  store.set('settings.window.location', cords)
}
