use std::io::Write;
use std::sync::Arc;

use tauri::Manager;
use desktop_core_rs::tauri_commands::desktop_core_plugin;
use desktop_core_rs::{CurlHttpAdapter, DesktopCore};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    install_panic_logger();

    let core = DesktopCore::persistent_platform_with_http_adapter(
        "commerce-ops",
        Arc::new(CurlHttpAdapter),
    )
    .expect("failed to initialize desktop core");

    let app = tauri::Builder::default()
        .manage(core)
        .plugin(desktop_core_plugin())
        .build(tauri::generate_context!())
        .expect("failed to build Desktop Commerce Demo");

    app.run(|app_handle, event| match event {
        tauri::RunEvent::Ready => show_main_window(app_handle),
        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen {
            has_visible_windows,
            ..
        } => {
            if !has_visible_windows {
                show_main_window(app_handle);
            }
        }
        _ => {}
    });
}

fn show_main_window(app_handle: &tauri::AppHandle) {
    let Some(window) = app_handle.get_webview_window("main") else {
        return;
    };

    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}

fn install_panic_logger() {
    std::panic::set_hook(Box::new(|info| {
        if let Ok(mut file) = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open("/tmp/desktop-commerce-demo-panic.log")
        {
            let _ = writeln!(file, "{info}");
        }
    }));
}
