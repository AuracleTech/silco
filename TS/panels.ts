let cursor_pos = { x: 0, y: 0 };
addEventListener(
	"mousemove",
	(ev) => (cursor_pos = { x: ev.clientX, y: ev.clientY })
);

class Panels extends HTMLElement {
	panels: Panel[] = [];
	focused?: Panel;

	constructor() {
		super();
		this.classList.add("panels");
		this.id = `${Date.now()}${Math.random().toString(36).slice(2)}`;

		this.addEventListener("contextmenu", (ev) => {
			ev.target === ev.currentTarget && this.set_focused();
		});
		this.addEventListener("pointerdown", (ev) => {
			ev.target === ev.currentTarget && this.set_focused();
		});
		const resizeObserver = new ResizeObserver(() => {
			this.panels.forEach((p) => p.reposition());
		});
		resizeObserver.observe(this);
	}

	new_panel(options?: PanelOptions): Panel {
		const panel = new Panel(this, options);
		this.panels.push(panel);
		this.append(panel);
		this.set_focused(panel);
		return panel;
	}

	set_focused(panel?: Panel) {
		this.panels = this.panels.filter((p) => p !== panel);
		if (panel) this.panels.push(panel);
		this.panels.forEach((p, i) => {
			p.classList.remove("focus");
			p.style.zIndex = i.toString();
		});
		this.focused = panel;
		if (this.focused) this.focused.classList.add("focus");
	}

	get_focused(): Panel | undefined {
		return this.focused;
	}

	close_panel(panel: Panel) {
		panel.remove();
		this.panels = this.panels.filter((p) => p !== panel);
		this.set_focused();
	}
}
customElements.define("custom-wall", Panels);

interface PanelOptions {
	resizable: boolean;
	preservable: boolean;
	spawn_at_random: boolean;
	spawn_at_cursor: boolean;
}
class Panel extends HTMLElement {
	bar: HTMLDivElement = document.createElement("div");
	close: HTMLDivElement = document.createElement("div");
	grab: HTMLDivElement = document.createElement("div");
	resize: HTMLDivElement = document.createElement("div");
	alternate: HTMLDivElement = document.createElement("div");
	squish: HTMLDivElement = document.createElement("div");
	content: HTMLDivElement = document.createElement("div");
	parent: Panels;
	options: PanelOptions = {
		resizable: false,
		preservable: false,
		spawn_at_random: true,
		spawn_at_cursor: false,
	};
	preserved?: {
		width: number;
		height: number;
		top: number;
		left: number;
	};
	squished?: {
		size: { width: number; height: number };
		pos: { top: number; left: number };
	};

	constructor(parent: Panels, options?: PanelOptions) {
		super();

		this.parent = parent;

		this.options = {
			...this.options,
			...options,
		};

		this.close.title = "Close";
		this.resize.title = "Resize";
		this.alternate.title = "Preserve";
		this.squish.title = "Squish";

		this.classList.add("panel");
		this.bar.classList.add("bar");
		this.close.classList.add("close", "option");
		this.grab.classList.add("grab");
		this.resize.classList.add("resize", "option");
		this.alternate.classList.add("alternate", "option");
		this.squish.classList.add("squish", "option");
		this.content.classList.add("content");

		this.bar.append(this.close, this.grab);
		if (this.options.resizable) this.bar.append(this.resize);
		if (this.options.preservable) this.bar.append(this.alternate);
		this.bar.append(this.squish);
		this.append(this.bar, this.content);

		this.addEventListener("pointerdown", () => {
			this.parent.set_focused(this);
		});
		const resizeObserver = new ResizeObserver((entries) =>
			entries.forEach((entry) => {
				const panel = entry.target as Panel;
				this.reposition({ top: panel.offsetTop, left: panel.offsetLeft });
			})
		);
		resizeObserver.observe(this);
		this.close.addEventListener("pointerup", (ev) => this.fclose(ev));
		this.grab.addEventListener("pointerdown", (ev) => this.fgrab(ev));
		if (this.options.resizable)
			this.grab.addEventListener("dblclick", () => this.maximize());
		else this.grab.addEventListener("dblclick", () => this.fsquish());
		this.resize.addEventListener("click", () => this.resizing());
		this.alternate.addEventListener("click", () => this.falternate());
		this.squish.addEventListener("click", () => this.fsquish());

		if (this.options.spawn_at_random)
			this.reposition({
				top: Math.round(
					Math.random() * (this.parent.clientHeight - this.clientHeight)
				),
				left: Math.round(
					Math.random() * (this.parent.clientWidth - this.clientWidth)
				),
			});
		else if (this.options.spawn_at_cursor)
			this.reposition({
				top: cursor_pos.y,
				left: cursor_pos.x,
			});
	}

