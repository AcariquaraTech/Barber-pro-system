use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Barber {
    pub id: String,
    pub matricula: String,
    pub nome: String,
    pub foto: String,
    pub escala: [u8; 7],
    pub unidade_id: String,
    pub servicos_habilitados: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Service {
    pub id: String,
    pub name: String,
    pub price: f64,
    pub active: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Client {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub last_visit: String,
    pub total_cuts: i64,
    pub spent: f64,
    pub preferred: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateClientRequest {
    pub name: String,
    pub phone: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateClientRequest {
    pub name: String,
    pub phone: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Appointment {
    pub id: String,
    pub client_name: String,
    pub client_phone: String,
    pub barber_id: String,
    pub barber_nome: String,
    pub service_name: String,
    pub service_price: f64,
    pub date: String,
    pub time: String,
    pub status: String,
    pub amount_paid: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateAppointmentRequest {
    pub client_name: String,
    pub client_phone: String,
    pub barber_id: String,
    pub barber_nome: String,
    pub service_name: String,
    pub service_price: f64,
    pub date: String,
    pub time: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateAppointmentStatusRequest {
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FinalizeAppointmentRequest {
    pub payment_method: String,
    pub amount_paid: Option<f64>,
    pub unidade: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSaleRequest {
    pub barbeiro: String,
    pub cliente: String,
    pub servico: String,
    pub valor: f64,
    pub metodo: String,
    pub unidade: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaleRecord {
    pub id: String,
    pub appointment_id: Option<String>,
    pub barbeiro: String,
    pub cliente: String,
    pub servico: String,
    pub valor: f64,
    pub metodo: String,
    pub unidade: String,
    pub data: String,
    pub hora: String,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigServiceInput {
    pub name: String,
    pub price: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigBarberInput {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncCatalogRequest {
    pub services: Vec<ConfigServiceInput>,
    pub barbers: Vec<ConfigBarberInput>,
}
