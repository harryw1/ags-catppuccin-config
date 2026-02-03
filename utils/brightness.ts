import { monitorFile, readFileAsync } from "ags/file"
import { getter, register, setter } from "ags/gobject"
import { exec, execAsync } from "ags/process"
import GObject from "gi://GObject?version=2.0"

const get = (args: string) => {
    try {
        return Number(exec(`brightnessctl ${args}`))
    } catch {
        return 0
    }
}

const screen = (() => {
    try {
        return exec(`bash -c "ls -w1 /sys/class/backlight | head -1"`)
    } catch {
        return ""
    }
})()

const kbd = (() => {
    try {
        return exec(`bash -c "ls -w1 /sys/class/leds | head -1"`)
    } catch {
        return ""
    }
})()

@register({ GTypeName: "Brightness" })
export default class Brightness extends GObject.Object {
  static instance: Brightness

  static get_default() {
    if (!this.instance) this.instance = new Brightness()

    return this.instance
  }

  #kbdMax = get(`--device ${kbd} max`) || 1
  #kbd = get(`--device ${kbd} get`) || 0
  #screenMax = get("max") || 1
  #screen = (get("get") || 0) / (get("max") || 1)

  @getter(Number)
  get kbd() {
    return this.#kbd
  }

  @setter(Number)
  set kbd(value) {
    if (value < 0 || value > this.#kbdMax) return
    if (!kbd) return

    execAsync(`brightnessctl -d ${kbd} s ${value} -q`).then(() => {
      this.#kbd = value
      this.notify("kbd")
    }).catch(console.error)
  }

  @getter(Number)
  get screen() {
    return this.#screen
  }

  @setter(Number)
  set screen(percent) {
    if (percent < 0) percent = 0
    if (percent > 1) percent = 1

    execAsync(`brightnessctl set ${Math.floor(percent * 100)}% -q`).then(() => {
      this.#screen = percent
      this.notify("screen")
    }).catch(console.error)
  }

  constructor() {
    super()

    if (screen) {
        const screenPath = `/sys/class/backlight/${screen}/brightness`
        monitorFile(screenPath, async (f) => {
        const v = await readFileAsync(f)
        this.#screen = Number(v) / this.#screenMax
        this.notify("screen")
        })
    }

    if (kbd) {
        const kbdPath = `/sys/class/leds/${kbd}/brightness`
        monitorFile(kbdPath, async (f) => {
        const v = await readFileAsync(f)
        this.#kbd = Number(v) / this.#kbdMax
        this.notify("kbd")
        })
    }
  }
}
