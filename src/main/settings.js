import { settings as eSettings } from 'electron-settings'

class Settings {
  init() {
    if (!eSettings.has('mouse.follow')) {
      eSettings.set('mouse.follow', false)
    }
  }
}

exports.settings = Settings
