// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use jayce::Tokenizer;

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
