use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub is_file: bool,
    pub extension: Option<String>,
    pub size: Option<u64>,
    pub modified: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileContent {
    pub path: String,
    pub content: String,
    pub size: u64,
}

#[tauri::command]
pub fn read_directory(path: &str) -> Result<Vec<FileEntry>, String> {
    let dir_path = Path::new(path);

    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let mut entries: Vec<FileEntry> = Vec::new();

    match fs::read_dir(dir_path) {
        Ok(dir_entries) => {
            for entry in dir_entries {
                if let Ok(entry) = entry {
                    let file_path = entry.path();
                    let metadata = entry.metadata().ok();

                    let file_entry = FileEntry {
                        name: entry.file_name().to_string_lossy().to_string(),
                        path: file_path.to_string_lossy().to_string(),
                        is_directory: file_path.is_dir(),
                        is_file: file_path.is_file(),
                        extension: file_path
                            .extension()
                            .map(|e| e.to_string_lossy().to_string()),
                        size: metadata.as_ref().map(|m| m.len()),
                        modified: metadata.and_then(|m| {
                            m.modified().ok().and_then(|t| {
                                t.duration_since(std::time::UNIX_EPOCH)
                                    .ok()
                                    .map(|d| d.as_secs())
                            })
                        }),
                    };

                    entries.push(file_entry);
                }
            }

            // Sort: directories first, then alphabetically
            entries.sort_by(|a, b| {
                match (a.is_directory, b.is_directory) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                }
            });

            Ok(entries)
        }
        Err(e) => Err(format!("Failed to read directory: {}", e)),
    }
}

#[tauri::command]
pub fn read_file(path: &str) -> Result<FileContent, String> {
    let file_path = Path::new(path);

    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }

    match fs::read_to_string(file_path) {
        Ok(content) => {
            let metadata = fs::metadata(file_path).ok();
            Ok(FileContent {
                path: path.to_string(),
                content,
                size: metadata.map(|m| m.len()).unwrap_or(0),
            })
        }
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[tauri::command]
pub fn write_file(path: &str, content: &str) -> Result<(), String> {
    let file_path = Path::new(path);

    // Ensure parent directory exists
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory: {}", e))?;
        }
    }

    fs::write(file_path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn create_file(path: &str, content: Option<String>) -> Result<(), String> {
    let file_path = Path::new(path);

    if file_path.exists() {
        return Err(format!("File already exists: {}", path));
    }

    // Ensure parent directory exists
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory: {}", e))?;
        }
    }

    let file_content = content.unwrap_or_default();
    fs::write(file_path, file_content).map_err(|e| format!("Failed to create file: {}", e))
}

#[tauri::command]
pub fn delete_file(path: &str) -> Result<(), String> {
    let file_path = Path::new(path);

    if !file_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    if file_path.is_dir() {
        fs::remove_dir_all(file_path).map_err(|e| format!("Failed to delete directory: {}", e))
    } else {
        fs::remove_file(file_path).map_err(|e| format!("Failed to delete file: {}", e))
    }
}

#[tauri::command]
pub fn rename_file(old_path: &str, new_path: &str) -> Result<(), String> {
    let old = Path::new(old_path);
    let new = Path::new(new_path);

    if !old.exists() {
        return Err(format!("Source path does not exist: {}", old_path));
    }

    if new.exists() {
        return Err(format!("Destination path already exists: {}", new_path));
    }

    fs::rename(old, new).map_err(|e| format!("Failed to rename: {}", e))
}

#[tauri::command]
pub fn file_exists(path: &str) -> bool {
    Path::new(path).exists()
}

#[tauri::command]
pub fn create_directory(path: &str) -> Result<(), String> {
    let dir_path = Path::new(path);

    if dir_path.exists() {
        if dir_path.is_dir() {
            return Ok(()); // Directory already exists
        }
        return Err(format!("Path exists but is not a directory: {}", path));
    }

    fs::create_dir_all(dir_path).map_err(|e| format!("Failed to create directory: {}", e))
}
