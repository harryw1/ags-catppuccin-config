import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createBinding, createState, For } from "ags"
import Network from "gi://AstalNetwork"
import Bluetooth from "gi://AstalBluetooth"
import Wp from "gi://AstalWp"
import Notifd from "gi://AstalNotifd"
import Mpris from "gi://AstalMpris"
import app from "ags/gtk4/app"
import { execAsync } from "ags/process"

function QuickToggle({ icon, label, active, onClick, hexpand = true }: { icon: string, label: string, active: boolean, onClick: () => void, hexpand?: boolean }) {
    return (
        <button class={`QuickToggle ${active ? 'active' : ''}`} onClicked={onClick} hexpand={hexpand}>
            <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
                <image iconName={icon} />
                <label label={label} />
            </box>
        </button>
    )
}

function VolumeSlider({ device, icon }: { device: Wp.Endpoint, icon: string }) {
    return (
        <box class="VolumeSlider" orientation={Gtk.Orientation.HORIZONTAL} spacing={12}>
            <button onClicked={() => device.set_mute(!device.mute)}>
                <image iconName={icon} />
            </button>
            <slider
                hexpand
                min={0}
                max={1}
                value={createBinding(device, "volume")}
                onChangeValue={({ value }) => device.set_volume(value)}
            />
        </box>
    )
}

function MediaPlayer() {
    const mpris = Mpris.get_default()
    const players = createBinding(mpris, "players")
    
    return (
        <box orientation={Gtk.Orientation.VERTICAL} visible={players.as(p => p.length > 0)}>
            <For each={players}>
                {(player) => (
                    <box class="MediaPlayer" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
                        <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
                            <image class="cover" file={createBinding(player, "coverArt")} pixelSize={48} />
                            <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
                                <label label={createBinding(player, "title")} xalign={0} css="font-weight: bold" />
                                <label label={createBinding(player, "artist")} xalign={0} />
                            </box>
                        </box>
                        <box orientation={Gtk.Orientation.HORIZONTAL} halign={Gtk.Align.CENTER} spacing={16}>
                            <button onClicked={() => player.previous()} visible={createBinding(player, "canGoPrevious")}>
                                <image iconName="media-seek-backward-symbolic" />
                            </button>
                            <button onClicked={() => player.play_pause()}>
                                <image iconName={createBinding(player, "playbackStatus").as(s => 
                                    s === Mpris.PlaybackStatus.PLAYING ? "media-playback-pause-symbolic" : "media-playback-start-symbolic"
                                )} />
                            </button>
                            <button onClicked={() => player.next()} visible={createBinding(player, "canGoNext")}>
                                <image iconName="media-seek-forward-symbolic" />
                            </button>
                        </box>
                    </box>
                )}
            </For>
        </box>
    )
}

export default function ControlCenter() {
    const network = Network.get_default()
    const bluetooth = Bluetooth.get_default()
    const wp = Wp.get_default()
    const notifd = Notifd.get_default()
    let win: Astal.Window

    // Network
    const wifi = createBinding(network, "wifi")
    const wired = createBinding(network, "wired")

    // Audio
    const speaker = wp?.audio.default_speaker
    const mic = wp?.audio.default_microphone

    const hide = () => {
        win.visible = false
    }

    return (
        <window
            $={(self) => (win = self)}
            name="control-center"
            application={app}
            class="ControlCenter"
            visible={false}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
            marginRight={12}
            marginTop={12}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            keymode={Astal.Keymode.ON_DEMAND}
        >
            <box class="control-center-content" orientation={Gtk.Orientation.VERTICAL} spacing={16}>
                {/* Toggles */}
                <box orientation={Gtk.Orientation.HORIZONTAL} spacing={12}>
                    <QuickToggle 
                        active={wifi.as(w => w?.enabled ?? false)}
                        icon={wifi.as(w => w?.iconName ?? "network-wireless-offline-symbolic")}
                        label={wifi.as(w => w?.ssid ?? "WiFi")}
                        onClick={() => { if (network.wifi) network.wifi.enabled = !network.wifi.enabled }}
                    />
                    <QuickToggle
                        active={createBinding(bluetooth, "isPowered")}
                        icon="bluetooth-active-symbolic"
                        label={createBinding(bluetooth, "isPowered").as(p => p ? "On" : "Off")}
                        onClick={() => bluetooth.toggle()}
                    />
                </box>
                <box orientation={Gtk.Orientation.HORIZONTAL} spacing={12}>
                     <QuickToggle
                        hexpand={false}
                        active={createBinding(notifd, "dontDisturb")}
                        icon="notifications-disabled-symbolic"
                        label="No Notif"
                        onClick={() => notifd.set_dont_disturb(!notifd.dontDisturb)}
                    />
                    <box hexpand /> {/* Spacer */}
                </box>

                {/* Sliders */}
                {speaker && (
                    <VolumeSlider 
                        device={speaker} 
                        icon={createBinding(speaker, "volumeIcon")}
                    />
                )}
                {mic && (
                    <VolumeSlider
                        device={mic}
                        icon="microphone-sensitivity-high-symbolic"
                    />
                )}

                {/* Media */}
                <MediaPlayer />

                {/* Power */}
                <box orientation={Gtk.Orientation.HORIZONTAL} halign={Gtk.Align.END} spacing={12}>
                    <button class="PowerButton" onClicked={() => execAsync("systemctl poweroff")}>
                        <image iconName="system-shutdown-symbolic" />
                    </button>
                    <button class="PowerButton" onClicked={() => execAsync("systemctl reboot")}>
                        <image iconName="system-reboot-symbolic" />
                    </button>
                    <button class="PowerButton" onClicked={() => execAsync("hyprctl dispatch exit")}>
                        <image iconName="system-log-out-symbolic" />
                    </button>
                </box>
            </box>
        </window>
    )
}
