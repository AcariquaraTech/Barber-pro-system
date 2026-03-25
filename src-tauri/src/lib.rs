mod backend;

use backend::{commands, db, AppState};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = db::init_database(&app.handle())?;
            app.manage(AppState { db_path });
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::health,
            commands::list_barbers,
            commands::list_services,
            commands::list_clients,
            commands::create_client,
            commands::update_client,
            commands::delete_client,
            commands::list_appointments,
            commands::create_appointment,
            commands::update_appointment_status,
            commands::finalize_appointment,
            commands::create_sale,
            commands::list_sales,
            commands::sync_catalog
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
