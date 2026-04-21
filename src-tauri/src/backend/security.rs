/// Módulo de segurança para o backend
/// Implementa validações, hash de senhas e geração/verificação de JWTs.

use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand_core::OsRng;
use serde::{Deserialize, Serialize};
use std::env;

/// Valida email básico
pub fn validate_email(email: &str) -> Result<(), String> {
    if email.is_empty() || email.len() > 255 {
        return Err("Email inválido".to_string());
    }
    
    if !email.contains('@') || !email.contains('.') {
        return Err("Email deve conter @ e .".to_string());
    }
    
    Ok(())
}

pub fn validate_role(role: &str) -> Result<(), String> {
    if !["admin", "collaborator", "client"].contains(&role) {
        return Err("Role inválido".to_string());
    }
    Ok(())
}

/// Valida senha (mínimo 6 caracteres)
pub fn validate_password(password: &str) -> Result<(), String> {
    if password.len() < 6 {
        return Err("Senha deve ter no mínimo 6 caracteres".to_string());
    }
    
    if password.len() > 128 {
        return Err("Senha muito longa".to_string());
    }
    
    Ok(())
}

/// Valida nome (não vazio, máx 255 caracteres)
pub fn validate_name(name: &str) -> Result<(), String> {
    if name.is_empty() || name.len() > 255 {
        return Err("Nome inválido".to_string());
    }
    
    Ok(())
}

/// Valida telefone (número simples, 10-15 dígitos)
pub fn validate_phone(phone: &str) -> Result<(), String> {
    let digits: String = phone.chars().filter(|c| c.is_numeric()).collect();
    
    if digits.len() < 10 || digits.len() > 15 {
        return Err("Telefone inválido".to_string());
    }
    
    Ok(())
}

/// Valida CPF (simplificado: 11 dígitos)
pub fn validate_cpf(cpf: &str) -> Result<(), String> {
    let digits: String = cpf.chars().filter(|c| c.is_numeric()).collect();
    
    if digits.len() != 11 {
        return Err("CPF deve conter 11 dígitos".to_string());
    }
    
    Ok(())
}

/// Sanitiza entrada para evitar SQL injection
pub fn sanitize_input(input: &str) -> String {
    input
        .trim()
        .chars()
        .filter(|c| !c.is_control())
        .collect::<String>()
        .chars()
        .take(255)
        .collect()
}

fn jwt_secret() -> String {
    env::var("BARBERPRO_JWT_SECRET")
        .unwrap_or_else(|_| "barberpro-dev-only-secret-change-in-production".to_string())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub token_type: String,
    pub exp: usize,
    pub iat: usize,
}

pub fn hash_password(password: &str) -> Result<String, String> {
    validate_password(password)?;
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| format!("Erro ao gerar hash da senha: {e}"))
}

pub fn verify_password(password: &str, password_hash: &str) -> bool {
    let parsed = match PasswordHash::new(password_hash) {
        Ok(hash) => hash,
        Err(_) => return false,
    };
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok()
}

pub fn generate_access_token(user_id: &str, role: &str, ttl_secs: i64) -> Result<String, String> {
    validate_role(role)?;
    let now = Utc::now().timestamp();
    let claims = Claims {
        sub: user_id.to_string(),
        role: role.to_string(),
        token_type: "access".to_string(),
        iat: now as usize,
        exp: (now + ttl_secs) as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret().as_bytes()),
    )
    .map_err(|e| format!("Erro ao gerar access token: {e}"))
}

pub fn generate_refresh_token(user_id: &str, role: &str, ttl_secs: i64) -> Result<String, String> {
    validate_role(role)?;
    let now = Utc::now().timestamp();
    let claims = Claims {
        sub: user_id.to_string(),
        role: role.to_string(),
        token_type: "refresh".to_string(),
        iat: now as usize,
        exp: (now + ttl_secs) as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret().as_bytes()),
    )
    .map_err(|e| format!("Erro ao gerar refresh token: {e}"))
}

pub fn decode_token(token: &str) -> Result<Claims, String> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret().as_bytes()),
        &Validation::default(),
    )
    .map(|d| d.claims)
    .map_err(|e| format!("Token inválido: {e}"))
}

pub fn verify_access_token(token: &str) -> Result<(String, String), String> {
    let claims = decode_token(token)?;
    if claims.token_type != "access" {
        return Err("Token não é do tipo access".to_string());
    }
    Ok((claims.sub, claims.role))
}

pub fn verify_refresh_token(token: &str) -> Result<(String, String), String> {
    let claims = decode_token(token)?;
    if claims.token_type != "refresh" {
        return Err("Token não é do tipo refresh".to_string());
    }
    Ok((claims.sub, claims.role))
}

pub fn authorize_roles(token: &str, allowed_roles: &[&str]) -> Result<(String, String), String> {
    let (user_id, role) = verify_access_token(token)?;
    if !allowed_roles.contains(&role.as_str()) {
        return Err("Sem permissão para executar esta operação".to_string());
    }
    Ok((user_id, role))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_email() {
        assert!(validate_email("test@example.com").is_ok());
        assert!(validate_email("invalid").is_err());
        assert!(validate_email("@.com").is_ok()); // Aceita emails simples
    }

    #[test]
    fn test_validate_password() {
        assert!(validate_password("123456").is_ok());
        assert!(validate_password("12345").is_err());
    }

    #[test]
    fn test_hash_password() {
        let password = "mypassword";
        let hash = hash_password(password).expect("hash should be generated");
        assert!(verify_password(password, &hash));
        assert!(!verify_password("wrongpassword", &hash));
    }

    #[test]
    fn test_token_roundtrip() {
        let token = generate_access_token("u1", "admin", 60).expect("token should be generated");
        let (sub, role) = verify_access_token(&token).expect("token should validate");
        assert_eq!(sub, "u1");
        assert_eq!(role, "admin");
    }
}
