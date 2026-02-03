import AstalPowerProfiles from "gi://AstalPowerProfiles"
import { setQsPage } from "./QSWindow"
import { Gtk } from "ags/gtk4"
import { createBinding } from "ags"

export default function PowerProfileSlider() {
    const powerprofiles = AstalPowerProfiles.get_default()
    const activeProfile = createBinding(powerprofiles, "activeProfile")

    // Map profiles to slider values: 0 = power-saver, 0.5 = balanced, 1 = performance
    const profileToValue = (profile: string) => {
        if (profile === "power-saver") return 0
        if (profile === "balanced") return 0.5
        return 1
    }

    const valueToProfile = (value: number) => {
        if (value < 0.33) return "power-saver"
        if (value < 0.67) return "balanced"
        return "performance"
    }

    return (
        <box
            cssClasses={["qs-box", "power-profile-box"]}
            valign={Gtk.Align.CENTER}
            spacing={10}
        >
            <image
                iconName={activeProfile((profile) => `power-profile-${profile}-symbolic`)}
                valign={Gtk.Align.CENTER}
            />
            <slider
                onChangeValue={(self) => {
                    const newProfile = valueToProfile(self.value)
                    powerprofiles.set_active_profile(newProfile)
                }}
                value={activeProfile((profile) => profileToValue(profile))}
                hexpand
                drawValue={false}
            />
            <button
                iconName={"go-next-symbolic"}
                onClicked={() => setQsPage("battery")}
            />
        </box>
    )
}
