// Comandos de autenticação expostos ao frontend
use crate::backend::{
    db,
    models::{
        AuthResponse, LoginRequest, LogoutRequest, RefreshTokenRequest, RegisterRequest, UserPublic,
        UserRole,
    },
    security, AppState,
};
use chrono::{DateTime, Utc};
use rusqlite::{params, OptionalExtension};
use uuid::Uuid;

const ACCESS_TTL_SECS: i64 = 60 * 60; // 1 hora
const REFRESH_TTL_SECS: i64 = 60 * 60 * 24 * 30; // 30 dias

fn persist_refresh_token(
    conn: &rusqlite::Connection,
    token: &str,
    user_id: &str,
    role: &str,
) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let expires_at = (Utc::now().timestamp() + REFRESH_TTL_SECS).to_string();

    conn.execute(
        "INSERT INTO refresh_tokens (id, user_id, role, token, is_revoked, created_at, expires_at) VALUES (?1, ?2, ?3, ?4, 0, ?5, ?6)",
        params![Uuid::new_v4().to_string(), user_id, role, token, now, expires_at],
    )
    .map_err(|e| format!("Erro ao salvar refresh token: {e}"))?;

    Ok(())
}

/// Login de usuário
#[tauri::command]
pub async fn login(
    state: tauri::State<'_, AppState>,
    payload: LoginRequest,
) -> Result<AuthResponse, String> {
    // Validar email e senha
    security::validate_email(&payload.email)?;
    if payload.password.is_empty() {
        return Err("Senha não pode estar vazia".to_string());
    }

    let conn = db::open_connection(&state.db_path)?;

    // Buscar usuário
    let mut stmt = conn
        .prepare("SELECT id, email, name, password_hash, role, phone, created_at FROM users WHERE email = ?1 AND is_active = 1")
        .map_err(|e| format!("Erro ao preparar query: {e}"))?;

    let user = stmt
        .query_row(params![&payload.email], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, String>(6)?,
            ))
        })
        .optional()
        .map_err(|e| format!("Erro ao buscar usuário: {e}"))?;

    let (id, email, name, password_hash, role_str, phone, created_at) = user
        .ok_or_else(|| "Email ou senha inválidos".to_string())?;

    // Verificar senha
    if !security::verify_password(&payload.password, &password_hash) {
        return Err("Email ou senha inválidos".to_string());
    }

    // Converter role
    let role = match role_str.as_str() {
        "admin" => UserRole::Admin,
        "collaborator" => UserRole::Collaborator,
        "client" => UserRole::Client,
        _ => return Err("Role inválido".to_string()),
    };

    // Gerar tokens
    let token = security::generate_access_token(&id, &role_str, ACCESS_TTL_SECS)?;
    let refresh_token = security::generate_refresh_token(&id, &role_str, REFRESH_TTL_SECS)?;
    persist_refresh_token(&conn, &refresh_token, &id, &role_str)?;
    let expires_at = (Utc::now().timestamp() + ACCESS_TTL_SECS) * 1000;

    Ok(AuthResponse {
        user: UserPublic {
            id,
            email,
            name,
            role,
            phone,
            created_at: DateTime::parse_from_rfc3339(&created_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
        },
        token,
        refresh_token,
        expires_at,
    })
}

/// Registro de novo usuário
#[tauri::command]
pub async fn register(
    state: tauri::State<'_, AppState>,
    payload: RegisterRequest,
) -> Result<AuthResponse, String> {
    // Validações
    security::validate_email(&payload.email)?;
    security::validate_password(&payload.password)?;
    security::validate_name(&payload.name)?;

    if let Some(ref phone) = payload.phone {
        security::validate_phone(phone)?;
    }

    if let Some(ref cpf) = payload.cpf {
        security::validate_cpf(cpf)?;
    }

    let conn = db::open_connection(&state.db_path)?;

    // Verificar se email já existe
    let exists = conn
        .query_row(
            "SELECT COUNT(*) FROM users WHERE email = ?1",
            params![&payload.email],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|e| format!("Erro ao verificar email: {e}"))?;

    if exists > 0 {
        return Err("Email já cadastrado".to_string());
    }

    // Hash da senha
    let password_hash = security::hash_password(&payload.password)?;
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    let role_str = payload.role.to_string();

    // Inserir usuário
    conn.execute(
        "INSERT INTO users (id, email, name, password_hash, role, phone, cpf, is_active, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8, ?9)",
        params![
            &id,
            &payload.email,
            &payload.name,
            &password_hash,
            &payload.role.to_string(),
            &payload.phone,
            &payload.cpf,
            &now,
            &now
        ],
    )
    .map_err(|e| format!("Erro ao criar usuário: {e}"))?;

    // Gerar tokens
    let token = security::generate_access_token(&id, &role_str, ACCESS_TTL_SECS)?;
    let refresh_token = security::generate_refresh_token(&id, &role_str, REFRESH_TTL_SECS)?;
    persist_refresh_token(&conn, &refresh_token, &id, &role_str)?;
    let expires_at = (Utc::now().timestamp() + ACCESS_TTL_SECS) * 1000;

    Ok(AuthResponse {
        user: UserPublic {
            id,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            phone: payload.phone,
            created_at: DateTime::parse_from_rfc3339(&now)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
        },
        token,
        refresh_token,
        expires_at,
    })
}

