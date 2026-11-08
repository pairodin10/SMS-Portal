USE sms_management_system;

INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Full system access and control over all modules.'),
  ('administrator', 'Platform administration with broad operational permissions.'),
  ('operator', 'Day-to-day messaging and campaign operations.'),
  ('viewer', 'Read-only access to summaries and reporting.')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO permissions (name, description) VALUES
  ('dashboard:view', 'View dashboard data.'),
  ('sms:send', 'Send one-off SMS messages.'),
  ('sms:bulk_send', 'Create and send bulk SMS campaigns.'),
  ('api:manage', 'Manage API clients and API keys.'),
  ('server:manage', 'Add and configure SMS servers.'),
  ('template:manage', 'Manage template content.'),
  ('settings:manage', 'Inspect and update application settings.'),
  ('users:manage', 'Create, update, and deactivate users.'),
  ('audit:view', 'View activity and audit logs.')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Assign all permissions to the super admin role.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON 1 = 1
WHERE r.name = 'super_admin'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Assign operational permissions to administrator and operator roles.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('dashboard:view', 'sms:send', 'sms:bulk_send', 'template:manage', 'audit:view')
WHERE r.name IN ('administrator', 'operator')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Viewer role gets dashboard read-only access.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name = 'dashboard:view'
WHERE r.name = 'viewer'
ON DUPLICATE KEY UPDATE role_id = role_id;
