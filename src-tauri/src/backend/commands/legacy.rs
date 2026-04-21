use crate::backend::{
    commands::auth,
    db,
    models::{
        Appointment, Barber, Client, ConfigBarberInput, ConfigServiceInput, CreateAppointmentRequest,
        CreateClientRequest, CreateSaleRequest, FinalizeAppointmentRequest, HealthResponse, SaleRecord,
        Service, SyncCatalogRequest, UpdateAppointmentStatusRequest, UpdateClientRequest,
        CloseCashierRequest, CashierSummary,
    },
    AppState,
};
use chrono::Local;
use rusqlite::{params, OptionalExtension};
use uuid::Uuid;

#[tauri::command]
pub fn health() -> Result<HealthResponse, String> {
    Ok(HealthResponse {
        status: "ok".to_string(),
        version: "1.0.0".to_string(),
    })
}

#[tauri::command]
pub fn list_barbers(state: tauri::State<AppState>) -> Result<Vec<Barber>, String> {
    let conn = db::open_connection(&state.db_path)?;
    let mut stmt = conn
        .prepare(
            "
            SELECT id, matricula, nome, foto, escala_json, unidade_id, servicos_habilitados_json
            FROM barbers
            ORDER BY nome
            ",
        )
        .map_err(|e| format!("erro ao preparar list_barbers: {e}"))?;

    let rows = stmt
        .query_map([], |row| {
            let escala_json: String = row.get(4)?;
            let servicos_json: String = row.get(6)?;

            let escala: [u8; 7] = serde_json::from_str(&escala_json).unwrap_or([1, 1, 1, 1, 1, 1, 1]);
            let servicos_habilitados: Vec<String> = serde_json::from_str(&servicos_json).unwrap_or_default();

            Ok(Barber {
                id: row.get(0)?,
                matricula: row.get(1)?,
                nome: row.get(2)?,
                foto: row.get(3)?,
                escala,
                unidade_id: row.get(5)?,
                servicos_habilitados,
            })
        })
        .map_err(|e| format!("erro ao executar list_barbers: {e}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("erro ao coletar barbers: {e}"))
}

#[tauri::command]
pub fn list_services(state: tauri::State<AppState>) -> Result<Vec<Service>, String> {
    let conn = db::open_connection(&state.db_path)?;
    let mut stmt = conn
        .prepare("SELECT id, name, price, active FROM services WHERE active = 1 ORDER BY name")
        .map_err(|e| format!("erro ao preparar list_services: {e}"))?;

    let rows = stmt
        .query_map([], |row| {
            let active: i64 = row.get(3)?;
            Ok(Service {
                id: row.get(0)?,
                name: row.get(1)?,
                price: row.get(2)?,
                active: active == 1,
            })
        })
        .map_err(|e| format!("erro ao executar list_services: {e}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("erro ao coletar servicos: {e}"))
}

#[tauri::command]
pub fn list_clients(state: tauri::State<AppState>, search: Option<String>) -> Result<Vec<Client>, String> {
    let conn = db::open_connection(&state.db_path)?;
    let search_like = format!("%{}%", search.unwrap_or_default().to_lowercase());

    let mut stmt = conn
        .prepare(
            "
            SELECT
              c.id,
              c.name,
              c.phone,
              COALESCE(MAX(CASE WHEN a.status = 'finalizado' THEN a.date END), 'Sem visitas') AS last_visit,
              COALESCE(SUM(CASE WHEN a.status = 'finalizado' THEN 1 ELSE 0 END), 0) AS total_cuts,
              COALESCE(SUM(CASE WHEN a.status = 'finalizado' THEN a.amount_paid ELSE 0 END), 0) AS spent,
              COALESCE((
                SELECT a2.service_name
                FROM appointments a2
                WHERE a2.client_phone = c.phone
                GROUP BY a2.service_name
                ORDER BY COUNT(*) DESC
                LIMIT 1
              ), 'Nenhum') AS preferred
            FROM clients c
            LEFT JOIN appointments a ON a.client_phone = c.phone
            WHERE (?1 = '%%' OR lower(c.name) LIKE ?1 OR c.phone LIKE ?1)
            GROUP BY c.id, c.name, c.phone
            ORDER BY c.name ASC
            ",
        )
        .map_err(|e| format!("erro ao preparar list_clients: {e}"))?;

    let rows = stmt
        .query_map(params![search_like], |row| {
            Ok(Client {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                last_visit: row.get(3)?,
                total_cuts: row.get(4)?,
                spent: row.get(5)?,
                preferred: row.get(6)?,
            })
        })
        .map_err(|e| format!("erro ao executar list_clients: {e}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("erro ao coletar clientes: {e}"))
}

#[tauri::command]
pub fn list_clients_secure(
    state: tauri::State<AppState>,
    token: String,
    search: Option<String>,
) -> Result<Vec<Client>, String> {
    auth::require_roles(&token, &["admin"])?;
    list_clients(state, search)
}

#[tauri::command]
pub fn create_client(
    state: tauri::State<AppState>,
    payload: CreateClientRequest,
) -> Result<Client, String> {
    validate_client_payload(&payload.name, &payload.phone)?;
    let now = Local::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();
    let normalized_phone = normalize_phone(&payload.phone);

    let conn = db::open_connection(&state.db_path)?;
    conn.execute(
        "INSERT INTO clients (id, name, phone, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, payload.name.trim(), normalized_phone, now, now],
    )
    .map_err(|e| format!("erro ao criar cliente: {e}"))?;

    Ok(Client {
        id,
        name: payload.name.trim().to_string(),
        phone: normalized_phone,
        last_visit: "Sem visitas".to_string(),
        total_cuts: 0,
        spent: 0.0,
        preferred: "Nenhum".to_string(),
    })
}

#[tauri::command]
pub fn create_client_secure(
    state: tauri::State<AppState>,
    token: String,
    payload: CreateClientRequest,
) -> Result<Client, String> {
    auth::require_roles(&token, &["admin"])?;
    create_client(state, payload)
}

#[tauri::command]
pub fn update_client(
    state: tauri::State<AppState>,
    id: String,
    payload: UpdateClientRequest,
) -> Result<Client, String> {
    validate_client_payload(&payload.name, &payload.phone)?;
    let now = Local::now().to_rfc3339();
    let normalized_phone = normalize_phone(&payload.phone);

    let conn = db::open_connection(&state.db_path)?;
    conn.execute(
        "UPDATE clients SET name = ?1, phone = ?2, updated_at = ?3 WHERE id = ?4",
        params![payload.name.trim(), normalized_phone, now, id],
    )
    .map_err(|e| format!("erro ao atualizar cliente: {e}"))?;

    let client = list_clients(state, None)?
        .into_iter()
        .find(|c| c.id == id)
        .ok_or_else(|| "cliente nao encontrado apos update".to_string())?;

    Ok(client)
}

#[tauri::command]
pub fn update_client_secure(
    state: tauri::State<AppState>,
    token: String,
    id: String,
    payload: UpdateClientRequest,
) -> Result<Client, String> {
    auth::require_roles(&token, &["admin"])?;
    update_client(state, id, payload)
}

#[tauri::command]
pub fn delete_client(state: tauri::State<AppState>, id: String) -> Result<bool, String> {
    let conn = db::open_connection(&state.db_path)?;
    let affected = conn
        .execute("DELETE FROM clients WHERE id = ?1", params![id])
        .map_err(|e| format!("erro ao deletar cliente: {e}"))?;

    Ok(affected > 0)
}

#[tauri::command]
pub fn delete_client_secure(state: tauri::State<AppState>, token: String, id: String) -> Result<bool, String> {
    auth::require_roles(&token, &["admin"])?;
    delete_client(state, id)
}

#[tauri::command]
pub fn list_appointments(
    state: tauri::State<AppState>,
    date: Option<String>,
) -> Result<Vec<Appointment>, String> {
    let conn = db::open_connection(&state.db_path)?;

    if let Some(date_value) = date {
        let query = "
            SELECT id, client_name, client_phone, barber_id, barber_nome,
                   service_name, service_price, date, time, status, amount_paid
            FROM appointments
            WHERE date = ?1
            ORDER BY time ASC
        ";
        let mut stmt = conn
            .prepare(&query)
            .map_err(|e| format!("erro ao preparar list_appointments: {e}"))?;
        let rows = stmt
            .query_map(params![date_value], |row| {
                Ok(Appointment {
                    id: row.get(0)?,
                    client_name: row.get(1)?,
                    client_phone: row.get(2)?,
                    barber_id: row.get(3)?,
                    barber_nome: row.get(4)?,
                    service_name: row.get(5)?,
                    service_price: row.get(6)?,
                    date: row.get(7)?,
                    time: row.get(8)?,
                    status: row.get(9)?,
                    amount_paid: row.get(10)?,
                })
            })
            .map_err(|e| format!("erro ao consultar appointments por data: {e}"))?;

        rows
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("erro ao coletar appointments: {e}"))
    } else {
        let query = "
            SELECT id, client_name, client_phone, barber_id, barber_nome,
                   service_name, service_price, date, time, status, amount_paid
            FROM appointments
            ORDER BY date DESC, time ASC
        ";
        let mut stmt = conn
            .prepare(&query)
            .map_err(|e| format!("erro ao preparar list_appointments: {e}"))?;
        let rows = stmt
            .query_map([], |row| {
                Ok(Appointment {
                    id: row.get(0)?,
                    client_name: row.get(1)?,
                    client_phone: row.get(2)?,
                    barber_id: row.get(3)?,
                    barber_nome: row.get(4)?,
                    service_name: row.get(5)?,
                    service_price: row.get(6)?,
                    date: row.get(7)?,
                    time: row.get(8)?,
                    status: row.get(9)?,
                    amount_paid: row.get(10)?,
                })
            })
            .map_err(|e| format!("erro ao consultar appointments: {e}"))?;

        rows
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("erro ao coletar appointments: {e}"))
    }
}

#[tauri::command]
pub fn create_appointment(
    state: tauri::State<AppState>,
    payload: CreateAppointmentRequest,
) -> Result<Appointment, String> {
    if payload.client_name.trim().is_empty() {
        return Err("nome do cliente e obrigatorio".to_string());
    }
    if payload.barbear_id_is_empty() {
        return Err("barbeiro e obrigatorio".to_string());
    }
    if payload.service_name.trim().is_empty() {
        return Err("servico e obrigatorio".to_string());
    }

    let normalized_phone = normalize_phone(&payload.client_phone);
    if normalized_phone.len() < 10 {
        return Err("telefone invalido".to_string());
    }

    let now = Local::now().to_rfc3339();
    let appointment_id = Uuid::new_v4().to_string();

    let conn = db::open_connection(&state.db_path)?;

    let conflict: Option<String> = conn
        .query_row(
            "
            SELECT id FROM appointments
            WHERE date = ?1 AND time = ?2 AND barber_id = ?3 AND status != 'cancelado'
            LIMIT 1
            ",
            params![payload.date, payload.time, payload.barber_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("erro ao validar conflito de horario: {e}"))?;

    if conflict.is_some() {
        return Err("ja existe agendamento para este barbeiro neste horario".to_string());
    }

    conn.execute(
        "
        INSERT INTO appointments (
            id, client_name, client_phone, barber_id, barber_nome,
            service_name, service_price, date, time, status, amount_paid, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'reservado', 0, ?10, ?11)
        ",
        params![
            appointment_id,
            payload.client_name.trim(),
            normalized_phone,
            payload.barber_id,
            payload.barber_nome,
            payload.service_name,
            payload.service_price,
            payload.date,
            payload.time,
            now,
            now
        ],
    )
    .map_err(|e| format!("erro ao criar agendamento: {e}"))?;

    upsert_client(&conn, payload.client_name.trim(), &normalized_phone, &now)?;

    Ok(Appointment {
        id: appointment_id,
        client_name: payload.client_name.trim().to_string(),
        client_phone: normalized_phone,
        barber_id: payload.barber_id,
        barber_nome: payload.barber_nome,
        service_name: payload.service_name,
        service_price: payload.service_price,
        date: payload.date,
        time: payload.time,
        status: "reservado".to_string(),
        amount_paid: 0.0,
    })
}

#[tauri::command]
pub fn update_appointment_status(
    state: tauri::State<AppState>,
    id: String,
    payload: UpdateAppointmentStatusRequest,
) -> Result<Appointment, String> {
    let status = payload.status.to_lowercase();
    if !["reservado", "confirmado", "finalizado", "cancelado"].contains(&status.as_str()) {
        return Err("status invalido".to_string());
    }

    let now = Local::now().to_rfc3339();
    let conn = db::open_connection(&state.db_path)?;
    conn.execute(
        "UPDATE appointments SET status = ?1, updated_at = ?2 WHERE id = ?3",
        params![status, now, id],
    )
    .map_err(|e| format!("erro ao atualizar status do agendamento: {e}"))?;

    get_appointment_by_id(&conn, &id)
}

#[tauri::command]
pub fn finalize_appointment(
    state: tauri::State<AppState>,
    id: String,
    payload: FinalizeAppointmentRequest,
) -> Result<SaleRecord, String> {
    let conn = db::open_connection(&state.db_path)?;
    let appointment = get_appointment_by_id(&conn, &id)?;

    let amount_paid = payload.amount_paid.unwrap_or(appointment.service_price);
    let now = Local::now();
    let timestamp = now.to_rfc3339();
    let data = now.format("%d/%m/%Y").to_string();
    let hora = now.format("%H:%M").to_string();

    conn.execute(
        "
        UPDATE appointments
        SET status = 'finalizado', amount_paid = ?1, updated_at = ?2
        WHERE id = ?3
        ",
        params![amount_paid, timestamp, id],
    )
    .map_err(|e| format!("erro ao finalizar agendamento: {e}"))?;

    let sale = SaleRecord {
        id: Uuid::new_v4().to_string(),
        appointment_id: Some(appointment.id),
        barbeiro: appointment.barber_nome,
        cliente: appointment.client_name,
        servico: appointment.service_name,
        valor: amount_paid,
        metodo: payload.payment_method,
        unidade: payload.unidade.unwrap_or_else(|| "Matriz Center".to_string()),
        data,
        hora,
        timestamp,
    };

    insert_sale(&conn, &sale)?;
    Ok(sale)
}

#[tauri::command]
pub fn create_sale(state: tauri::State<AppState>, payload: CreateSaleRequest) -> Result<SaleRecord, String> {
    if payload.barbeiro.trim().is_empty() {
        return Err("barbeiro e obrigatorio".to_string());
    }
    if payload.servico.trim().is_empty() {
        return Err("servico e obrigatorio".to_string());
    }

    let now = Local::now();
    let sale = SaleRecord {
        id: Uuid::new_v4().to_string(),
        appointment_id: None,
        barbeiro: payload.barbeiro.trim().to_string(),
        cliente: if payload.cliente.trim().is_empty() {
            "Consumidor Final".to_string()
        } else {
            payload.cliente.trim().to_string()
        },
        servico: payload.servico.trim().to_string(),
        valor: payload.valor,
        metodo: payload.metodo.trim().to_string(),
        unidade: payload.unidade.unwrap_or_else(|| "Matriz Center".to_string()),
        data: now.format("%d/%m/%Y").to_string(),
        hora: now.format("%H:%M").to_string(),
        timestamp: now.to_rfc3339(),
    };

    let conn = db::open_connection(&state.db_path)?;
    insert_sale(&conn, &sale)?;

    Ok(sale)
}

#[tauri::command]
pub fn list_sales(
    state: tauri::State<AppState>,
    start_timestamp: Option<String>,
    end_timestamp: Option<String>,
) -> Result<Vec<SaleRecord>, String> {
    let conn = db::open_connection(&state.db_path)?;

    let mut query = "
      SELECT id, appointment_id, barbeiro, cliente, servico, valor, metodo, unidade, data, hora, timestamp
      FROM sales
      WHERE 1=1
    "
    .to_string();

    let mut params_vec: Vec<String> = Vec::new();

    if let Some(start) = start_timestamp {
        query.push_str(" AND timestamp >= ?");
        params_vec.push(start);
    }

    if let Some(end) = end_timestamp {
        query.push_str(" AND timestamp <= ?");
        params_vec.push(end);
    }

    query.push_str(" ORDER BY timestamp DESC");

    let mut stmt = conn
        .prepare(&query)
        .map_err(|e| format!("erro ao preparar list_sales: {e}"))?;

    let rows = match params_vec.len() {
        0 => stmt.query_map([], map_sale_row),
        1 => stmt.query_map(params![params_vec[0]], map_sale_row),
        _ => stmt.query_map(params![params_vec[0], params_vec[1]], map_sale_row),
    }
    .map_err(|e| format!("erro ao executar list_sales: {e}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("erro ao coletar vendas: {e}"))
}

#[tauri::command]
pub fn list_sales_secure(
    state: tauri::State<AppState>,
    token: String,
    start_timestamp: Option<String>,
    end_timestamp: Option<String>,
) -> Result<Vec<SaleRecord>, String> {
    auth::require_roles(&token, &["admin"])?;
    list_sales(state, start_timestamp, end_timestamp)
}

#[tauri::command]
pub fn sync_catalog(state: tauri::State<AppState>, payload: SyncCatalogRequest) -> Result<bool, String> {
    let conn = db::open_connection(&state.db_path)?;
    let tx = conn
        .unchecked_transaction()
        .map_err(|e| format!("erro ao iniciar transacao de catalogo: {e}"))?;

    tx.execute("DELETE FROM services", [])
        .map_err(|e| format!("erro ao limpar servicos: {e}"))?;

    let cleaned_services: Vec<ConfigServiceInput> = payload
        .services
        .into_iter()
        .filter(|s| !s.name.trim().is_empty() && s.price >= 0.0)
        .collect();

    for (idx, service) in cleaned_services.iter().enumerate() {
        tx.execute(
            "INSERT INTO services (id, name, price, active) VALUES (?1, ?2, ?3, 1)",
            params![
                format!("svc-{}", idx + 1),
                service.name.trim(),
                service.price
            ],
        )
        .map_err(|e| format!("erro ao inserir servico no sync: {e}"))?;
    }

    tx.execute("DELETE FROM barbers", [])
        .map_err(|e| format!("erro ao limpar barbeiros: {e}"))?;

    let cleaned_barbers: Vec<ConfigBarberInput> = payload
        .barbers
        .into_iter()
        .filter(|b| !b.name.trim().is_empty())
        .collect();

    for (idx, barber) in cleaned_barbers.iter().enumerate() {
        let escala = serde_json::to_string(&[1, 1, 1, 1, 1, 1, 1])
            .map_err(|e| format!("erro ao serializar escala padrao: {e}"))?;
        let servicos_habilitados: Vec<String> = cleaned_services
            .iter()
            .map(|s| s.name.trim().to_string())
            .collect();
        let servicos_json = serde_json::to_string(&servicos_habilitados)
            .map_err(|e| format!("erro ao serializar servicos do barbeiro: {e}"))?;

        tx.execute(
            "
            INSERT INTO barbers (
                id, matricula, nome, foto, escala_json, unidade_id, servicos_habilitados_json
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ",
            params![
                Uuid::new_v4().to_string(),
                format!("BRB-{:03}", idx + 1),
                barber.name.trim(),
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
                escala,
                "matriz",
                servicos_json
            ],
        )
        .map_err(|e| format!("erro ao inserir barbeiro no sync: {e}"))?;
    }

    tx.commit()
        .map_err(|e| format!("erro ao finalizar transacao de catalogo: {e}"))?;

    Ok(true)
}

#[tauri::command]
pub fn sync_catalog_secure(
    state: tauri::State<AppState>,
    token: String,
    payload: SyncCatalogRequest,
) -> Result<bool, String> {
    auth::require_roles(&token, &["admin"])?;
    sync_catalog(state, payload)
}

#[tauri::command]
pub fn close_cashier(
    state: tauri::State<AppState>,
    token: String,
    payload: CloseCashierRequest,
) -> Result<CashierSummary, String> {
    let (admin_id, _role) = auth::require_roles(&token, &["admin"])?;
    let conn = db::open_connection(&state.db_path)?;
    let tx = conn
        .unchecked_transaction()
        .map_err(|e| format!("erro ao iniciar transacao do fechamento: {e}"))?;

    let mut total_cash = 0.0;
    let mut total_card = 0.0;
    let mut total_pix = 0.0;

    let now = Local::now();
    let timestamp = now.to_rfc3339();
    let data = now.format("%d/%m/%Y").to_string();
    let hora = now.format("%H:%M").to_string();

    for t in &payload.transactions {
        if t.servico.trim().is_empty() || t.barbeiro.trim().is_empty() {
            return Err("Transação inválida: serviço e barbeiro são obrigatórios".to_string());
        }
        if t.valor < 0.0 {
            return Err("Transação inválida: valor negativo".to_string());
        }

        match t.metodo.as_str() {
            "cash" => total_cash += t.valor,
            "credit_card" | "debit_card" => total_card += t.valor,
            "pix" => total_pix += t.valor,
            _ => return Err("Método de pagamento inválido".to_string()),
        }

        tx.execute(
            "
            INSERT INTO sales (
                id, appointment_id, barbeiro, cliente, servico, valor,
                metodo, unidade, data, hora, timestamp
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            ",
            params![
                Uuid::new_v4().to_string(),
                Option::<String>::None,
                t.barbeiro.trim(),
                if t.cliente.trim().is_empty() {
                    "Consumidor Final"
                } else {
                    t.cliente.trim()
                },
                t.servico.trim(),
                t.valor,
                t.metodo.trim(),
                t.unidade.clone().unwrap_or_else(|| "Matriz Center".to_string()),
                data,
                hora,
                timestamp
            ],
        )
        .map_err(|e| format!("erro ao inserir venda no fechamento: {e}"))?;
    }

    let total_revenue = total_cash + total_card + total_pix;
    let closing_id = Uuid::new_v4().to_string();

    tx.execute(
        "
        INSERT INTO cashier_closings (
            id, admin_id, opened_at, closed_at, opening_balance,
            total_cash, total_card, total_pix, total_revenue,
            discrepancy, notes, is_closed
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0, ?10, 1)
        ",
        params![
            &closing_id,
            &admin_id,
            &timestamp,
            &timestamp,
            payload.opening_balance,
            total_cash,
            total_card,
            total_pix,
            total_revenue,
            payload.notes.clone().unwrap_or_default()
        ],
    )
    .map_err(|e| format!("erro ao salvar fechamento de caixa: {e}"))?;

    tx.commit()
        .map_err(|e| format!("erro ao confirmar fechamento de caixa: {e}"))?;

    Ok(CashierSummary {
        closing_id,
        total_cash,
        total_card,
        total_pix,
        total_revenue,
        transaction_count: payload.transactions.len(),
    })
}

fn map_sale_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<SaleRecord> {
    Ok(SaleRecord {
        id: row.get(0)?,
        appointment_id: row.get(1)?,
        barbeiro: row.get(2)?,
        cliente: row.get(3)?,
        servico: row.get(4)?,
        valor: row.get(5)?,
        metodo: row.get(6)?,
        unidade: row.get(7)?,
        data: row.get(8)?,
        hora: row.get(9)?,
        timestamp: row.get(10)?,
    })
}

fn upsert_client(conn: &rusqlite::Connection, name: &str, phone: &str, now: &str) -> Result<(), String> {
    let exists: Option<String> = conn
        .query_row(
            "SELECT id FROM clients WHERE phone = ?1 LIMIT 1",
            params![phone],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("erro ao validar cliente existente: {e}"))?;

    if exists.is_some() {
        conn.execute(
            "UPDATE clients SET name = ?1, updated_at = ?2 WHERE phone = ?3",
            params![name, now, phone],
        )
        .map_err(|e| format!("erro ao atualizar cliente no upsert: {e}"))?;
    } else {
        conn.execute(
            "INSERT INTO clients (id, name, phone, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![Uuid::new_v4().to_string(), name, phone, now, now],
        )
        .map_err(|e| format!("erro ao inserir cliente no upsert: {e}"))?;
    }

    Ok(())
}

fn insert_sale(conn: &rusqlite::Connection, sale: &SaleRecord) -> Result<(), String> {
    conn.execute(
        "
        INSERT INTO sales (
            id, appointment_id, barbeiro, cliente, servico, valor,
            metodo, unidade, data, hora, timestamp
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
        ",
        params![
            sale.id,
            sale.appointment_id,
            sale.barbeiro,
            sale.cliente,
            sale.servico,
            sale.valor,
            sale.metodo,
            sale.unidade,
            sale.data,
            sale.hora,
            sale.timestamp
        ],
    )
    .map_err(|e| format!("erro ao inserir venda: {e}"))?;

    Ok(())
}

fn get_appointment_by_id(conn: &rusqlite::Connection, id: &str) -> Result<Appointment, String> {
    conn.query_row(
        "
        SELECT id, client_name, client_phone, barber_id, barber_nome,
               service_name, service_price, date, time, status, amount_paid
        FROM appointments WHERE id = ?1
        ",
        params![id],
        |row| {
            Ok(Appointment {
                id: row.get(0)?,
                client_name: row.get(1)?,
                client_phone: row.get(2)?,
                barber_id: row.get(3)?,
                barber_nome: row.get(4)?,
                service_name: row.get(5)?,
                service_price: row.get(6)?,
                date: row.get(7)?,
                time: row.get(8)?,
                status: row.get(9)?,
                amount_paid: row.get(10)?,
            })
        },
    )
    .map_err(|e| format!("agendamento nao encontrado: {e}"))
}

fn normalize_phone(raw: &str) -> String {
    raw.chars().filter(|c| c.is_ascii_digit()).collect()
}

fn validate_client_payload(name: &str, phone: &str) -> Result<(), String> {
    if name.trim().len() < 2 {
        return Err("nome deve ter ao menos 2 caracteres".to_string());
    }

    let normalized_phone = normalize_phone(phone);
    if normalized_phone.len() < 10 {
        return Err("telefone invalido".to_string());
    }

    Ok(())
}

trait BarberIdValidation {
    fn barbear_id_is_empty(&self) -> bool;
}

impl BarberIdValidation for CreateAppointmentRequest {
    fn barbear_id_is_empty(&self) -> bool {
        self.barber_id.trim().is_empty() || self.barber_nome.trim().is_empty()
    }
}
