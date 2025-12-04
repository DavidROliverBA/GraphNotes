// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod commands;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            delete_file,
            rename_file,
            create_directory,
            path_exists,
            list_directory,
            list_markdown_files,
            get_file_tree,
            init_vault,
            is_vault,
            grep_search,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
