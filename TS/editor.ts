import { invoke } from "@tauri-apps/api/tauri";

interface Token {
	kind: string;
	value: string;
	pos: [number, number];
}

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

		this.lines.setAttribute("contenteditable", "true");
		this.setAttribute("spellcheck", "false");

		this.viewport.append(this.lines);
		this.append(this.margin, this.viewport);

		this.viewport.addEventListener("scroll", () => {
			this.margin.scrollTop = this.viewport.scrollTop;
		});
	}

	async init() {
		this.viewport.addEventListener("scroll", () => {
			this.margin.scrollTop = this.viewport.scrollTop;
		});

		const scroll_chunk = 24;
		this.viewport.addEventListener("wheel", (event: Event) => {
			if (event instanceof WheelEvent) {
				const delta = event.deltaY;
				const isNegative = delta < 0;
				this.viewport.scrollTop += scroll_chunk * (isNegative ? -1 : 1);
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
					this.margin.appendChild(marginNumber);

					// SECTION : Line
					const line_elem = document.createElement("div");
					line_elem.classList.add("line");
					this.lines.appendChild(line_elem);

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
	}
}
customElements.define("custom-editor", Editor);

export { Editor };
