class Terminal extends HTMLElement {
	constructor() {
		super();
	}

	print(text: string): HTMLDivElement {
		const isScrolledToBottom = this.is_scrolled_bottom();
		const line = document.createElement("div");
		line.textContent = text;
		this.append(line);
		if (isScrolledToBottom) this.scroll_bottom();
		return line;
	}

	eprint(text: string) {
		const line = this.print(text);
		line.classList.add("error");
	}

	private is_scrolled_bottom(): boolean {
		const parent = this.parentNode as HTMLElement;
		return parent.scrollTop + parent.clientHeight >= parent.scrollHeight;
	}

	private scroll_bottom() {
		const parent = this.parentNode as HTMLElement;
		parent.scrollTop = parent.scrollHeight;
	}
}

customElements.define("custom-terminal", Terminal);

export { Terminal };
