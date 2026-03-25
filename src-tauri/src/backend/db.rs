use rusqlite::Connection;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

pub fn init_database(app: &AppHandle) -> Result<PathBuf, String> {
    let mut app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("erro ao resolver pasta de dados: {e}"))?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("erro ao criar pasta de dados: {e}"))?;

    app_data_dir.push("barber_pro.db");

    let conn = Connection::open(&app_data_dir)
        .map_err(|e| format!("erro ao abrir banco sqlite: {e}"))?;

    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS barbers (
            id TEXT PRIMARY KEY,
            matricula TEXT NOT NULL UNIQUE,
            nome TEXT NOT NULL,
            foto TEXT NOT NULL,
            escala_json TEXT NOT NULL,
            unidade_id TEXT NOT NULL,
            servicos_habilitados_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            price REAL NOT NULL,
            active INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            client_name TEXT NOT NULL,
            client_phone TEXT NOT NULL,
            barber_id TEXT NOT NULL,
            barber_nome TEXT NOT NULL,
            service_name TEXT NOT NULL,
            service_price REAL NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('reservado','confirmado','finalizado','cancelado')),
            amount_paid REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
        CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(client_phone);
        CREATE INDEX IF NOT EXISTS idx_appointments_barber ON appointments(barber_id);

        CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            appointment_id TEXT,
            barbeiro TEXT NOT NULL,
            cliente TEXT NOT NULL,
            servico TEXT NOT NULL,
            valor REAL NOT NULL,
            metodo TEXT NOT NULL,
            unidade TEXT NOT NULL,
            data TEXT NOT NULL,
            hora TEXT NOT NULL,
            timestamp TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);
        ",
    )
    .map_err(|e| format!("erro ao executar migracoes: {e}"))?;

    Ok(app_data_dir)
}

pub fn open_connection(db_path: &PathBuf) -> Result<Connection, String> {
    Connection::open(db_path).map_err(|e| format!("erro ao abrir conexao sqlite: {e}"))
}
