import options from "../../../options"
import QSButton from "../QSButton"

export default function DarkModeQS() {
  const { mode } = options.theme
  return (
    <QSButton
      connection={[mode, null, (v) => v === "dark"]}
      iconName={"display-brightness-symbolic"}
      label={"Dark Mode"}
      onClicked={() => {
        mode.set(mode.peek() === "light" ? "dark" : "light")
      }}
    />
  )
}
