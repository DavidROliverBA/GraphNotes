mod commands;

use commands::files;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            files::read_directory,
            files::read_file,
            files::write_file,
            files::create_file,
            files::delete_file,
            files::rename_file,
            files::file_exists,
            files::create_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
