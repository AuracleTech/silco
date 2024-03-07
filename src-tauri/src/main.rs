// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use jayce::{duos, Tokenizer};
use regex::Regex;
// use tauri::Window;

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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![tokenize])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn tokenize(source: String) -> String {
    let mut tokenizer = Tokenizer::new(&source, &jayce::internal::DUOS_RUST);

    let mut tokens = Vec::new();

    while let Ok(Some(token)) = tokenizer.next() {
        tokens.push(token);
    }

    serde_json::to_string(&tokens).unwrap_or_else(|err| {
        eprintln!("Error serializing tokens: {}", err);
        String::new()
    })
}
