import { createBinding, For, This } from "ags"
import Bar from "./widgets/bar/Bar"
import DesktopClock from "./widgets/DesktopClock"
import app from "ags/gtk4/app"
import DateMenu from "./widgets/DateMenu"
import Applauncher from "./widgets/Applauncher"
import NotificationPopup from "./widgets/notification/NotificationPopup"
import NotificationWindow from "./widgets/notification/NotificationWindow"
import QSWindow from "./widgets/quicksettings/QSWindow"

import PowerMenu from "./widgets/powermenu/PowerMenu"
import VerificationWindow from "./widgets/powermenu/VerificationWindow"
import OSD from "./widgets/osd/OSD"
import EmojiPicker from "./widgets/EmojiPicker"

export default function windows() {
  const monitors = createBinding(app, "monitors")

  Applauncher()
  DateMenu()
  DesktopClock()
  NotificationWindow()
  PowerMenu()
  VerificationWindow()
  QSWindow()
  OSD()
  EmojiPicker()

  return (
    <For each={monitors}>
      {(monitor) => (
        <This this={app}>
          <Bar gdkmonitor={monitor} />
          <NotificationPopup gdkmonitor={monitor} />

        </This>
      )}
    </For>
  )
}
