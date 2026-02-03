
import { execAsync } from "ags/process"
import GLib from "gi://GLib?version=2.0"
import Gio from "gi://Gio?version=2.0"

export function selectFileWithYazi(
    initialPath: string = GLib.get_home_dir(),
    onSelect: (path: string) => void,
) {
    const tmpFile = `${GLib.get_tmp_dir()}/yazi_selection_${Date.now()}`

    // Create a command that runs yazi and writes the selection to a temp file
    // We wrap it in a shell script execution
    // yazi --chooser-file=/path/to/output

    // Use -- to prevent kitty from parsing yazi arguments
    const cmd = `kitty --title "Yazi File Picker" --detach -- yazi "${initialPath}" --chooser-file="${tmpFile}"`

    console.log(`Launching Yazi with command: ${cmd}`)
    console.log(`Expecting output file: ${tmpFile}`)

    execAsync(["bash", "-c", cmd])
        .then(() => {
            console.log("Yazi launched/detached.")

            let attempts = 0
            const maxAttempts = 600 // 5 minutes (600 * 500ms)

            const checkLoop = () => {
                attempts++
                if (attempts % 4 === 0) console.log(`Polling Yazi selection... (${attempts}/${maxAttempts})`)

                if (GLib.file_test(tmpFile, GLib.FileTest.EXISTS)) {
                    console.log("File exists!")
                    try {
                        const [success, content] = GLib.file_get_contents(tmpFile)
                        if (success) {
                            const path = new TextDecoder("utf-8").decode(content).trim()
                            console.log(`Read path from Yazi: ${path}`)
                            if (path) {
                                onSelect(path)
                            }
                        }
                    } catch (e) {
                        console.error("Error reading yazi output:", e)
                    }
                    // Cleanup
                    execAsync(`rm "${tmpFile}"`)
                    return GLib.SOURCE_REMOVE
                }

                if (attempts >= maxAttempts) {
                    console.log("Yazi selection timed out.")
                    // Cleanup temp file path just in case
                    execAsync(`rm -f "${tmpFile}"`)
                    return GLib.SOURCE_REMOVE
                }

                return GLib.SOURCE_CONTINUE
            }

            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, checkLoop)

            // Timeout fallback just in case
            /* setTimeout(() => {
                if (!checkFile()) {
                    monitor.cancel()
                }
            }, 60000) */
        })
        .catch(console.error)
}
