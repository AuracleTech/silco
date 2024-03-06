import { invoke } from "@tauri-apps/api/tauri";

import "../../panels/SCSS/panels.scss";
import { Panels, Panel } from "../../panels/TS/panels.ts";
import "../../hotkeys/SCSS/hotkeys.scss";
import { Hotkeys } from "../../hotkeys/TS/hotkeys.ts";
import "../SCSS/editor.scss";
import { Editor } from "./editor.ts";

const hotkeys = new Hotkeys();

const panels = new Panels();
document.body.append(panels);

const panel_1: Panel = panels.new_panel();
panel_1.content.textContent = "Hello, world!";

const panel_2: Panel = panels.new_panel({
	resizable: true,
	preservable: true,
	spawn_at_random: false,
	spawn_at_cursor: false,
});
panel_2.content.append(new Editor());

// const panel_3: Panel = panels.new_panel();
// panel_3.content.innerHTML = `<a href="normalize.html">Normalize</a>`;

hotkeys.set({
	key: "r",
	short: "Changing content",
	long: "Changing content on the panel to whatever",
	func: () => {
		let focused = panels.focused;
		if (focused === undefined) return;
		focused.content.textContent = "Panel content changed!";
	},
	experimental: true,
});

hotkeys.set({
	key: "n",
	short: "New panel",
	long: "Create a new panel",
	func: () => panels.new_panel(),
	experimental: true,
});

hotkeys.set({
	key: "h",
	short: "Hotkeys",
	long: "Display the hotkeys panel",
	func: () => hotkeys.toggle_modal(),
	experimental: false,
});

// actionbar: HTMLDivElement = document.createElement("div");
// folders: HTMLDivElement = document.createElement("div");

interface Token {
	kind: string;
	value: string;
	pos: [number, number];
}

const panelElements: NodeListOf<Element> = document.querySelectorAll(".editor");

panelElements.forEach(async (panel: Element) => {
	const margin: Element | null = panel.querySelector(".margin");
	const lines: Element | null = panel.querySelector(".lines");
	const viewport: Element | null = panel.querySelector(".viewport");

	if (!margin || !lines || !viewport) {
		console.error("An editor is missing some sub-elements");
		return;
	}

	viewport.addEventListener("scroll", () => {
		if (margin) margin.scrollTop = viewport.scrollTop;
	});

	const scroll_chunk = 24;
	viewport.addEventListener("wheel", (event: Event) => {
		if (event instanceof WheelEvent) {
			const delta = event.deltaY;
			const isNegative = delta < 0;
			viewport.scrollTop += scroll_chunk * (isNegative ? -1 : 1);
			event.preventDefault();
		}
	});

	// const tabWidth = 4;
	// const spaceCharacter = "·";

	let tokens_serialized = await invoke("tokenize_random_file", {});
	let tokens_array: Token[] = JSON.parse(tokens_serialized as string);

	let current_line = 0;
	let tokens: HTMLElement | null = null;
	tokens_array.forEach(({ kind, value, pos: [line, _column] }) => {
		// value = value.replace(/\t/g, " ".repeat(tabWidth));
		// value = value.replace(/ /g, spaceCharacter);
		// value = value.replace(/\n/g, "⏎");

		let newlines = line - current_line;
		if (newlines > 0) {
			for (let i = 1; i <= newlines; i++) {
				current_line += 1;

				// SECTION : Margin number
				const marginNumber = document.createElement("div");
				marginNumber.classList.add("number");
				marginNumber.textContent = current_line.toString();
				margin?.appendChild(marginNumber);

				// SECTION : Line
				const line_elem = document.createElement("div");
				line_elem.classList.add("line");
				lines?.appendChild(line_elem);

				// SECTION : Tokens wrapper
				tokens = document.createElement("div");
				tokens.classList.add("tokens");
				line_elem?.appendChild(tokens);
			}
		}

		if (tokens) {
			const token = document.createElement("span");
			token.classList.add(kind, "rust", "token");
			token.textContent = value;
			tokens.appendChild(token);
		}
	});
});
