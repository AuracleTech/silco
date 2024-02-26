import { invoke } from "@tauri-apps/api/tauri";
import { Panels, Panel } from "./panels.ts";
import { hotkey_add } from "./hotkeys.ts";

const panels = new Panels();
document.body.append(panels);

const panel_1: Panel = panels.new_panel();
panel_1.content.textContent = "Hello, world!";

const options = {
	resizable: true,
	preservable: true,
	spawn_at_random: true,
	spawn_at_cursor: false,
};
const panel_2: Panel = panels.new_panel(options);

const panel_3: Panel = panels.new_panel();
panel_3.content.innerHTML = `<a href="normalize.html">Normalize</a>`;

hotkey_add(
	"r",
	"Reconstruct Network",
	"Reconstruct network on current panel using current choices",
	() => alert("Reconstructing network!"),
	true
);
hotkey_add("n", "New panel", "New panel", () => panels.new_panel());

// actionbar: HTMLDivElement = document.createElement("div");
// folders: HTMLDivElement = document.createElement("div");

class Editor extends HTMLElement {
	margin: HTMLDivElement = document.createElement("div");
	viewport: HTMLDivElement = document.createElement("div");
	lines: HTMLDivElement = document.createElement("div");

	constructor() {
		super();

		this.classList.add("editor");
		this.margin.classList.add("margin");
		this.lines.classList.add("lines");
		this.viewport.classList.add("viewport");

		// contenteditable="true" spellcheck="false"
		this.setAttribute("contenteditable", "true");
		this.setAttribute("spellcheck", "false");

		this.viewport.append(this.lines);
		this.append(this.margin, this.viewport);
	}
}
customElements.define("custom-editor", Editor);

panel_2.content.append(new Editor());

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
