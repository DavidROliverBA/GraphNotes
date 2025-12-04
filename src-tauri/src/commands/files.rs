// src-tauri/src/commands/files.rs

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileEntry>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileContent {
    pub path: String,
    pub content: String,
    pub exists: bool,
}

/// Read the contents of a file
#[tauri::command]
pub fn read_file(path: String) -> Result<FileContent, String> {
    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Ok(FileContent {
            path,
            content: String::new(),
            exists: false,
        });
    }

    match fs::read_to_string(&path_buf) {
        Ok(content) => Ok(FileContent {
            path,
            content,
            exists: true,
        }),
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

/// Write content to a file (creates parent directories if needed)
#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);

    // Create parent directories if they don't exist
    if let Some(parent) = path_buf.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }

    fs::write(&path_buf, content).map_err(|e| format!("Failed to write file: {}", e))
}

/// Delete a file or directory
#[tauri::command]
pub fn delete_file(path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Ok(());
    }

    if path_buf.is_dir() {
        fs::remove_dir_all(&path_buf).map_err(|e| format!("Failed to delete directory: {}", e))
    } else {
        fs::remove_file(&path_buf).map_err(|e| format!("Failed to delete file: {}", e))
    }
}

/// Rename/move a file
#[tauri::command]
pub fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    let old_path_buf = PathBuf::from(&old_path);
    let new_path_buf = PathBuf::from(&new_path);

    if !old_path_buf.exists() {
        return Err(format!("Source file does not exist: {}", old_path));
    }

    // Create parent directories if they don't exist
    if let Some(parent) = new_path_buf.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }

    fs::rename(&old_path_buf, &new_path_buf).map_err(|e| format!("Failed to rename file: {}", e))
}

/// Create a new directory
#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    fs::create_dir_all(&path_buf).map_err(|e| format!("Failed to create directory: {}", e))
}

/// Check if a path exists
#[tauri::command]
pub fn path_exists(path: String) -> bool {
    PathBuf::from(&path).exists()
}

/// List directory contents (non-recursive, single level)
#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    if !path_buf.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let mut entries: Vec<FileEntry> = Vec::new();

    let read_dir = fs::read_dir(&path_buf).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in read_dir {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let entry_path = entry.path();
        let name = entry_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        // Skip hidden files and directories (except .graphnotes)
        if name.starts_with('.') && name != ".graphnotes" {
            continue;
        }

        entries.push(FileEntry {
            name,
            path: entry_path.to_string_lossy().to_string(),
            is_directory: entry_path.is_dir(),
            children: None,
        });
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

/// List all markdown files in a directory (recursive)
#[tauri::command]
pub fn list_markdown_files(path: String) -> Result<Vec<FileEntry>, String> {
    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    let mut entries: Vec<FileEntry> = Vec::new();

    for entry in WalkDir::new(&path_buf)
        .follow_links(true)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            // Skip hidden directories (except .graphnotes)
            !name.starts_with('.') || name == ".graphnotes"
        })
    {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let entry_path = entry.path();

        // Only include markdown files
        if entry_path.is_file() {
            if let Some(ext) = entry_path.extension() {
                if ext == "md" || ext == "markdown" {
                    let name = entry_path
                        .file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();

                    // Get relative path from the vault root
                    let relative_path = entry_path
                        .strip_prefix(&path_buf)
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_else(|_| entry_path.to_string_lossy().to_string());

                    entries.push(FileEntry {
                        name,
                        path: relative_path,
                        is_directory: false,
                        children: None,
                    });
                }
            }
        }
    }

    // Sort alphabetically by path
    entries.sort_by(|a, b| a.path.to_lowercase().cmp(&b.path.to_lowercase()));

    Ok(entries)
}

/// Build a file tree structure for a directory
#[tauri::command]
pub fn get_file_tree(path: String) -> Result<Vec<FileEntry>, String> {
    fn build_tree(path: &PathBuf, base_path: &PathBuf) -> Result<Vec<FileEntry>, String> {
        let mut entries: Vec<FileEntry> = Vec::new();

        let read_dir = fs::read_dir(path).map_err(|e| format!("Failed to read directory: {}", e))?;

        for entry in read_dir {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let entry_path = entry.path();
            let name = entry_path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();

            // Skip hidden files and directories (except .graphnotes)
            if name.starts_with('.') && name != ".graphnotes" {
                continue;
            }

            let is_directory = entry_path.is_dir();

            // For files, only include markdown files
            if !is_directory {
                if let Some(ext) = entry_path.extension() {
                    if ext != "md" && ext != "markdown" {
                        continue;
                    }
                } else {
                    continue;
                }
            }

            // Get relative path from the vault root
            let relative_path = entry_path
                .strip_prefix(base_path)
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|_| entry_path.to_string_lossy().to_string());

            let children = if is_directory {
                Some(build_tree(&entry_path, base_path)?)
            } else {
                None
            };

            entries.push(FileEntry {
                name,
                path: relative_path,
                is_directory,
                children,
            });
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

    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    build_tree(&path_buf, &path_buf)
}

/// Initialize a new vault with the .graphnotes directory
#[tauri::command]
pub fn init_vault(path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    let graphnotes_dir = path_buf.join(".graphnotes");

    // Create .graphnotes directory
    if !graphnotes_dir.exists() {
        fs::create_dir_all(&graphnotes_dir)
            .map_err(|e| format!("Failed to create .graphnotes directory: {}", e))?;
    }

    // Create events.jsonl if it doesn't exist
    let events_file = graphnotes_dir.join("events.jsonl");
    if !events_file.exists() {
        fs::write(&events_file, "")
            .map_err(|e| format!("Failed to create events.jsonl: {}", e))?;
    }

    // Create config.json if it doesn't exist
    let config_file = graphnotes_dir.join("config.json");
    if !config_file.exists() {
        let device_id = uuid::Uuid::new_v4().to_string();
        let config = serde_json::json!({
            "version": "1.0.0",
            "deviceId": device_id,
            "created": chrono_now(),
            "settings": {
                "theme": "dark",
                "editorFontSize": 16,
                "graphSettings": {
                    "defaultLayout": "force-directed",
                    "showLabels": true,
                    "nodeSize": 10
                }
            }
        });

        let config_str = serde_json::to_string_pretty(&config)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;

        fs::write(&config_file, config_str)
            .map_err(|e| format!("Failed to create config.json: {}", e))?;
    }

    Ok(())
}

/// Check if a path is a valid vault (has .graphnotes directory)
#[tauri::command]
pub fn is_vault(path: String) -> bool {
    let path_buf = PathBuf::from(&path);
    let graphnotes_dir = path_buf.join(".graphnotes");
    graphnotes_dir.exists() && graphnotes_dir.is_dir()
}

/// Get current timestamp in ISO 8601 format
fn chrono_now() -> String {
    use std::time::SystemTime;
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap();
    // Simple ISO format without external chrono crate
    format!("{}Z", now.as_secs())
}
