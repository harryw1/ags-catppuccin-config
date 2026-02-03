import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createState, createBinding, For } from "ags"
import Apps from "gi://AstalApps"
import app from "ags/gtk4/app"

function AppItem({ app, onClick }: { app: Apps.Application, onClick: () => void }) {
    return (
        <button class="AppItem" onClicked={onClick}>
            <box orientation={Gtk.Orientation.HORIZONTAL}>
                <image iconName={app.iconName} />
                <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
                    <label class="name" label={app.name} xalign={0} />
                    {app.description && (
                        <label class="description" label={app.description} xalign={0} ellipsize={3} />
                    )}
                </box>
            </box>
        </button>
    )
}

export default function Applauncher() {
    const apps = new Apps.Apps()
    const [text, setText] = createState("")
    let win: Astal.Window

    const list = text(t => apps.fuzzy_query(t).slice(0, 8))

    const hide = () => {
        win.visible = false
    }

    return (
        <window
            $={(self) => (win = self)}
            name="launcher"
            application={app}
            class="Applauncher"
            visible={false}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
            exclusivity={Astal.Exclusivity.IGNORE}
            keymode={Astal.Keymode.EXCLUSIVE}
            onNotifyVisible={(self) => {
                if (!self.visible) setText("")
            }}
        >
            <Gtk.EventControllerKey
                onKeyPressed={(_, keyval) => {
                    if (keyval === Gdk.KEY_Escape) {
                        hide()
                    }
                }}
            />
            <box class="launcher-content" orientation={Gtk.Orientation.VERTICAL} halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
                <entry
                    placeholderText="Search..."
                    onNotifyText={(self) => setText(self.text)}
                    onActivate={() => {
                        const items = apps.fuzzy_query(text.get())
                        if (items.length > 0) {
                            items[0].launch()
                            hide()
                        }
                    }}
                />
                <box orientation={Gtk.Orientation.VERTICAL} class="app-list">
                    <For each={list}>
                        {(app) => (
                            <AppItem
                                app={app}
                                onClick={() => {
                                    app.launch()
                                    hide()
                                }}
                            />
                        )}
                    </For>
                </box>
            </box>
        </window>
    )
}