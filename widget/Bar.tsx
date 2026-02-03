import app from "ags/gtk4/app"
import GLib from "gi://GLib"
import Astal from "gi://Astal?version=4.0"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import AstalWp from "gi://AstalWp"
import AstalNetwork from "gi://AstalNetwork"
import AstalTray from "gi://AstalTray"
import AstalMpris from "gi://AstalMpris"
import AstalApps from "gi://AstalApps"
import { For, With, createBinding, onCleanup } from "ags"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"
import Workspaces from "./Workspaces"

function Mpris() {
  const mpris = AstalMpris.get_default()
  const players = createBinding(mpris, "players")

  return (
    <box class="Mpris">
        <For each={players}>
          {(player) => (
             <label label={createBinding(player, "title").as(t => t || "Unknown")} />
          )}
        </For>
    </box>
  )
}

function Tray() {
  const tray = AstalTray.get_default()
  const items = createBinding(tray, "items")

  const init = (btn: Gtk.MenuButton, item: AstalTray.TrayItem) => {
    btn.menuModel = item.menuModel
    btn.insert_action_group("dbusmenu", item.actionGroup)
    item.connect("notify::action-group", () => {
      btn.insert_action_group("dbusmenu", item.actionGroup)
    })
  }

  return (
    <box class="Tray">
      <For each={items}>
        {(item) => (
          <menubutton $={(self) => init(self, item)}>
            <image gicon={createBinding(item, "gicon")} />
          </menubutton>
        )}
      </For>
    </box>
  )
}

function SysInfo() {
    const cpu = createPoll("0%", 2000, "bash -c \"top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\\([0-9.]*\\)\\%* id.*///\\1/' | awk '{print 100 - $1}'\"")
    return (
        <box class="SysInfo" spacing={8}>
            <label label={cpu.as(c => `CPU ${Math.round(Number(c))}%`)} />
        </box>
    )
}

function SystemIndicators() {
    const network = AstalNetwork.get_default()
    const wifi = createBinding(network, "wifi")
    const { defaultSpeaker: speaker } = AstalWp.get_default()!

    return (
        <button onClicked={() => app.toggle_window("control-center")}>
            <box spacing={8}>
                <box class="Wireless" visible={wifi(Boolean)}>
                    <With value={wifi}>
                        {(wifi) => wifi && <image iconName={createBinding(wifi, "iconName")} />}
                    </With>
                </box>
                <box class="Audio">
                    <image iconName={createBinding(speaker, "volumeIcon")} />
                </box>
            </box>
        </button>
    )
}

function Clock({ format = "%H:%M - %A %e." }) {
  const time = createPoll("", 1000, () => {
    return GLib.DateTime.new_now_local().format(format)!
  })

  return (
    <label class="Clock" label={time} />
  )
}

export default function Bar({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let win: Astal.Window
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  onCleanup(() => {
    win.destroy()
  })

  return (
    <window
      $={(self) => (win = self)}
      visible
      namespace="my-bar"
      name={`bar-${gdkmonitor.connector}`}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox class="Bar">
        <box $type="start">
          <Workspaces />
        </box>
        <box $type="center">
          <Clock />
        </box>
        <box $type="end" spacing={12}>
          <SysInfo />
          <Tray />
          <Mpris />
          <SystemIndicators />
        </box>
      </centerbox>
    </window>
  )
}
