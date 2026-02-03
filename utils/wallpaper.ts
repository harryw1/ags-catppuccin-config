
import { execAsync } from "ags/process"
import GLib from "gi://GLib?version=2.0"
import options from "../options"

const { wallpaper } = options

export async function setWallpaper(path: string) {
    if (GLib.find_program_in_path("swww")) {
        try {
            await execAsync(`swww img --transition-type random "${path}"`)
        } catch (error) {
            console.error("Failed to set wallpaper via swww:", error)
            throw error;
        }
    } else if (GLib.find_program_in_path("hyprctl")) {
        try {
            // Preload and set via hyprpaper as fallback
            console.log(`Preloading wallpaper: ${path}`)
            await execAsync(`hyprctl hyprpaper preload "${path}"`)
            console.log(`Setting wallpaper: ${path}`)
            await execAsync(`hyprctl hyprpaper wallpaper ",${path}"`)
        } catch (error) {
            console.error("Failed to set wallpaper via hyprpaper:", error)
            throw error;
        }
    } else {
        console.warn("No supported wallpaper daemon found (swww or hyprpaper)")
    }

    // Update current wallpaper option
    wallpaper.current.set(path)
}

export async function initWallpaper() {
    console.log("Initializing wallpaper...")

    // Ensure swww-daemon is running if we are using swww
    if (GLib.find_program_in_path("swww")) {
        try {
            await execAsync("swww init")
        } catch (e) {
            // swww init might fail if already running
        }

        // Wait for swww to be ready
        for (let i = 0; i < 5; i++) {
            try {
                await execAsync("swww query")
                break
            } catch (e) {
                // Wait a bit
                await new Promise(r => setTimeout(r, 200))
            }
        }
    }

    const current = wallpaper.current.peek()
    if (current && GLib.file_test(current, GLib.FileTest.EXISTS)) {
        try {
            await setWallpaper(current)
        } catch (e) {
            console.error("Error initializing wallpaper:", e)
        }
    } else {
        console.warn("No current wallpaper saved or file missing.")
    }
}
