import app from "ags/gtk4/app"
import GLib from "gi://GLib"
import Astal from "gi://Astal?version=4.0"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import AstalBattery from "gi://AstalBattery"
import AstalPowerProfiles from "gi://AstalPowerProfiles"
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
  const apps = new AstalApps.Apps()
  const players = createBinding(mpris, "players")

  return (
    <box class="Mpris">
        <For each={players}>
          {(player) => {
             // Basic implementation, can be expanded
             return <label label={createBinding(player, "title")} />
          }}
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

function Wireless() {
  const network = AstalNetwork.get_default()
  const wifi = createBinding(network, "wifi")

  return (
    <box class="Wireless" visible={wifi(Boolean)}>
      <With value={wifi}>
        {(wifi) =>
          wifi && (
            <menubutton>
              <image iconName={createBinding(wifi, "iconName")} />
            </menubutton>
          )
        }
      </With>
    </box>
  )
}

function AudioOutput() {
  const { defaultSpeaker: speaker } = AstalWp.get_default()!

  return (
    <box class="Audio">
        <menubutton>
        <image iconName={createBinding(speaker, "volumeIcon")} />
        <popover>
            <box>
            <slider
                widthRequest={260}
                onChangeValue={({ value }) => speaker.set_volume(value)}
                value={createBinding(speaker, "volume")}
            />
            </box>
        </popover>
        </menubutton>
    </box>
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

        <box $type="end">

          <Tray />

          <Mpris />

          <Wireless />

          <AudioOutput />

        </box>

      </centerbox>

    </window>

  )

}
