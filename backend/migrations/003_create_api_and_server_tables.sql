USE sms_management_system;

CREATE TABLE IF NOT EXISTS api_clients (
  id CHAR(36) PRIMARY KEY,
  client_name VARCHAR(150) NOT NULL,
  api_key_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  credits DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_api_clients_api_key_hash (api_key_hash),
  INDEX idx_api_clients_status (status)
);

CREATE TABLE IF NOT EXISTS sms_servers (
  id CHAR(36) PRIMARY KEY,
  server_name VARCHAR(150) NOT NULL,
  server_url VARCHAR(255) NOT NULL,
  server_type VARCHAR(64) NOT NULL,
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  priority INT NOT NULL DEFAULT 1,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  credentials JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sms_servers_priority (priority)
);
