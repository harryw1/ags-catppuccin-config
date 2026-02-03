import { Astal, Gtk } from "ags/gtk4"
import AstalWp from "gi://AstalWp"
import AstalMpris from "gi://AstalMpris"
import { createBinding, createState, onCleanup, With } from "ags"
import { timeout } from "ags/time"
import app from "ags/gtk4/app"
import Pango from "gi://Pango"

type OSDType = "volume" | "media" | "mic" | null

// Global state for OSD
const [osdType, setOsdType] = createState<OSDType>(null)
const [visible, setVisible] = createState(false)

let hideTimeout: ReturnType<typeof timeout> | null = null

function showOsd(type: OSDType) {
    if (hideTimeout) {
        hideTimeout.cancel()
    }

    setOsdType(type)
    setVisible(true)

    hideTimeout = timeout(2000, () => {
        setVisible(false)
        hideTimeout = null
    })
}

// Export functions to trigger OSD from request handler
export function showVolumeOsd() {
    showOsd("volume")
}

export function showMediaOsd() {
    showOsd("media")
}

export function showMicOsd() {
    showOsd("mic")
}

function VolumeIndicator() {
    const speaker = AstalWp.get_default()?.audio?.defaultSpeaker

    if (!speaker) {
        return <box />
    }

    const volumeIcon = createBinding(speaker, "volumeIcon")
    const volume = createBinding(speaker, "volume")

    return (
        <box cssClasses={["osd-content"]} spacing={10}>
            <image iconName={volumeIcon} cssClasses={["osd-icon"]} />
            <slider
                value={volume}
                sensitive={false}
                hexpand
                cssClasses={["osd-slider"]}
            />
        </box>
    )
}

function MicIndicator() {
    const mic = AstalWp.get_default()?.audio?.defaultMicrophone

    if (!mic) {
        return <box />
    }

    const muted = createBinding(mic, "mute")
    const icon = muted.as((m) => m ? "microphone-disabled-symbolic" : "audio-input-microphone-symbolic")
    const label = muted.as((m) => m ? "Mic Muted" : "Mic On")

    return (
        <box cssClasses={["osd-content"]} spacing={10}>
            <image iconName={icon} cssClasses={["osd-icon"]} />
            <label label={label} cssClasses={["osd-status-label"]} />
        </box>
    )
}

function MediaIndicator() {
    const mpris = AstalMpris.get_default()
    const player = createBinding(mpris, "players").as((players) => players[0])

    return (
        <box cssClasses={["osd-content"]}>
            <With value={player}>
                {(p) => {
                    if (!p) {
                        return <label label="No media" cssClasses={["osd-label"]} />
                    }

                    const playIcon = createBinding(p, "playbackStatus").as((s) =>
                        s === AstalMpris.PlaybackStatus.PLAYING
                            ? "media-playback-start-symbolic"
                            : "media-playback-pause-symbolic"
                    )

                    const title = createBinding(p, "title").as((t) => t || "Unknown")
                    const artist = createBinding(p, "artist").as((a) => a || "")
                    const coverArt = createBinding(p, "coverArt")

                    return (
                        <box spacing={10}>
                            <image
                                file={coverArt}
                                pixelSize={36}
                                cssClasses={["osd-cover"]}
                                overflow={Gtk.Overflow.HIDDEN}
                            />
                            <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
                                <label
                                    cssClasses={["osd-title"]}
                                    label={title}
                                    maxWidthChars={20}
                                    ellipsize={Pango.EllipsizeMode.END}
                                    halign={Gtk.Align.START}
                                />
                                <label
                                    cssClasses={["osd-artist"]}
                                    label={artist}
                                    maxWidthChars={20}
                                    ellipsize={Pango.EllipsizeMode.END}
                                    halign={Gtk.Align.START}
                                />
                            </box>
                            <image iconName={playIcon} cssClasses={["osd-icon-small"]} />
                        </box>
                    )
                }}
            </With>
        </box>
    )
}

export default function OSD() {
    return (
        <window
            $={(self) => onCleanup(() => self.destroy())}
            namespace="osd"
            name="osd"
            visible={visible}
            anchor={Astal.WindowAnchor.BOTTOM}
            layer={Astal.Layer.OVERLAY}
            application={app}
        >
            <box cssClasses={["window-content", "osd-container"]}>
                <With value={osdType}>
                    {(type) => {
                        switch (type) {
                            case "volume":
                                return <VolumeIndicator />
                            case "media":
                                return <MediaIndicator />
                            case "mic":
                                return <MicIndicator />
                            default:
                                return <box />
                        }
                    }}
                </With>
            </box>
        </window>
    )
}
