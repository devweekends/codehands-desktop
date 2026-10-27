use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::{Manager, RunEvent};

// Daemon ka process yahan sambhal ke rakhte hain, taake band bhi kar saken
struct Daemon(Mutex<Option<Child>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // App khulte hi fake daemon start karo
            // (dev mein folder src-tauri hota hai, is liye ../ lagaya)
            let child = Command::new("node").arg("../fake-daemon.mjs").spawn().ok();
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
