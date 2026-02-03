import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createBinding, createState, For, onCleanup } from "ags"
import Notifd from "gi://AstalNotifd"

function Notification({ n }: { n: Notifd.Notification }) {
    return (
        <box class="Notification">
            <box class="content">
                {n.image && <image class="image" file={n.image} />}
                <box orientation={Gtk.Orientation.VERTICAL}>
                    <label class="summary" label={n.summary} xalign={0} />
                    <label class="body" label={n.body} xalign={0} wrap />
                </box>
            </box>
            <button onClicked={() => n.dismiss()}>
                <image iconName="window-close-symbolic" />
            </button>
        </box>
    )
}

export default function NotificationPopups({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
    const notifd = Notifd.get_default()
    const [notifications, setNotifications] = createState(new Array<Notifd.Notification>())

    const id1 = notifd.connect("notified", (_, id) => {
        // We cannot know if it replaced something without the 'replaced' arg or checking,
        // but typically the signal signature is (id).
        // However, checking Astal docs/examples, it seems we might need to check if ID exists.
        const n = notifd.get_notification(id)
        if (n) {
            setNotifications(prev => {
                const exists = prev.some(item => item.id === id)
                if (exists) {
                    return prev.map(item => item.id === id ? n : item)
                }
                return [n, ...prev]
            })
        }
    })

    const id2 = notifd.connect("resolved", (_, id) => {
        setNotifications(ns => ns.filter(n => n.id !== id))
    })

    onCleanup(() => {
        notifd.disconnect(id1)
        notifd.disconnect(id2)
    })

    return (
        <window
            class="NotificationPopups"
            gdkmonitor={gdkmonitor}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
        >
            <box orientation={Gtk.Orientation.VERTICAL}>
                <For each={notifications}>
                    {(n) => <Notification n={n} />}
                </For>
            </box>
        </window>
    )
}