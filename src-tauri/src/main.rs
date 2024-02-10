// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use jayce::{duos, Tokenizer};
use regex::Regex;
use tauri::Window;

const _SOURCE: &str = "Excalibur = 5000$; // Your own language!";

lazy_static::lazy_static! (
    static ref DUOS: Vec<(&'static str, Regex)> = duos![
        "whitespace", r"^[^\S\n]+",
        "comment_line", r"^//(.*)",
        "comment_block", r"^/\*(.|\n)*?\*/",
        "newline", r"^\n",

        "price", r"^[0-9]+\$",
        "semicolon", r"^;",
        "operator", r"^=",
        "name", r"^[a-zA-Z_]+"
    ];
);

const SOURCE_RUST: &str = r#"use log::{info, warn};
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
}"#;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![init_process, tokenize_random_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn init_process(window: Window) {
    let mut tokenizer = Tokenizer::new(SOURCE_RUST, &jayce::internal::DUOS_RUST);

    let mut tokens = Vec::new();

    while let Some(token) = tokenizer.next().unwrap() {
        tokens.push(token);
    }

    std::thread::spawn(move || loop {
        window.emit("event-name", &tokens).unwrap();
    });
}

#[tauri::command]
fn tokenize_random_file() -> String {
    let mut tokenizer = Tokenizer::new(SOURCE_RUST, &jayce::internal::DUOS_RUST);

    let mut tokens = Vec::new();

    while let Some(token) = tokenizer.next().unwrap() {
        tokens.push(token);
    }

    let serialized = serde_json::to_string(&tokens).unwrap();

    serialized
}
