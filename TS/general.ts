import "../../panels/SCSS/panels.scss";
import { Panels, Panel } from "../../panels/TS/panels.ts";

import "../../hotkeys/SCSS/hotkeys.scss";
import { Hotkeys } from "../../hotkeys/TS/hotkeys.ts";

import "../SCSS/editor.scss";
import { Editor } from "./editor.ts";

import "../SCSS/terminal.scss";
import { Terminal } from "./terminal.ts";

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

const temporary = async () => {
	const panel_editor: Panel = panels.new_panel({
		resizable: true,
		preservable: true,
		spawn_at_random: false,
		spawn_at_cursor: true,
	});
	let editor = new Editor();
	panel_editor.content.append(editor);
};
temporary(); // TEMP

hotkeys.set({
	key: "n",
	short: "New panel",
	long: "Create a new editor panel",
	func: temporary,
	experimental: true,
});

hotkeys.set({
	key: "h",
	short: "Hotkeys",
	long: "Display the hotkeys panel",
	func: () => hotkeys.toggle_modal(),
	experimental: false,
});

import { Command } from "@tauri-apps/api/shell";
// import { invoke } from "@tauri-apps/api/tauri";

const terminal_panel = panels.new_panel({
	resizable: true,
	preservable: true,
	spawn_at_random: false,
	spawn_at_cursor: true,
});
let terminal = new Terminal();
terminal_panel.content.append(terminal);

let random_count = 0; // temp

hotkeys.set({
	key: "t",
	short: "Contact terminal",
	long: "Sends a message to the terminal",
	func: async () => {
		// terminal_panel.content.textContent = await invoke("send_cmd", {
		// 	source: "echo squirrel in blueberry",
		// });

		// let command = new Command("help", []);
		// command.on("close", (data) => {
		// 	console.log(
		// 		`command finished with code ${data.code} and signal ${data.signal}`
		// 	);
		// });
		// command.on("error", (error) => console.error(error));
		// command.stdout.on("data", (line) => terminal.print(line));
		// command.stderr.on("data", (line) => terminal.eprint(line));
		// command.spawn()

		// print 50 lines
		for (let i = 0; i < 50; i++) {
			random_count += 1;
			terminal.print(`Random count: ${random_count}`);
		}
	},
	experimental: false,
});
