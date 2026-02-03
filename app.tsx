import { createBinding, For, This } from "ags"
import app from "ags/gtk4/app"
import Gtk from "gi://Gtk?version=4.0"
import Adw from "gi://Adw?version=1"
import style from "./style.scss"
import Bar from "./widget/Bar"
import Applauncher from "./widget/Applauncher"
import NotificationPopups from "./widget/Notifications"
import OSD from "./widget/OSD"
import ControlCenter from "./widget/ControlCenter"

app.start({
  css: style,
  gtkTheme: "catppuccin-frappe-blue-standard+default",
  requestHandler(request, res) {
    if (request === "launcher") {
        app.toggle_window("launcher")
        res("ok")
    } else if (request === "control-center") {
        app.toggle_window("control-center")
        res("ok")
    } else {
        res("unknown command")
    }
  },
  main() {
    // Correct way to handle color scheme with libadwaita
    const styleManager = Adw.StyleManager.get_default()
    styleManager.color_scheme = Adw.ColorScheme.PREFER_DARK

    Gtk.Settings.get_default().gtk_icon_theme_name = "Papirus-Dark"

    const monitors = createBinding(app, "monitors")

    // Global instances
    Applauncher()
    ControlCenter()

    return (
      <For each={monitors}>
        {(monitor) => (
          <This this={app}>
            <Bar gdkmonitor={monitor} />
            <NotificationPopups gdkmonitor={monitor} />
            <OSD gdkmonitor={monitor} />
          </This>
        )}
      </For>
    )
  },
})
