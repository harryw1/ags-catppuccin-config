import {
  Accessor,
  createBinding,
  createComputed,
  createConnection,
  createEffect,
  createState,
  With,
} from "ags"
import { execAsync } from "ags/process"
import options from "../../options"
import { Gtk } from "ags/gtk4"
import DarkModeQS from "./buttons/DarkModeQS"
import ColorPickerQS from "./buttons/ColorPickerQS"
import ScreenshotQS from "./buttons/ScreenshotQS"
import MicQS from "./buttons/MicQS"
import DontDisturbQS from "./buttons/DontDisturbQS"
import RecordQS from "./buttons/RecordQS"
import AstalBattery from "gi://AstalBattery?version=0.1"
import app from "ags/gtk4/app"
import GLib from "gi://GLib?version=2.0"
import GObject from "gi://GObject?version=2.0"
import AstalNetwork from "gi://AstalNetwork?version=0.1"
import AstalBluetooth from "gi://AstalBluetooth?version=0.1"

import VolumeBox from "./VolumeBox"
import PopupWindow from "../common/PopupWindow"
import BatteryPage from "./pages/BatteryPage"
import SpeakerPage from "./pages/SpeakerPage"
import WifiPage from "./pages/WifiPage"
import { WINDOW_NAME as POWERMENU_WINDOW } from "../powermenu/PowerMenu"
import Pango from "gi://Pango?version=1.0"
import Adw from "gi://Adw?version=1"
import { toggleWallpaperPicker } from "../WallpaperPicker"

export const WINDOW_NAME = "quicksettings"
export const [qsPage, setQsPage] = createState("main")
const { bar } = options

const layout = createComputed(() => {
  return `${bar.position()}_right`
})

function QSButtons() {
  return (
    <Gtk.FlowBox
      maxChildrenPerLine={3}
      activateOnSingleClick={false}
      homogeneous
      rowSpacing={6}
      columnSpacing={6}
    >
      <DarkModeQS />
      <ColorPickerQS />
      <ScreenshotQS />
      <MicQS />
      <DontDisturbQS />
      <RecordQS />
    </Gtk.FlowBox>
  )
}

function Header() {
  const battery = AstalBattery.get_default()
  const isPresent = createBinding(battery, "isPresent")
  const isCharging = createBinding(battery, "charging")
  const percentage = createBinding(battery, "percentage")

  const icon = createComputed(() => {
    // If no battery present, we're on AC power (desktop)
    if (!isPresent()) {
      return "ac-adapter-symbolic"
    }
    // If battery present and charging, show AC icon
    if (isCharging()) {
      return "ac-adapter-symbolic"
    }
    // Otherwise show battery icon
    return battery.get_battery_icon_name()
  })

  const label = createComputed(() => {
    // If no battery or charging, show AC Power
    if (!isPresent() || isCharging()) {
      return "AC Power"
    }
    return `${Math.floor(percentage() * 100)}%`
  })

  return (
    <box hexpand={false} cssClasses={["header"]} spacing={6}>
      <label label={"Quick Setting"} hexpand xalign={0} />
      <button
        onClicked={() => {
          app.toggle_window(WINDOW_NAME)
          toggleWallpaperPicker()
        }}
        iconName={"preferences-desktop-wallpaper-symbolic"}
      />
      <button
        cssClasses={["battery"]}
        onClicked={() => {
          setQsPage("battery")
        }}
      >
        <box spacing={2}>
          <With value={icon}>
            {(i) => (
              <image
                iconName={i}
                iconSize={Gtk.IconSize.NORMAL}
                cssClasses={["icon"]}
              />
            )}
          </With>
          <With value={label}>
            {(l) => <label label={l} />}
          </With>
        </box>
      </button>
      <button
        cssClasses={["powermenu"]}
        onClicked={() => {
          app.toggle_window(WINDOW_NAME)
          app.toggle_window(POWERMENU_WINDOW)
        }}
      >
        <image
          iconName={"system-shutdown-symbolic"}
          iconSize={Gtk.IconSize.NORMAL}
        />
      </button>
    </box>
  )
}

function ArrowButton<T extends GObject.Object>({
  icon,
  title,
  subtitle,
  onClicked,
  onArrowClicked,
  connection: [gobject, property],
}: {
  icon: string | Accessor<string>
  title: string
  subtitle: string | Accessor<string>
  onClicked: () => void
  onArrowClicked: () => void
  connection: [T, any]
}) {
  return (
    <box
      cssClasses={createBinding(gobject, property).as((p) => {
        const classes = ["arrow-button"]
        p && classes.push("active")
        return classes
      })}
    >
      <button onClicked={onClicked}>
        <box halign={Gtk.Align.START} spacing={6}>
          <image iconName={icon} iconSize={Gtk.IconSize.LARGE} />
          <box orientation={Gtk.Orientation.VERTICAL} hexpand>
            <label xalign={0} label={title} cssClasses={["title"]} />
            <label
              xalign={0}
              label={subtitle}
              cssClasses={["subtitle"]}
              ellipsize={Pango.EllipsizeMode.END}
            />
          </box>
        </box>
      </button>
      <button iconName={"go-next-symbolic"} onClicked={onArrowClicked} />
    </box>
  )
}

