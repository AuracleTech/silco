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
	render_area: HTMLDivElement = document.createElement("div");
	source: HTMLDivElement = document.createElement("div");
	render: HTMLDivElement = document.createElement("div");
	lines: HTMLDivElement = document.createElement("div");

	constructor() {
		super();

		this.classList.add("editor");
		this.margin.classList.add("margin");
		this.render_area.classList.add("render_area");
		this.source.classList.add("source");
		this.lines.classList.add("lines");
		this.render.classList.add("render");

		this.source.setAttribute("spellcheck", "false");
		this.source.setAttribute("contenteditable", "true");

		this.render.append(this.lines);
		this.render_area.append(this.source, this.render);
		this.append(this.margin, this.render_area);

		this.render.addEventListener("scroll", () => {
			this.source.scrollTop = this.render.scrollTop;
			this.source.scrollLeft = this.render.scrollLeft;
			this.margin.scrollTop = this.render.scrollTop;
		});

		// this.addEventListener("wheel", (event: WheelEvent) => {
		// 	const delta = event.deltaY;
		// 	const isNegative = delta < 0;
		// 	this.viewport.scrollTop += line_height * (isNegative ? -1 : 1);
		// 	this.keygrab.scrollTop = this.viewport.scrollTop;
		// 	this.margin.scrollTop += line_height * (isNegative ? -1 : 1);
		// 	event.preventDefault();
		// });

		this.source.addEventListener("input", () => this.input());
		this.source.addEventListener("paste", (ev) => this.paste(ev));

		this.source.textContent = `use log::{info, warn};
use std::sync::mpsc;
use winit::{
    event::{ElementState, Event, KeyboardInput, VirtualKeyCode, WindowEvent},
    event_loop::ControlFlow,
};
let result = 5 ^ 3;
let floating = 5.3;

const APP_VERSION: u32 = 30012024;
const WIN_TITLE: &str = env!("CARGO_PKG_NAME");
const WIN_INIT_WIDTH: u32 = 512;
const WIN_INIT_HEIGHT: u32 = 512;

enum EngineEvent {
    RecreateSurface,
    PauseRendering,
    ResumeRendering,
}

const RANDOM_CHAT: Char = 'e';

fn main() {
    let (mut engine, event_loop) =
        swain::Engine::new(APP_VERSION, WIN_TITLE, WIN_INIT_WIDTH, WIN_INIT_HEIGHT);

    let (engine_event_tx, engine_event_rx) = mpsc::channel() && mpsc::channel() && mpsc::channel() && mpsc::channel() && mpsc::channel() && mpsc::channel();

    // SECTION : Drawing thread
    let _handle = std::thread::spawn(move || {
        let mut recreate_surface = false;
        let mut rendering = true;

        loop {
            println!("drawing thread");
            while let Ok(event) = engine_event_rx.try_recv() {
                match event {
                    EngineEvent::RecreateSurface => recreate_surface = true,
                    EngineEvent::PauseRendering => rendering = false,
                    EngineEvent::ResumeRendering => rendering = true,
                }
            }
            println!("no events");

            if recreate_surface {
                info!("recreating surface");

                // engine.recreate_surface();

                recreate_surface = false;
            }

            if rendering {
                unsafe {
                    engine.draw();
                }
            }

            let elapsed = engine.last_frame_time.elapsed();
            if elapsed > *swain::DRAW_TIME_MAX {
                warn!(
                    "late by {} ms, restating frame immediately",
                    elapsed.as_millis()
                );
            } else {
                let sleep_duration = *swain::DRAW_TIME_MAX - elapsed;
                std::thread::sleep(sleep_duration);
            }
        }
    });

    // SECTION : Winit event loop
    let mut rendering = true;

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Poll;

        match event {
            Event::WindowEvent { event, .. } => match event {
                WindowEvent::CloseRequested => *control_flow = ControlFlow::Exit,
                WindowEvent::KeyboardInput {
                    input:
                        KeyboardInput {
                            state: ElementState::Pressed,
                            virtual_keycode: Some(VirtualKeyCode::Escape),
                            ..
                        },
                    ..
                } => *control_flow = ControlFlow::Exit,
                WindowEvent::KeyboardInput {
                    input:
                        KeyboardInput {
                            state: ElementState::Pressed,
                            virtual_keycode: Some(VirtualKeyCode::Space),
                            ..
                        },
                    ..
                } => {
                    if rendering {
                        engine_event_tx.send(EngineEvent::PauseRendering).unwrap();
                    } else {
                        engine_event_tx.send(EngineEvent::ResumeRendering).unwrap();
                    }
                    rendering = !rendering;
                }
                WindowEvent::Resized(_) => {
                    engine_event_tx.send(EngineEvent::RecreateSurface).unwrap()
                }
                _ => (),
            },
            _ => (),
        }
    })
}`; // TEMP
		this.tokenize_content(); // TEMP
	}

	input() {
		const source = this.source.textContent;
		if (source === null) return;
		this.source.textContent = source;
		this.tokenize_content();
	}

	paste(ev: ClipboardEvent) {
		ev.preventDefault();
		const selection = window.getSelection();
		if (!selection) return console.log("no selection");
		const range = selection.getRangeAt(0);
		const selectionStart = range.startOffset;
		const selectionEnd = range.endOffset;

		const clipboardData = ev.clipboardData;
		if (!clipboardData) return;
		const pastedText = clipboardData.getData("text/plain");

		if (this.source.textContent === null) return;

		const textBeforePaste = this.source.textContent.substring(
			0,
			selectionStart
		);
		const textAfterPaste = this.source.textContent.substring(selectionEnd);
		const newText = textBeforePaste + pastedText + textAfterPaste;

		this.source.textContent = newText;

		// TODO : NEED TO REPLACE THIS
		// this.source.setSelectionRange(newPosition, newPosition);
		const newPosition = textBeforePaste.length + pastedText.length;
		selection.collapse(this.source.firstChild, newPosition);

		this.tokenize_content();
	}

	async tokenize_content() {
		let tokens_serialized = await invoke("tokenize", {
			source: this.source.textContent,
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
