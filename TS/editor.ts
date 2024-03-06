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
}
customElements.define("custom-editor", Editor);

export { Editor };
