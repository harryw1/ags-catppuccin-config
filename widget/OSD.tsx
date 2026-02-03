import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createBinding, createState } from "ags"
import { timeout } from "ags/time"
import Wp from "gi://AstalWp"

export default function OSD({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
    const wp = Wp.get_default()
    const speaker = wp?.audio.default_speaker

    // If no speaker, don't render anything (or render empty)
    if (!speaker) return <window visible={false} />

    const [visible, setVisible] = createState(false)
    let hideTimer: ReturnType<typeof timeout> | null = null

    const reveal = () => {
        setVisible(true)
        if (hideTimer) hideTimer.cancel()
        hideTimer = timeout(2000, () => setVisible(false))
    }

    // Connect to signals for side-effects (showing the OSD)
    // We bind to the object itself to ensure lifecycle management if needed, 
    // though for a global shell component, manual connect is fine.
    speaker.connect("notify::volume", reveal)
    speaker.connect("notify::mute", reveal)

    return (
        <window
            name={`osd-${gdkmonitor.connector}`}
            class="OSD"
            namespace="osd"
            gdkmonitor={gdkmonitor}
            visible={visible}
            clickThrough={true}
            anchor={Astal.WindowAnchor.BOTTOM}
            layer={Astal.Layer.OVERLAY}
            marginBottom={100}
        >
            <box class="osd-box" orientation={Gtk.Orientation.HORIZONTAL} spacing={12}>
                 <image iconName={createBinding(speaker, "volumeIcon")} iconSize={Gtk.IconSize.LARGE} />
                 <levelbar 
                    valign={Gtk.Align.CENTER}
                    widthRequest={200} 
                    value={createBinding(speaker, "volume")} 
                 />
                 <label label={createBinding(speaker, "volume").as(v => `${Math.floor(v * 100)}%`)} />
            </box>
        </window>
    )
}
