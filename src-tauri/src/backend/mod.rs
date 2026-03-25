pub mod commands;
pub mod db;
pub mod models;

use std::path::PathBuf;

#[derive(Clone)]
pub struct AppState {
    pub db_path: PathBuf,
}
