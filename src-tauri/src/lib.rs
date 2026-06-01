use std::io::Write;
use std::sync::Arc;

use desktop_core_rs::tauri_commands::desktop_core_plugin;
use desktop_core_rs::{CurlHttpAdapter, DesktopCore};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    install_panic_logger();

    let core = DesktopCore::persistent_platform_with_http_adapter(
        "demo-product",
        Arc::new(CurlHttpAdapter),
    )
    .expect("failed to initialize desktop core");

    tauri::Builder::default()
        .manage(core)
        .plugin(desktop_core_plugin())
        .run(tauri::generate_context!())
        .expect("failed to run Desktop Foundation Demo");
}

fn install_panic_logger() {
    std::panic::set_hook(Box::new(|info| {
        if let Ok(mut file) = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open("/tmp/desktop-foundation-demo-panic.log")
        {
            let _ = writeln!(file, "{info}");
        }
    }));
}
