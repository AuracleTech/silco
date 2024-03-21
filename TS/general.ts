import "../../panels/SCSS/panels.scss";
import { Panels, Panel } from "../../panels/TS/panels.ts";

import "../../hotkeys/SCSS/hotkeys.scss";
import { Hotkeys } from "../../hotkeys/TS/hotkeys.ts";

import "../SCSS/editor.scss";
import { Editor } from "./editor.ts";

const hotkeys = new Hotkeys();

const panels = new Panels();
document.body.append(panels);

hotkeys.set({
	key: "r",
	short: "Changing content",
	long: "Changing content on the panel to whatever",
	func: () => {
		if (panels.focused === undefined) return;
		panels.focused.content.textContent = "Panel content changed!";
	},
	experimental: true,
});

hotkeys.set({
	key: "n",
	short: "New panel",
	long: "Create a new editor panel",
	func: () => {
		const panel_editor: Panel = panels.new_panel({
			resizable: true,
			preservable: true,
			spawn_at_random: false,
			spawn_at_cursor: true,
		});
		panel_editor.content.append(new Editor());
	},
	experimental: true,
});

hotkeys.set({
	key: "h",
	short: "Hotkeys",
	long: "Display the hotkeys panel",
	func: () => hotkeys.toggle_modal(),
	experimental: false,
});
