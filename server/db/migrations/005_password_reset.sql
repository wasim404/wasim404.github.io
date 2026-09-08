ALTER TABLE verification_codes
  DROP CONSTRAINT IF EXISTS verification_codes_type_check;

ALTER TABLE verification_codes
  ADD CONSTRAINT verification_codes_type_check
  CHECK (type IN ('email_verify', 'email_bind', 'phone_verify', 'password_reset_email'));
