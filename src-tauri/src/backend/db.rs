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

        -- ==================== TABELAS DE AUTENTICAÇÃO ====================
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'collaborator', 'client')),
            phone TEXT,
            cpf TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE,
            is_revoked INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

        -- ==================== TABELAS HERDADAS (LEGACY) ====================
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

        -- ==================== TABELAS NOVAS ====================
        CREATE TABLE IF NOT EXISTS collaborators (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            matricula TEXT NOT NULL UNIQUE,
            admin_id TEXT NOT NULL,
            servicos_habilitados TEXT NOT NULL,
            escala TEXT NOT NULL,
            horario_inicio TEXT NOT NULL,
            horario_fim TEXT NOT NULL,
            comissao_percentual REAL NOT NULL DEFAULT 0.0,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(admin_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS new_services (
            id TEXT PRIMARY KEY,
            admin_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            duration_minutes INTEGER NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            FOREIGN KEY(admin_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS new_appointments (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            collaborator_id TEXT NOT NULL,
            service_id TEXT NOT NULL,
            scheduled_at TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
            notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(client_id) REFERENCES users(id),
            FOREIGN KEY(collaborator_id) REFERENCES collaborators(id),
            FOREIGN KEY(service_id) REFERENCES new_services(id)
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            appointment_id TEXT,
            admin_id TEXT NOT NULL,
            collaborator_id TEXT NOT NULL,
            client_id TEXT NOT NULL,
            service_id TEXT NOT NULL,
            amount REAL NOT NULL,
            payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'credit_card', 'debit_card', 'pix')),
            status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'refunded')),
            created_at TEXT NOT NULL,
            FOREIGN KEY(admin_id) REFERENCES users(id),
            FOREIGN KEY(collaborator_id) REFERENCES collaborators(id),
            FOREIGN KEY(client_id) REFERENCES users(id),
            FOREIGN KEY(service_id) REFERENCES new_services(id)
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_admin ON transactions(admin_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

        CREATE TABLE IF NOT EXISTS cashier_closings (
            id TEXT PRIMARY KEY,
            admin_id TEXT NOT NULL,
            opened_at TEXT NOT NULL,
            closed_at TEXT,
            opening_balance REAL NOT NULL,
            total_cash REAL NOT NULL DEFAULT 0,
            total_card REAL NOT NULL DEFAULT 0,
            total_pix REAL NOT NULL DEFAULT 0,
            total_revenue REAL NOT NULL DEFAULT 0,
            discrepancy REAL NOT NULL DEFAULT 0,
            notes TEXT,
            is_closed INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY(admin_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_cashier_closed_at ON cashier_closings(closed_at);
        ",
    )
    .map_err(|e| format!("erro ao executar migracoes: {e}"))?;

    Ok(app_data_dir)
}

pub fn open_connection(db_path: &PathBuf) -> Result<Connection, String> {
    Connection::open(db_path).map_err(|e| format!("erro ao abrir conexao sqlite: {e}"))
}
