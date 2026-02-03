import { Astal, Gtk, Gdk } from "ags/gtk4"
import Hyprland from "gi://AstalHyprland"
import { createBinding, For } from "ags"

export default function Workspaces() {
  const hyprland = Hyprland.get_default()

  return (
    <box class="Workspaces">
      <For each={createBinding(hyprland, "workspaces")}>
        {(ws) => (
          <button
            class={createBinding(hyprland, "focusedWorkspace").as(fw => 
              ws === fw ? "active" : ""
            )}
            onClicked={() => ws.focus()}
          >
            <box class="dot" />
          </button>
        )}
      </For>
    </box>
  )
}
