import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createState, createBinding, For } from "ags"
import Apps from "gi://AstalApps"
import app from "ags/gtk4/app"
import { execAsync } from "ags/process"

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

    const hide = () => {
        win.visible = false
    }

    const list = text(t => {
        const str = t.trim()
        
        // Calculator
        if (/^[\d\s\+\-\*\/\(\)\.]*$/.test(str) && str.length > 0) {
            try {
                // eslint-disable-next-line no-new-func
                const result = new Function(`return ${str}`)()
                if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                    return [{ type: 'math', result: result.toString() }]
                }
            } catch (e) {
                // ignore
            }
        }

        // Shell command
        if (str.startsWith(">")) {
            return [{ type: 'sh', cmd: str.substring(1).trim() }]
        }

        // Apps
        return apps.fuzzy_query(str).slice(0, 8).map(app => ({ type: 'app', app }))
    })

    const onItemClick = (item: any) => {
        if (item.type === 'app') {
            item.app.launch()
        } else if (item.type === 'math') {
            execAsync(`wl-copy "${item.result}"`)
        } else if (item.type === 'sh') {
            execAsync(item.cmd)
        }
        hide()
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
                        const items = list.get()
                        if (items.length > 0) {
                            onItemClick(items[0])
                        }
                    }}
                />
                <box orientation={Gtk.Orientation.VERTICAL} class="app-list">
                    <For each={list}>
                        {(item) => {
                            if (item.type === 'app') {
                                return <AppItem app={item.app} onClick={() => onItemClick(item)} />
                            }
                            if (item.type === 'math') {
                                return (
                                    <button class="AppItem" onClicked={() => onItemClick(item)}>
                                        <box orientation={Gtk.Orientation.HORIZONTAL}>
                                            <image iconName="accessories-calculator-symbolic" />
                                            <label class="name" label={`= ${item.result}`} xalign={0} />
                                        </box>
                                    </button>
                                )
                            }
                            if (item.type === 'sh') {
                                return (
                                    <button class="AppItem" onClicked={() => onItemClick(item)}>
                                        <box orientation={Gtk.Orientation.HORIZONTAL}>
                                            <image iconName="utilities-terminal-symbolic" />
                                            <label class="name" label={`Run: ${item.cmd}`} xalign={0} />
                                        </box>
                                    </button>
                                )
                            }
                        }}
                    </For>
                </box>
            </box>
        </window>
    )
}
