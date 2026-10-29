use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::{Manager, RunEvent};

// Daemon ka process yahan sambhal ke rakhte hain, taake band bhi kar saken
struct Daemon(Mutex<Option<Child>>);

#[tauri::command]
fn save_device_token(token: String) -> Result<(), String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    let mut path = std::path::PathBuf::from(home);
    path.push(".codehands");
    let _ = std::fs::create_dir_all(&path);
    path.push("device_token");
    std::fs::write(path, token).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_device_token() -> Result<Option<String>, String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    let mut path = std::path::PathBuf::from(home);
    path.push(".codehands");
    path.push("device_token");
    if path.exists() {
        let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
        Ok(Some(content.trim().to_string()))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn delete_device_token() -> Result<(), String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    let mut path = std::path::PathBuf::from(home);
    path.push(".codehands");
    path.push("device_token");
    if path.exists() {
        let _ = std::fs::remove_file(path);
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_device_token,
            get_device_token,
            delete_device_token
        ])
        .setup(|app| {
            // App khulte hi fake daemon start karo
            // (dev mein folder src-tauri hota hai, is liye ../ lagaya)
            let child = Command::new("node")
                .arg("../fake-daemon.mjs")
                .spawn()
                .ok();
            app.manage(Daemon(Mutex::new(child)));
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|handle, event| {
        // App band hote hi daemon bhi band karo
        if let RunEvent::Exit = event {
            if let Some(d) = handle.try_state::<Daemon>() {
                if let Some(mut c) = d.0.lock().unwrap().take() {
                    let _ = c.kill();
                }
            }
        }
    });
}