function WifiArrowButton() {
  const wifi = AstalNetwork.get_default().wifi

  const ssid = createBinding(wifi, "ssid")

  const label = createComputed(() => {
    return ssid() || "Disconnected"
  })

  // Poll iwctl for WiFi status since impala/iwd doesn't update AstalNetwork properly
  const [iwctlIcon, setIwctlIcon] = createState("network-wireless-symbolic")

  const updateWifiStatus = () => {
    execAsync(["bash", "-c", "iwctl station wlan0 show | grep -E 'Connected network|RSSI'"])
      .then((output) => {
        // Parse RSSI (signal strength) from iwctl output
        const rssiMatch = output.match(/RSSI\s+(-?\d+)/)
        if (rssiMatch) {
          const rssi = parseInt(rssiMatch[1])
          // Convert RSSI to percentage (typical range: -90 to -30 dBm)
          const percentage = Math.min(100, Math.max(0, (rssi + 90) * (100 / 60)))

          if (percentage > 80) setIwctlIcon("network-wireless-signal-excellent-symbolic")
          else if (percentage > 60) setIwctlIcon("network-wireless-signal-good-symbolic")
          else if (percentage > 40) setIwctlIcon("network-wireless-signal-ok-symbolic")
          else if (percentage > 20) setIwctlIcon("network-wireless-signal-weak-symbolic")
          else setIwctlIcon("network-wireless-signal-none-symbolic")
        } else {
          setIwctlIcon("network-wireless-offline-symbolic")
        }
      })
      .catch(() => {
        setIwctlIcon("network-wireless-offline-symbolic")
      })
  }

  // Update WiFi status every 5 seconds
  updateWifiStatus()
  setInterval(updateWifiStatus, 5000)

  return (
    <ArrowButton
      icon={iwctlIcon}
      title="Wi-Fi"
      subtitle={label}
      onClicked={() => wifi.set_enabled(!wifi.get_enabled())}
      onArrowClicked={() => {
        wifi.set_enabled(true)
        execAsync("kitty -e impala")
        app.toggle_window(WINDOW_NAME)
      }}
      connection={[wifi, "enabled"]}
    />
  )
}

function WifiBluetooth() {
  const bluetooth = AstalBluetooth.get_default()
  const btAdapter = bluetooth.adapter
  const isConnected = createBinding(bluetooth, "isConnected")
  const deviceConnected = createComputed(() => {
    if (isConnected()) {
      return bluetooth.devices.find((d: AstalBluetooth.Device) => d.connected)?.name ?? "No device"
    }
    return "No device"
  })
  const wifi = AstalNetwork.get_default().wifi

  return (
    <box homogeneous spacing={6}>
      {!!wifi && <WifiArrowButton />}
      <box>
        <With value={deviceConnected}>
          {(label) => (
            <ArrowButton
              icon={createBinding(btAdapter, "powered").as(
                (p) => `bluetooth-${p ? "" : "disabled-"}symbolic`,
              )}
              title="Bluetooth"
              subtitle={label}
              onClicked={() => bluetooth.toggle()}
              onArrowClicked={() => {
                execAsync("kitty -e bluetuith")
                app.toggle_window(WINDOW_NAME)
              }}
              connection={[btAdapter, "powered"]}
            />
          )}
        </With>
      </box>
    </box>
  )
}

function MainPage() {
  return (
    <box
      name="main"
      cssClasses={["qs-page"]}
      orientation={Gtk.Orientation.VERTICAL}
      spacing={6}
    >
      <Header />
      <Gtk.Separator />
      <WifiBluetooth />
      <QSButtons />

      <VolumeBox />
    </box>
  )
}

export default function QSWindow() {
  return (
    <With value={layout}>
      {(l) => (
        <PopupWindow
          name={WINDOW_NAME}
          layout={l}
          setup={(win) => {
            win.connect("notify::visible", (win, _) => {
              if (!win.visible) {
                setQsPage("main")
              }
            })
          }}
        >
          <Adw.Clamp maximumSize={400}>
            <box
              cssClasses={["window-content", "qs-container"]}
              orientation={Gtk.Orientation.VERTICAL}
              widthRequest={400}
            >
              <stack
                $={(self) => {
                  const children: any[] = [
                    MainPage(),
                    BatteryPage(),
                    SpeakerPage(),
                    WifiPage(),
                  ]

                  children.forEach((c: Gtk.Widget) => {
                    self.add_named(c, c.name)
                  })

                  createEffect(() => (self.visible_child_name = qsPage()))
                }}
                transitionType={Gtk.StackTransitionType.SLIDE_LEFT_RIGHT}
              ></stack>
            </box>
          </Adw.Clamp>
        </PopupWindow>
      )}
    </With>
  )
}
