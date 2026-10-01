-- Tabel OTA dibuat setelah GRANT massal di init migration sijagakali-api
-- (GRANT ... ON ALL TABLES hanya berlaku untuk tabel yang sudah ada saat itu),
-- sehingga service_role (dipakai backend OTA) mendapat "permission denied".
grant select, insert, update, delete
  on sijagakali.firmware_releases, sijagakali.firmware_updates
  to service_role;
