import AstalPowerProfiles from "gi://AstalPowerProfiles"
import QSButton from "../QSButton"
import { createBinding } from "ags"

export default function PowerProfileQS() {
    const powerprofiles = AstalPowerProfiles.get_default()
    const activeProfile = createBinding(powerprofiles, "activeProfile")

    const profiles = ["power-saver", "balanced", "performance"]

    return (
        <QSButton
            connection={[powerprofiles, "activeProfile"]}
            iconName={activeProfile((profile) => `power-profile-${profile}-symbolic`)}
            label={"Power Profile"}
            onClicked={() => {
                const current = powerprofiles.get_active_profile()
                const currentIndex = profiles.indexOf(current)
                const nextIndex = (currentIndex + 1) % profiles.length
                const nextProfile = profiles[nextIndex]

                // Check if profile exists before setting
                const availableProfiles = powerprofiles.get_profiles().map((p: AstalPowerProfiles.Profile) => p.profile)
                if (availableProfiles.includes(nextProfile)) {
                    powerprofiles.set_active_profile(nextProfile)
                }
            }}
        />
    )
}
