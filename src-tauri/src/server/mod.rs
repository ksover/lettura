mod handlers;

use actix_cors::Cors;
use actix_web::{http, middleware, web, App, HttpResponse, HttpServer};
use std::sync::Mutex;
use tauri::AppHandle;

use crate::core::config;
use std::net::TcpListener;

// 检测端口是否可用
fn is_port_available(port: u16) -> bool {
  TcpListener::bind(("127.0.0.1", port)).is_ok()
}

// 动态选择端口
fn find_available_port(start: u16, end: u16) -> Option<u16> {
  (start..=end).find(|&port| is_port_available(port))
}

struct TauriAppState {
  app: Mutex<AppHandle>,
}

#[actix_web::main]
pub async fn init(app: AppHandle) -> std::io::Result<()> {
  let tauri_app = web::Data::new(TauriAppState {
    app: Mutex::new(app),
  });

  let cfg = config::get_user_config();
  let port = cfg.port;
  let port = if is_port_available(port) {
    port
  } else {
    find_available_port(8000, 9000).expect("No available ports")
  };

  config::update_port(port);

  log::debug!("actix_web server start with port: {:?}!", port);

  HttpServer::new(move || {
    let cors = Cors::default()
      .allow_any_origin()
      .allow_any_method()
      .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
      .allowed_header(http::header::CONTENT_TYPE)
      .max_age(3600);

    App::new()
      .wrap(cors)
      .app_data(tauri_app.clone())
      .wrap(middleware::Logger::default())
      .configure(handlers::common::config)
      .configure(handlers::article::config)
      .configure(handlers::feed::config)
      .configure(handlers::folder::config)
  })
  .bind(("127.0.0.1", port))?
  .run()
  .await
}
