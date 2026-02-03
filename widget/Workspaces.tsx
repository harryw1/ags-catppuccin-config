import { Astal, Gtk, Gdk } from "ags/gtk4"
import Hyprland from "gi://AstalHyprland"
import { createBinding, For } from "ags"

export default function Workspaces() {
  const hyprland = Hyprland.get_default()

  // Generate 1-5 persistent workspaces
  const persistent = [1, 2, 3, 4, 5]

  return (
    <box class="Workspaces">
      {persistent.map(id => (
          <button
            class={createBinding(hyprland, "focusedWorkspace").as(fw => 
              fw?.id === id ? "active" : ""
            )}
            onClicked={() => hyprland.dispatch("workspace", id.toString())}
          >
            <box class="dot" />
          </button>
      ))}
      <For each={createBinding(hyprland, "workspaces").as(ws => ws.filter(w => w.id > 5))}>
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