	fclose(ev: MouseEvent) {
		ev.stopPropagation();
		this.parent.close_panel(this);
	}

	fgrab(ev: PointerEvent) {
		const y = ev.clientY - this.offsetTop;
		const x = ev.clientX - this.offsetLeft;
		const pointermove = (ev: PointerEvent) =>
			this.reposition({
				top: ev.clientY - y,
				left: ev.clientX - x,
			});
		const pointerup = () => {
			this.parent.classList.remove("numb", "grabbing");
			removeEventListener("pointermove", pointermove);
		};
		this.parent.classList.add("numb", "grabbing");
		addEventListener("pointermove", pointermove);
		addEventListener("pointerup", pointerup, { once: true });
	}

	resizing() {
		// FIX resizing do not take into account CSS min-width and min-height when resizing in negative direction
		this.parent.classList.add("numb", "resizing");
		const down = (ev: PointerEvent) => {
			const down_pos = this.resizing_clamp(ev);
			const move = (ev: PointerEvent) => {
				const snap = 16;
				const move_pos = this.resizing_clamp(ev);
				let top = Math.min(move_pos.y, down_pos.y);
				let left = Math.min(move_pos.x, down_pos.x);
				let right = Math.max(move_pos.x, down_pos.x);
				let bottom = Math.max(move_pos.y, down_pos.y);
				top = top < snap ? 0 : top;
				left = left < snap ? 0 : left;
				right =
					right > this.parent.clientWidth - snap
						? this.parent.clientWidth
						: right;
				bottom =
					bottom > this.parent.clientHeight - snap
						? this.parent.clientHeight
						: bottom;
				const width = right - left;
				const height = bottom - top;
				this.fresize({ width, height });
				this.reposition({ top, left });
			};
			const up = () => {
				this.parent.classList.remove("numb", "resizing");
				removeEventListener("pointermove", move);
			};
			addEventListener("pointermove", move);
			addEventListener("pointerup", up, { once: true });
		};
		addEventListener("pointerdown", down, { once: true });
	}

	resizing_clamp(ev: PointerEvent) {
		return {
			x: Math.max(0, Math.min(ev.clientX, this.parent.clientWidth)),
			y: Math.max(0, Math.min(ev.clientY, this.parent.clientHeight)),
		};
	}

	falternate() {
		this.alternate.classList.toggle("restore");
		this.alternate.title = this.preserved ? "Preserve" : "Restore";
		if (!this.preserved)
			this.preserved = {
				width: this.clientWidth,
				height: this.clientHeight,
				top: this.offsetTop,
				left: this.offsetLeft,
			};
		else {
			const { width, height, top, left } = this.preserved!;
			this.fresize({ width, height });
			this.reposition({ top, left });
			this.preserved = undefined;
		}
	}

	fsquish() {
		if (this.squished) {
			if (this.options.resizable) this.fresize(this.squished.size);
			else this.reposition(this.squished.pos);
			this.squished = undefined;
		} else {
			this.squished = {
				size: {
					width: this.clientWidth,
					height: this.clientHeight,
				},
				pos: {
					top: this.offsetTop,
					left: this.offsetLeft,
				},
			};
			this.fresize();
		}
		this.classList.toggle("squish");
	}

	maximize() {
		if (
			this.clientWidth === this.parent.clientWidth &&
			this.clientHeight === this.parent.clientHeight
		)
			this.fresize();
		else
			this.fresize({
				width: this.parent.clientWidth,
				height: this.parent.clientHeight,
			});
	}

	reposition(positions?: { top: number; left: number }) {
		if (!positions) positions = { top: this.offsetTop, left: this.offsetLeft };
		let { top, left } = positions;
		top = Math.max(
			0,
			Math.min(top, this.parent.clientHeight - this.clientHeight)
		);
		left = Math.max(
			0,
			Math.min(left, this.parent.clientWidth - this.clientWidth)
		);
		this.style.top = `${top}px`;
		this.style.left = `${left}px`;
		this.dispatchEvent(
			new CustomEvent("reposition", { detail: { top, left } })
		);
	}

	fresize(size?: { width?: number; height?: number }) {
		const { width, height } = size || {};
		this.style.width = width !== null ? `${width}px` : "";
		this.style.height = height !== null ? `${height}px` : "";
		this.dispatchEvent(
			new CustomEvent("resize", { detail: { width, height } })
		);
	}
}
customElements.define("custom-panel", Panel);

export { Panels, Panel };
