import app from "ags/gtk4/app"
import { Gtk } from "ags/gtk4"
import { createState, createComputed, For } from "ags"
import PopupWindow from "./common/PopupWindow"
import { bash } from "../utils"

export const WINDOW_NAME = "emojipicker"

const EMOJIS = {
    "Smileys": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳"],
    "Gestures": ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
    "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
    "Symbols": ["✨", "⭐", "🌟", "💫", "✅", "❌", "⚠️", "🔥", "💯", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚡", "💥", "💢", "💦", "💨"],
    "Objects": ["💻", "⌨️", "🖱️", "🖥️", "📱", "☎️", "📞", "📟", "📠", "🔋", "🔌", "💡", "🔦", "🕯️", "🗑️", "🛒", "💰", "💵", "💴", "💶", "💷", "💳", "💎", "⚖️", "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🔩"],
    "Nature": ["🌍", "🌎", "🌏", "🌐", "🗺️", "🏔️", "⛰️", "🌋", "🗻", "🏕️", "🏖️", "🏜️", "🏝️", "🏞️", "🌅", "🌄", "🌠", "🎇", "🎆", "🌇", "🌆", "🌃", "🌌", "🌉", "🌁"],
    "Food": ["🍕", "🍔", "🍟", "🌭", "🍿", "🥣", "🧂", "🥚", "🍳", "🧇", "🥞", "🍞", "🥐", "🥖", "🥨", "🥯", "🧀", "🍖", "🍗", "🥩", "🥓", "🌮", "🌯", "🥙"],
}

const [searchText, setSearchText] = createState("")
const [selectedCategory, setSelectedCategory] = createState("Smileys")

function hide() {
    app.get_window(WINDOW_NAME)?.set_visible(false)
}

function copyEmoji(emoji: string) {
    bash(`wl-copy "${emoji}"`)
    hide()
}

function CategoryButton({ name }: { name: string }) {
    return (
        <button
            cssClasses={selectedCategory.as(cat => cat === name ? ["category-button", "active"] : ["category-button"])}
            onClicked={() => setSelectedCategory(name)}
            halign={Gtk.Align.CENTER}
        >
            <label label={name} />
        </button>
    )
}

function EmojiButton({ emoji }: { emoji: string }) {
    return (
        <button
            cssClasses={["emoji-button"]}
            onClicked={() => copyEmoji(emoji)}
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
        >
            <label label={emoji} />
        </button>
    )
}

function SearchEntry() {
    return (
        <box cssClasses={["search-box"]}>
            <entry
                hexpand
                placeholderText="Search emojis..."
                text={searchText.peek()}
                $={(self) => {
                    app.connect("window-toggled", (_, win) => {
                        if (win.name == WINDOW_NAME && win.visible) {
                            setSearchText("")
                            self.set_text("")
                            self.grab_focus()
                        }
                    })
                }}
                onNotifyText={({ text }) => setSearchText(text)}
            />
        </box>
    )
}

function EmojiGrid() {
    const filteredEmojis = createComputed(() => {
        const search = searchText().toLowerCase()
        const category = selectedCategory()

        if (search) {
            return Object.values(EMOJIS).flat()
        }

        return EMOJIS[category as keyof typeof EMOJIS] || []
    })

    return (
        <Gtk.ScrolledWindow vexpand>
            <Gtk.FlowBox
                cssClasses={["emoji-grid"]}
                selectionMode={Gtk.SelectionMode.NONE}
                maxChildrenPerLine={6}
                minChildrenPerLine={4}
                columnSpacing={12}
                rowSpacing={12}
                halign={Gtk.Align.CENTER}
            >
                <For each={filteredEmojis}>
                    {(emoji) => <EmojiButton emoji={emoji as string} />}
                </For>
            </Gtk.FlowBox>
        </Gtk.ScrolledWindow>
    )
}

export default function EmojiPicker() {
    return (
        <PopupWindow name={WINDOW_NAME}>
            <box
                cssClasses={["window-content", "emoji-picker-container"]}
                orientation={Gtk.Orientation.VERTICAL}
            >
                <SearchEntry />
                <box cssClasses={["category-bar"]} spacing={8} halign={Gtk.Align.CENTER}>
                    {Object.keys(EMOJIS).map((cat) => <CategoryButton name={cat} />)}
                </box>
                <EmojiGrid />
            </box>
        </PopupWindow>
    )
}
