// src-tauri/src/commands/search.rs

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize)]
pub struct GrepMatch {
    pub filepath: String,
    pub line_number: usize,
    pub line_content: String,
    pub match_start: usize,
    pub match_end: usize,
}

/// Search for a pattern in all markdown files in a directory
#[tauri::command]
pub fn grep_search(path: String, pattern: String, max_results: Option<usize>) -> Result<Vec<GrepMatch>, String> {
    let path_buf = PathBuf::from(&path);
    let max = max_results.unwrap_or(100);

    if !path_buf.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    // Try to compile as regex, fall back to literal search
    let regex = Regex::new(&pattern).or_else(|_| {
        // Escape special regex characters for literal search
        Regex::new(&regex::escape(&pattern))
    }).map_err(|e| format!("Invalid pattern: {}", e))?;

    let mut matches: Vec<GrepMatch> = Vec::new();

    for entry in WalkDir::new(&path_buf)
        .follow_links(true)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            // Skip hidden directories
            !name.starts_with('.')
        })
    {
        if matches.len() >= max {
            break;
        }

        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let entry_path = entry.path();

        // Only search markdown files
        if !entry_path.is_file() {
            continue;
        }

        let ext = entry_path.extension().and_then(|e| e.to_str());
        if ext != Some("md") && ext != Some("markdown") {
            continue;
        }

        // Read file content
        let content = match fs::read_to_string(entry_path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        // Get relative path
        let relative_path = entry_path
            .strip_prefix(&path_buf)
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|_| entry_path.to_string_lossy().to_string());

        // Search each line
        for (line_idx, line) in content.lines().enumerate() {
            if matches.len() >= max {
                break;
            }

            if let Some(m) = regex.find(line) {
                matches.push(GrepMatch {
                    filepath: relative_path.clone(),
                    line_number: line_idx + 1,
                    line_content: line.to_string(),
                    match_start: m.start(),
                    match_end: m.end(),
                });
            }
        }
    }

    Ok(matches)
}
