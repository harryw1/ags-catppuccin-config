import windows from "./windows"
import initStyles from "./utils/styles"
import app from "ags/gtk4/app"
import initHyprland from "./utils/hyprland"
import requestHandler from "./request"
import { initWallpaper } from "./utils/wallpaper"

initStyles()

app.start({
  requestHandler(req, res) {
    requestHandler(req, res)
  },
  main() {
    windows()
    initHyprland()
    initWallpaper()
  },
})
