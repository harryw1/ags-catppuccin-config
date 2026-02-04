import { mkOptions, opt } from "./utils/option"
import { gsettings } from "./utils"
import GLib from "gi://GLib?version=2.0"
import { execAsync } from "ags/process"

const options = mkOptions(
  `${GLib.get_user_config_dir()}/epik-shell/config.json`,
  {
    wallpaper: {
      folder: opt(`${GLib.get_home_dir()}/Wallpapers`, { cached: true }),
      current: opt(
        await (async () => {
          try {
            if (GLib.find_program_in_path("hyprctl")) {
              const out = await execAsync("hyprctl hyprpaper wallpaper")
              // Output format: "DP-1: /path/to/image.png"
              // We just want the path of the first monitor found
              const match = out.match(/: (.+)/)
              if (match && match[1]) return match[1].trim()
            }
            if (GLib.find_program_in_path("swww")) {
              const out = await execAsync("swww query")
              if (out && out.includes("image: ")) {
                return out.split("image: ")[1].split("\n")[0].trim()
              }
            }
          } catch (err) {
            console.warn("Could not detect current wallpaper: " + err)
          }
          return ""
        })(),
        { cached: true },
      ),
    },
    dock: {
      position: opt("bottom"),
      pinned: opt(["firefox", "kitty", "yazi", "localsend"]),
    },
    bar: {
      position: opt("top"),
      separator: opt(true),
    },
    desktop_clock: {
      position: opt<
        | "top_left"
        | "top"
        | "top_right"
        | "left"
        | "center"
        | "right"
        | "bottom_left"
        | "bottom"
        | "bottom_right"
      >("top_left"),
    },
    theme: {
      mode: opt(
        gsettings.get_string("color-scheme") == "prefer-light"
          ? "light"
          : "dark",
        { cached: true },
      ),
      bar: {
        bg_color: opt("$bg"),
        opacity: opt(1),
        border_radius: opt(6),
        margin: opt(10),
        padding: opt(3),
        border_width: opt(2),
        border_color: opt("$fg"),
        shadow: {
          offset: opt([6, 6]),
          blur: opt(0),
          spread: opt(0),
          color: opt("$fg"),
          opacity: opt(1),
        },
        button: {
          bg_color: opt("$bg"),
          fg_color: opt("$fg"),
          opacity: opt(1),
          border_radius: opt(8),
          border_width: opt(0),
          border_color: opt("$fg"),
          padding: opt([0, 4]),
          shadow: {
            offset: opt([0, 0]),
            blur: opt(0),
            spread: opt(0),
            color: opt("$fg"),
            opacity: opt(1),
          },
        },
      },
      window: {
        opacity: opt(1),
        border_radius: opt(6),
        margin: opt(10),
        padding: opt(10),
        dock_padding: opt(4),
        desktop_clock_padding: opt(4),
        border_width: opt(2),
        border_color: opt("$fg"),
        shadow: {
          offset: opt([6, 6]),
          blur: opt(0),
          spread: opt(0),
          color: opt("$fg"),
          opacity: opt(1),
        },
      },
      icon_theme: opt("Papirus"),
      gtk_theme: opt("catppuccin-frappe-blue-standard+default"),
      light: {
        bg: opt("#303446"), // Frappe Base
        fg: opt("#C6D0F5"), // Frappe Text
        accent: opt("#8CAAEE"), // Frappe Blue
        red: opt("#E78284"), // Frappe Red
      },
      dark: {
        bg: opt("#303446"), // Frappe Base
        fg: opt("#C6D0F5"), // Frappe Text
        accent: opt("#8CAAEE"), // Frappe Blue
        red: opt("#E78284"), // Frappe Red
      },
    },
  },
)

export default options
