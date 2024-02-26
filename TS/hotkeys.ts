const HOTKEYS_TIP_DIV: HTMLDivElement = document.createElement("div");
HOTKEYS_TIP_DIV.id = "hotkeys_tip";
document.body.append(HOTKEYS_TIP_DIV);

const MODAL_DIV: HTMLDivElement = document.createElement("div");
MODAL_DIV.id = "modal";
MODAL_DIV.classList.add("hidden");
document.body.append(MODAL_DIV);

const PREVIEW_DIV: HTMLDivElement = document.createElement("div");
PREVIEW_DIV.id = "keypress_preview";
PREVIEW_DIV.classList.add("hidden");
document.body.append(PREVIEW_DIV);

const hotkeys_div: HTMLDivElement = document.createElement("div");
hotkeys_div.id = "hotkeys";
MODAL_DIV.append(hotkeys_div);

const keyboard_div: HTMLDivElement = document.createElement("div");
keyboard_div.id = "keyboard";
hotkeys_div.append(keyboard_div);

const KEYDOWN_AUDIO: HTMLAudioElement[] = [
	new Audio("/AUDIO/key_down_0.mp3"),
	new Audio("/AUDIO/key_down_1.mp3"),
	new Audio("/AUDIO/key_down_2.mp3"),
];
const KEYBOARD_KEYS: string[][] = [
	[
		"esc",
		"f1",
		"f2",
		"f3",
		"f4",
		"f5",
		"f6",
		"f7",
		"f8",
		"f9",
		"f10",
		"f11",
		"f12",
	],
	["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "back"],
	["tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
	["caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "enter"],
	["l shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "r shift"],
	["l ctrl", "cmd", "l alt", "space", "r alt", "r ctrl"],
];
let keys_dom: { [key: string]: HTMLDivElement } = {},
	hotkeys: {
		[key: string]: {
			key: string;
			short: string;
			long: string;
			func: () => void;
			wip: boolean;
		};
	} = {};

function init_hotkeys(): void {
	construct_hotkeys_modal();

	const animationDuration =
		getComputedStyle(HOTKEYS_TIP_DIV).getPropertyValue("animation-duration");
	const animationDelay =
		getComputedStyle(HOTKEYS_TIP_DIV).getPropertyValue("animation-delay");

	const animationDurationMs = parseFloat(animationDuration) * 1000;
	const animationDelayMs = parseFloat(animationDelay) * 1000;

	console.log(animationDurationMs, animationDelayMs);

	setTimeout(() => {
		HOTKEYS_TIP_DIV.remove();
	}, animationDurationMs + animationDelayMs);
}

function construct_hotkeys_modal(): void {
	for (const row of KEYBOARD_KEYS) {
		const row_div: HTMLDivElement = document.createElement("div");
		row_div.classList.add("row");
		keyboard_div.append(row_div);
		for (const key of row) {
			const key_div: HTMLDivElement = document.createElement("div");
			key_div.classList.add("key");
			key_div.textContent = key;
			row_div.append(key_div);
			keys_dom[key] = key_div;
			for (const hotkey1 in hotkeys) {
				if (hotkeys[hotkey1].key == key) {
					const pophover_div: HTMLDivElement = document.createElement("div");
					key_div.classList.add("used");
					pophover_div.classList.add("pophover");
					key_div.append(pophover_div);
					pophover_div.textContent = hotkeys[hotkey1].long;
					if (hotkeys[hotkey1].wip) {
						key_div.classList.add("wip");
						const WIP_ICON_DIV: HTMLSpanElement =
							document.createElement("span");
						WIP_ICON_DIV.classList.add("wip_icon");
						WIP_ICON_DIV.innerText = "WIP 🧪";
						pophover_div.append(WIP_ICON_DIV);
					}
				}
			}
			if (key == ("back" || "tab" || "enter" || "caps" || "shift" || "ctrl"))
				key_div.classList.add("large");
			else if (key == "space") key_div.classList.add("space");
		}
	}
}

//FIX MAKE SURE TO BE ABLE TO DELETE HOTKEYS AND THEY GET DISPLAYED IN REAL TIME

// TODO Live update the modal when hotkeys are added/removed
function hotkey_add(
	key: string,
	short: string,
	long: string,
	func: () => void,
	wip: boolean = false
): string | undefined {
	key = key.toLowerCase();
	if (hotkeys[key]) {
		console.error(`Hotkey already exists '${key}'`);
		return;
	}
	hotkeys[key] = {
		key,
		short,
		long,
		func,
		wip,
	};
	return key;
}
function hotkey_del(key: string): void {
	// TODO : Delete and update modal
	delete hotkeys[key];
}

function play_audio(): void {
	const audio: HTMLAudioElement = KEYDOWN_AUDIO[
		Math.floor(Math.random() * KEYDOWN_AUDIO.length)
	].cloneNode() as HTMLAudioElement;
	audio.play();
}

function preview_key(key: { short: string; wip: boolean }): void {
	PREVIEW_DIV.classList.remove("keypress");
	void PREVIEW_DIV.offsetWidth;
	PREVIEW_DIV.classList.add("keypress");
	const txt: string = `${key.short}${key.wip ? "🧪" : ""}`;
	PREVIEW_DIV.textContent = txt;
}

function keydown(ev: KeyboardEvent): void {
	let key: string = ev.key.toLowerCase();

	// TODO implement combos / special keys
	// const SHIFT: boolean = ev.shiftKey;
	// const CTRL: boolean = ev.ctrlKey;
	// const ALT: boolean = ev.altKey;
	// const META: boolean = ev.metaKey;

	switch (key) {
		case "control":
			key = `${ev.location == 1 ? "l" : "r"} ctrl`;
			break;
		case "shift":
			key = `${ev.location == 1 ? "l" : "r"} shift`;
			break;
		case "meta":
			key = "cmd";
			break;
		case " ":
			key = "space";
			break;
		case "capslock":
			key = "caps";
			break;
		case "escape":
			key = "esc";
			break;
		case "alt":
			key = `${ev.location == 1 ? "l" : "r"} alt`;
			break;
		case "backspace":
			key = "back";
			break;
	}

	if (
		document.activeElement instanceof HTMLInputElement ||
		document.activeElement instanceof HTMLTextAreaElement ||
		(document.activeElement as Element & { isContentEditable: boolean })
			.isContentEditable
	)
		return;
	if (!keys_dom[key]) return;
	if (!hotkeys[key]) return;

	ev.preventDefault();
	play_audio();
	preview_key(hotkeys[key]);
	hotkeys[key].func();
}

function toggle_modal(id?: string): void {
	MODAL_DIV.classList.toggle("hidden");
	for (const child of MODAL_DIV.children) child.classList.add("hidden");
	if (id)
		(MODAL_DIV.querySelector(`#${id}`) as HTMLElement).classList.remove(
			"hidden"
		);
}

addEventListener("load", init_hotkeys, { once: true });
addEventListener("keydown", keydown);
addEventListener("paste", () => {
	if (hotkeys["paste"]) {
		hotkeys["paste"].func();
	}
});

MODAL_DIV.addEventListener(
	"click",
	(ev) => ev.target == MODAL_DIV && toggle_modal()
);
hotkey_add("k", "Toggle Hotkeys", "Toggle hotkeys modal", () =>
	toggle_modal("hotkeys")
);

export { hotkey_add, hotkey_del };