/// Verify token (para validar no backend)
#[tauri::command]
pub async fn verify_token(token: String) -> Result<(String, String), String> {
    security::verify_access_token(&token)
}

#[tauri::command]
pub async fn refresh_session(
    state: tauri::State<'_, AppState>,
    payload: RefreshTokenRequest,
) -> Result<AuthResponse, String> {
    let (user_id, role) = security::verify_refresh_token(&payload.refresh_token)?;
    let conn = db::open_connection(&state.db_path)?;

    let token_exists: Option<String> = conn
        .query_row(
            "SELECT id FROM refresh_tokens WHERE token = ?1 AND is_revoked = 0 LIMIT 1",
            params![&payload.refresh_token],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Erro ao validar refresh token: {e}"))?;

    if token_exists.is_none() {
        return Err("Refresh token inválido ou revogado".to_string());
    }

    let mut stmt = conn
        .prepare("SELECT id, email, name, role, phone, created_at FROM users WHERE id = ?1 AND is_active = 1")
        .map_err(|e| format!("Erro ao preparar query de usuário: {e}"))?;

    let user = stmt
        .query_row(params![&user_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, String>(5)?,
            ))
        })
        .optional()
        .map_err(|e| format!("Erro ao carregar usuário: {e}"))?
        .ok_or_else(|| "Usuário não encontrado".to_string())?;

    let (_, email, name, role_str, phone, created_at) = user;
    if role_str != role {
        return Err("Role inválido para o token informado".to_string());
    }

    let role_enum = match role_str.as_str() {
        "admin" => UserRole::Admin,
        "collaborator" => UserRole::Collaborator,
        "client" => UserRole::Client,
        _ => return Err("Role inválido".to_string()),
    };

    let new_access = security::generate_access_token(&user_id, &role_str, ACCESS_TTL_SECS)?;
    let new_refresh = security::generate_refresh_token(&user_id, &role_str, REFRESH_TTL_SECS)?;

    conn.execute(
        "UPDATE refresh_tokens SET is_revoked = 1 WHERE token = ?1",
        params![&payload.refresh_token],
    )
    .map_err(|e| format!("Erro ao revogar refresh token antigo: {e}"))?;

    persist_refresh_token(&conn, &new_refresh, &user_id, &role_str)?;

    Ok(AuthResponse {
        user: UserPublic {
            id: user_id,
            email,
            name,
            role: role_enum,
            phone,
            created_at: DateTime::parse_from_rfc3339(&created_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
        },
        token: new_access,
        refresh_token: new_refresh,
        expires_at: (Utc::now().timestamp() + ACCESS_TTL_SECS) * 1000,
    })
}

#[tauri::command]
pub async fn logout(
    state: tauri::State<'_, AppState>,
    payload: LogoutRequest,
) -> Result<bool, String> {
    let conn = db::open_connection(&state.db_path)?;
    let affected = conn
        .execute(
            "UPDATE refresh_tokens SET is_revoked = 1 WHERE token = ?1",
            params![&payload.refresh_token],
        )
        .map_err(|e| format!("Erro ao efetuar logout: {e}"))?;

    Ok(affected > 0)
}

pub fn require_roles(token: &str, roles: &[&str]) -> Result<(String, String), String> {
    security::authorize_roles(token, roles)
}
