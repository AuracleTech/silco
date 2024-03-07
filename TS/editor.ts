import { invoke } from "@tauri-apps/api/tauri";

interface Token {
	kind: string;
	value: string;
	pos: [number, number];
}

const rootStyles = getComputedStyle(document.documentElement);
// NOTE : NOT REAL TIME UPDATE
const line_height = parseInt(rootStyles.getPropertyValue("--line-height"));
// const tabWidth = 4;
// const spaceCharacter = "·";

class Editor extends HTMLElement {
	margin: HTMLDivElement = document.createElement("div");
	keygrab: HTMLTextAreaElement = document.createElement("textarea");
	viewport: HTMLDivElement = document.createElement("div");
	lines: HTMLDivElement = document.createElement("div");
	source: string = "";

	constructor() {
		super();

		this.classList.add("editor");
		this.keygrab.classList.add("keygrab");
		this.margin.classList.add("margin");
		this.lines.classList.add("lines");
		this.viewport.classList.add("viewport");

		this.keygrab.setAttribute("spellcheck", "false");

		this.viewport.append(this.keygrab, this.lines);
		this.append(this.margin, this.viewport);

		this.keygrab.addEventListener("scroll", () => {
			this.viewport.scrollTop = this.keygrab.scrollTop;
			this.margin.scrollTop = this.keygrab.scrollTop;
			this.viewport.scrollLeft = this.keygrab.scrollLeft;
		});

		this.keygrab.addEventListener("wheel", (event: WheelEvent) => {
			const delta = event.deltaY;
			const isNegative = delta < 0;
			this.viewport.scrollTop += line_height * (isNegative ? -1 : 1);
			this.margin.scrollTop += line_height * (isNegative ? -1 : 1);
			event.preventDefault();
		});

		this.keygrab.addEventListener("input", (ev) => this.input(ev));
		this.keygrab.addEventListener("paste", (ev) => this.paste(ev));
	}

	input(ev: Event) {
		const source = this.keygrab.textContent;
		if (source === null) return;
		this.source = source;
		this.tokenize_content();
	}

	paste(ev: ClipboardEvent) {
		ev.preventDefault();
		if (this.keygrab.selectionStart === null) return;
		if (this.keygrab.selectionEnd === null) return;

		const clipboardData = ev.clipboardData;
		if (!clipboardData) return;
		const pastedText = clipboardData.getData("text/plain");

		const textBeforePaste = this.keygrab.value.substring(
			0,
			this.keygrab.selectionStart
		);
		const textAfterPaste = this.keygrab.value.substring(
			this.keygrab.selectionEnd
		);
		const newText = textBeforePaste + pastedText + textAfterPaste;

		this.keygrab.value = newText;

		const newPosition = this.keygrab.selectionStart + pastedText.length;
		this.keygrab.setSelectionRange(newPosition, newPosition);

		this.tokenize_content();
	}

	async tokenize_content() {
		let tokens_serialized = await invoke("tokenize", {
			source: this.keygrab.value,
		});
		let tokens_array: Token[] = JSON.parse(tokens_serialized as string);

		this.lines.innerHTML = "";
		this.margin.innerHTML = "";

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
	// TEST : This verifies back/front end are synced
	// if (this.source !== this.lines.textContent) {
	// 	console.error("source and lines.textContent are different");
	// 	console.log(`%c${this.lines.textContent}`, "color: #8354d6");
	// 	console.log(`%c${this.source}`, "color: #479bc9");
	// }
}
customElements.define("custom-editor", Editor);

export { Editor };
