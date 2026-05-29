USE campusmate;

INSERT INTO users (
    first_name,
    last_name,
    email,
    password_hash,
    role,
    student_number,
    degree_course,
    year_of_study,
    phone,
    status
) VALUES
('Mario', 'Rossi', 'mario.rossi@uniroma1.it', 'scrypt$-3ZHn0WttRSorj080FSg3A$DhcMso_MI_q3uDM69tS4W21Z5X0v09ccz3CKEtdCPy1x5Cfp6TTTLxftRxLQYvlEJLHN2xmb41S-GfLLlaCG8g', 'student', '1882451', 'Informatica', 2, '+39 333 111 2222', 'active'),
('Giulia', 'Bianchi', 'giulia.bianchi@uniroma1.it', 'scrypt$-3ZHn0WttRSorj080FSg3A$DhcMso_MI_q3uDM69tS4W21Z5X0v09ccz3CKEtdCPy1x5Cfp6TTTLxftRxLQYvlEJLHN2xmb41S-GfLLlaCG8g', 'student', '1882452', 'Ingegneria Gestionale', 1, '+39 333 222 3333', 'active'),
('Luca', 'Verdi', 'luca.verdi@uniroma1.it', 'scrypt$-3ZHn0WttRSorj080FSg3A$DhcMso_MI_q3uDM69tS4W21Z5X0v09ccz3CKEtdCPy1x5Cfp6TTTLxftRxLQYvlEJLHN2xmb41S-GfLLlaCG8g', 'student', '1882453', 'Economia', 3, NULL, 'active'),
('Sara', 'Neri', 'sara.neri@uniroma1.it', 'scrypt$-3ZHn0WttRSorj080FSg3A$DhcMso_MI_q3uDM69tS4W21Z5X0v09ccz3CKEtdCPy1x5Cfp6TTTLxftRxLQYvlEJLHN2xmb41S-GfLLlaCG8g', 'student', '1882454', 'Medicina', 4, '+39 333 444 5555', 'active'),
('Admin', 'CampusMate', 'admin@campusmate.local', 'scrypt$Rk4AIE0Kb3t9h_ya1sIP-g$C4h6NzsEe6co-UJKpOFJOe2Ic5A5-69Vt1jhkChG9nDItBGfb1YU7vpHL3WgcI7ZwlEX1bzwo4y8ZrSsSeHP4w', 'admin', NULL, NULL, NULL, NULL, 'active'),
('Reception', 'Economia', 'reception.economia@campusmate.local', 'scrypt$Rk4AIE0Kb3t9h_ya1sIP-g$C4h6NzsEe6co-UJKpOFJOe2Ic5A5-69Vt1jhkChG9nDItBGfb1YU7vpHL3WgcI7ZwlEX1bzwo4y8ZrSsSeHP4w', 'receptionist', NULL, NULL, NULL, NULL, 'active'),
('Reception', 'Giurisprudenza', 'reception.giurisprudenza@campusmate.local', 'scrypt$Rk4AIE0Kb3t9h_ya1sIP-g$C4h6NzsEe6co-UJKpOFJOe2Ic5A5-69Vt1jhkChG9nDItBGfb1YU7vpHL3WgcI7ZwlEX1bzwo4y8ZrSsSeHP4w', 'receptionist', NULL, NULL, NULL, NULL, 'active');

INSERT INTO buildings (
    name,
    code,
    address,
    campus_area,
    image_url,
    latitude,
    longitude,
    weekday_hours,
    weekend_hours,
    services,
    opening_time,
    closing_time,
    status
) VALUES
('Clinica Ortopedica e Traumatologica', 'CU026', 'Viale del Policlinico 155 / Viale Regina Elena 324, 00161 Roma', 'Sapienza', 'https://www.uniroma1.it/sites/default/files/styles/1150_300/public/900x300-_blioteche_h24_4.jpg', 41.907952, 12.513511, 'H24', 'H24', JSON_ARRAY('Wi-Fi', 'Prese elettriche', 'Aria condizionata', 'Accesso disabili'), '00:00:00', '23:59:00', 'open'),
('Scienze di base e applicate per l''Ingegneria', 'RM007', 'Via Antonio Scarpa 16, 00161 Roma', 'Sapienza', 'https://www.dss.uniroma1.it/sites/default/files/slideimage/2022-05-14.jpg', 41.905183, 12.515944, 'H24', 'H24', JSON_ARRAY('Wi-Fi', 'Prese elettriche', 'Riscaldamento'), '00:00:00', '23:59:00', 'open'),
('Edificio Marco Polo (Ex Poste)', 'RM021', 'Circonvallazione Tiburtina 4, 00185 Roma', 'Sapienza', 'https://apristudio.it/wp-content/uploads/2021/04/Marcopolo_COPERTINA.jpg', 41.899015, 12.522238, '09:00 - 24:00', '09:00 - 19:00', JSON_ARRAY('Wi-Fi', 'Prese elettriche', 'Aria condizionata', 'Ascensore'), '09:00:00', '23:59:00', 'open'),
('Mineralogia, Geologia e Paleontologia', 'CU005', 'Piazzale Aldo Moro 5, 00185 Roma', 'Sapienza', 'https://live.staticflickr.com/4421/36332253681_e4469cac82_z.jpg', 41.902341, 12.514782, '09:00 - 20:00', 'Sabato e Domenica 08:00 - 20:00', JSON_ARRAY('Wi-Fi', 'Prese elettriche'), '09:00:00', '20:00:00', 'open'),
('Edificio E - Viale Regina Elena', 'RM018', 'Viale Regina Elena 295, 00161 Roma', 'Sapienza', 'https://www.di.uniroma1.it/sites/default/files/styles/1150_300/public/Regina%20Elena.jpg', 41.905621, 12.512102, '08:30 - 19:30', 'Chiuso', JSON_ARRAY('Wi-Fi', 'Prese elettriche', 'Laboratorio PC'), '08:30:00', '19:30:00', 'open'),
('Facolta di Economia - Palazzo del Castro', 'RM019', 'Via del Castro Laurenziano 9, 00161 Roma', 'Castro Laurenziano', 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Facolt%C3%A0_di_Economia_Universit%C3%A0_Sapienza_Roma.jpg', 41.903494, 12.516568, '08:30 - 20:00', 'Chiuso', JSON_ARRAY('Wi-Fi', 'Prese elettriche', 'Aria condizionata', 'Computer Lab'), '08:30:00', '20:00:00', 'open'),
('Facolta di Architettura Valle Giulia', 'RM062', 'Via Antonio Gramsci 53, 00197 Roma', 'Valle Giulia', 'https://www.radiocolonna.it/public/images/2020/10/D940D26C-8E6B-49AF-B50C-C1B65A2E83D5-1280x720.jpeg', 41.918115, 12.477742, '09:00 - 19:30', 'Chiuso', JSON_ARRAY('Wi-Fi', 'Prese elettriche', 'Tavoli da disegno', 'Fotocopiatrici'), '09:00:00', '19:30:00', 'open'),
('Facolta di Giurisprudenza (Citta Universitaria)', 'CU002', 'Piazzale Aldo Moro 5, 00185 Roma', 'Citta Universitaria', 'https://live.staticflickr.com/4442/36332287631_0cc57560a4.jpg', 41.904012, 12.514105, '08:30 - 22:00', 'Sabato 08:30 - 13:30', JSON_ARRAY('Wi-Fi', 'Prese elettriche', 'Riscaldamento', 'Silenziatore acustico'), '08:30:00', '22:00:00', 'open'),
('Sede di Via dei Sardi - San Lorenzo', 'RM035', 'Via dei Sardi 70, 00185 Roma', 'San Lorenzo', 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Sapienzia_Roma.jpg', 41.897312, 12.519894, '09:00 - 19:00', 'Chiuso', JSON_ARRAY('Wi-Fi', 'Prese elettriche', 'Aria condizionata'), '09:00:00', '19:00:00', 'open');

INSERT INTO receptionist_assignments (user_id, building_id) VALUES
((SELECT id FROM users WHERE email = 'reception.giurisprudenza@campusmate.local'), (SELECT id FROM buildings WHERE code = 'RM007')),
((SELECT id FROM users WHERE email = 'reception.economia@campusmate.local'), (SELECT id FROM buildings WHERE code = 'RM019')),
((SELECT id FROM users WHERE email = 'reception.giurisprudenza@campusmate.local'), (SELECT id FROM buildings WHERE code = 'CU002'));

INSERT INTO study_rooms (
    building_id,
    name,
    floor_label,
    room_code,
    description,
    status
) VALUES
((SELECT id FROM buildings WHERE code = 'CU026'), 'Sala Lettura Principale', 'Terra', 'policlinico_main', 'Planimetria importata da auleStudioSapienza.json.', 'open'),
((SELECT id FROM buildings WHERE code = 'RM007'), 'Sala Lettura Ghizzetti', 'Terra', 'ghizzetti_main', 'Planimetria importata da auleStudioSapienza.json.', 'open'),
((SELECT id FROM buildings WHERE code = 'RM021'), 'Sala Lettura Studi Orientali', 'Terra', 'studi_orientali', 'Planimetria importata da auleStudioSapienza.json.', 'open'),
((SELECT id FROM buildings WHERE code = 'RM021'), 'Sala Lettura Lingue e Letterature Straniere', '1', 'lingue_straniere', 'Planimetria importata da auleStudioSapienza.json.', 'open'),
((SELECT id FROM buildings WHERE code = 'CU005'), 'Sala Studio della Biblioteca', 'Terra', 'biblioteca_dst', 'Planimetria importata da auleStudioSapienza.json.', 'open'),
((SELECT id FROM buildings WHERE code = 'CU005'), 'Sala Ponte (Stanza 115)', '1', 'sala_ponte', 'Planimetria importata da auleStudioSapienza.json.', 'open'),
((SELECT id FROM buildings WHERE code = 'CU005'), 'Il Tavolone', '2', 'tavolone', 'Planimetria importata da auleStudioSapienza.json.', 'open'),
((SELECT id FROM buildings WHERE code = 'RM018'), 'Aula Studio S4', '-1', 'aula_s4', 'Planimetria importata da auleStudioSapienza.json.', 'open'),
((SELECT id FROM buildings WHERE code = 'RM018'), 'Laboratorio Colossus', '-1', 'colossus', 'Planimetria importata da auleStudioSapienza.json.', 'open'),
((SELECT id FROM buildings WHERE code = 'RM019'), 'Sala Lettura Centrale Gini', 'Terra', 'sala_lettura_centrale', 'Capienza dichiarata: 150 posti. Planimetria generata automaticamente dalla capienza Sapienza.', 'open'),
((SELECT id FROM buildings WHERE code = 'RM019'), 'Sala Consultazione e Periodici', '1', 'sala_consultazione', 'Capienza dichiarata: 60 posti. Planimetria generata automaticamente dalla capienza Sapienza.', 'open'),
((SELECT id FROM buildings WHERE code = 'RM062'), 'Sala Maggiore della Biblioteca', '1', 'biblioteca_centrale_arch', 'Capienza dichiarata: 70 posti. Planimetria generata automaticamente dalla capienza Sapienza.', 'open'),
((SELECT id FROM buildings WHERE code = 'RM062'), 'Aula M4 (Libera consultazione)', 'Terra', 'emme_quattro', 'Capienza dichiarata: 25 posti. Planimetria generata automaticamente dalla capienza Sapienza.', 'open'),
((SELECT id FROM buildings WHERE code = 'CU002'), 'Sala Diritto Privato', 'Terra', 'sala_diritto_privato', 'Capienza dichiarata: 100 posti. Planimetria generata automaticamente dalla capienza Sapienza.', 'open'),
((SELECT id FROM buildings WHERE code = 'CU002'), 'Sala Diritto Pubblico', '1', 'sala_diritto_pubblico', 'Capienza dichiarata: 80 posti. Planimetria generata automaticamente dalla capienza Sapienza.', 'open'),
((SELECT id FROM buildings WHERE code = 'RM035'), 'Sala Lettura Unificata', 'Terra', 'sardi_unica', 'Capienza dichiarata: 50 posti. Planimetria generata automaticamente dalla capienza Sapienza.', 'open');

INSERT INTO study_tables (
    room_id,
    table_code,
    seats_count,
    has_power_outlet,
    is_group_table,
    layout_x,
    layout_y,
    layout_width,
    layout_height,
    layout_rotation,
    status
)
WITH RECURSIVE numbers AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM numbers WHERE n < 60
),
room_capacity AS (
    SELECT sr.id AS room_id, sr.room_code, 150 AS capacity FROM study_rooms sr WHERE sr.room_code = 'sala_lettura_centrale'
    UNION ALL SELECT sr.id, sr.room_code, 60 FROM study_rooms sr WHERE sr.room_code = 'sala_consultazione'
    UNION ALL SELECT sr.id, sr.room_code, 70 FROM study_rooms sr WHERE sr.room_code = 'biblioteca_centrale_arch'
    UNION ALL SELECT sr.id, sr.room_code, 25 FROM study_rooms sr WHERE sr.room_code = 'emme_quattro'
    UNION ALL SELECT sr.id, sr.room_code, 100 FROM study_rooms sr WHERE sr.room_code = 'sala_diritto_privato'
    UNION ALL SELECT sr.id, sr.room_code, 80 FROM study_rooms sr WHERE sr.room_code = 'sala_diritto_pubblico'
    UNION ALL SELECT sr.id, sr.room_code, 50 FROM study_rooms sr WHERE sr.room_code = 'sardi_unica'
),
table_grid AS (
    SELECT
        room_id,
        capacity,
        CEIL(capacity / 4) AS table_count,
        CASE
            WHEN CEIL(capacity / 4) <= 8 THEN 4
            WHEN CEIL(capacity / 4) <= 18 THEN 5
            ELSE 6
        END AS columns_count
    FROM room_capacity
)
SELECT
    tg.room_id,
    CONCAT('T', LPAD(numbers.n, 2, '0')) AS table_code,
    CASE
        WHEN numbers.n = tg.table_count AND MOD(tg.capacity, 4) <> 0 THEN MOD(tg.capacity, 4)
        ELSE 4
    END AS seats_count,
    TRUE AS has_power_outlet,
    TRUE AS is_group_table,
    ROUND(7 + MOD(numbers.n - 1, tg.columns_count) * (84 / GREATEST(tg.columns_count - 1, 1)), 2) AS layout_x,
    ROUND(12 + FLOOR((numbers.n - 1) / tg.columns_count) * (68 / GREATEST(CEIL(tg.table_count / tg.columns_count) - 1, 1)), 2) AS layout_y,
    CASE WHEN tg.table_count > 24 THEN 10.00 ELSE 12.00 END AS layout_width,
    CASE WHEN tg.table_count > 24 THEN 7.50 ELSE 9.00 END AS layout_height,
    0 AS layout_rotation,
    'available' AS status
FROM table_grid tg
INNER JOIN numbers ON numbers.n <= tg.table_count
ORDER BY tg.room_id, numbers.n;

INSERT INTO study_tables (
    room_id,
    table_code,
    seats_count,
    has_power_outlet,
    is_group_table,
    layout_x,
    layout_y,
    layout_width,
    layout_height,
    layout_rotation,
    status
) VALUES
((SELECT id FROM study_rooms WHERE room_code = 'policlinico_main'), 'T1', 6, 1, 1, 14.29, 20.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'policlinico_main'), 'T2', 6, 1, 1, 42.86, 20.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'policlinico_main'), 'T3', 4, 0, 0, 71.43, 20.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'policlinico_main'), 'T4', 6, 1, 1, 14.29, 40.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'policlinico_main'), 'T5', 6, 1, 1, 42.86, 40.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'policlinico_main'), 'T6', 4, 0, 0, 71.43, 40.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'policlinico_main'), 'T7', 6, 1, 1, 14.29, 60.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'policlinico_main'), 'T8', 6, 1, 1, 42.86, 60.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'policlinico_main'), 'T9', 4, 0, 0, 71.43, 60.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'policlinico_main'), 'T10', 4, 1, 0, 14.29, 80.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'policlinico_main'), 'T11', 4, 1, 0, 42.86, 80.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'policlinico_main'), 'T12', 4, 1, 0, 71.43, 80.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'ghizzetti_main'), 'T1', 8, 1, 1, 20.00, 16.67, 12.00, 10.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'ghizzetti_main'), 'T2', 6, 1, 1, 80.00, 16.67, 12.00, 10.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'ghizzetti_main'), 'T3', 8, 1, 1, 20.00, 33.33, 12.00, 10.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'ghizzetti_main'), 'T4', 6, 1, 1, 80.00, 33.33, 12.00, 10.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'ghizzetti_main'), 'T5', 8, 1, 1, 20.00, 50.00, 12.00, 10.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'ghizzetti_main'), 'T6', 6, 1, 1, 80.00, 50.00, 12.00, 10.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'ghizzetti_main'), 'T7', 8, 1, 1, 20.00, 66.67, 12.00, 10.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'ghizzetti_main'), 'T8', 6, 1, 1, 80.00, 66.67, 12.00, 10.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'ghizzetti_main'), 'T9', 8, 0, 1, 20.00, 83.33, 12.00, 10.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'ghizzetti_main'), 'T10', 6, 0, 1, 80.00, 83.33, 12.00, 10.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T1', 8, 1, 1, 14.29, 20.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T2', 8, 1, 1, 28.57, 20.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T3', 8, 1, 1, 71.43, 20.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T4', 8, 1, 1, 85.71, 20.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T5', 8, 1, 1, 14.29, 40.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T6', 8, 1, 1, 28.57, 40.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T7', 8, 1, 1, 71.43, 40.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T8', 8, 1, 1, 85.71, 40.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T9', 8, 1, 1, 14.29, 60.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T10', 8, 1, 1, 28.57, 60.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T11', 8, 1, 1, 71.43, 60.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T12', 8, 1, 1, 85.71, 60.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T13', 7, 1, 1, 14.29, 80.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T14', 7, 1, 1, 28.57, 80.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T15', 7, 1, 1, 71.43, 80.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'studi_orientali'), 'T16', 7, 1, 1, 85.71, 80.00, 8.57, 12.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'lingue_straniere'), 'T1', 5, 1, 0, 20.00, 25.00, 12.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'lingue_straniere'), 'T2', 8, 1, 1, 60.00, 25.00, 12.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'lingue_straniere'), 'T3', 8, 1, 1, 80.00, 25.00, 12.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'lingue_straniere'), 'T4', 5, 1, 0, 20.00, 50.00, 12.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'lingue_straniere'), 'T5', 8, 1, 1, 60.00, 50.00, 12.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'lingue_straniere'), 'T6', 8, 1, 1, 80.00, 50.00, 12.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'lingue_straniere'), 'T7', 5, 0, 0, 20.00, 75.00, 12.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'lingue_straniere'), 'T8', 8, 1, 1, 60.00, 75.00, 12.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'lingue_straniere'), 'T9', 8, 1, 1, 80.00, 75.00, 12.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'biblioteca_dst'), 'T1', 12, 1, 1, 16.67, 25.00, 10.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'biblioteca_dst'), 'T2', 12, 1, 1, 50.00, 25.00, 10.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'biblioteca_dst'), 'T3', 10, 0, 1, 83.33, 25.00, 10.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'biblioteca_dst'), 'T4', 12, 1, 1, 16.67, 50.00, 10.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'biblioteca_dst'), 'T5', 12, 1, 1, 50.00, 50.00, 10.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'biblioteca_dst'), 'T6', 10, 0, 1, 83.33, 50.00, 10.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'biblioteca_dst'), 'T7', 12, 1, 1, 16.67, 75.00, 10.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'biblioteca_dst'), 'T8', 12, 1, 1, 50.00, 75.00, 10.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'biblioteca_dst'), 'T9', 10, 0, 1, 83.33, 75.00, 10.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'sala_ponte'), 'T1', 6, 1, 1, 25.00, 33.33, 15.00, 20.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'sala_ponte'), 'T2', 6, 1, 1, 75.00, 33.33, 15.00, 20.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'sala_ponte'), 'T3', 6, 1, 1, 25.00, 66.67, 15.00, 20.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'sala_ponte'), 'T4', 7, 1, 1, 75.00, 66.67, 15.00, 20.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'tavolone'), 'T1', 15, 1, 1, 50.00, 50.00, 30.00, 30.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'aula_s4'), 'T1', 8, 1, 1, 25.00, 25.00, 15.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'aula_s4'), 'T2', 7, 1, 1, 75.00, 25.00, 15.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'aula_s4'), 'T3', 8, 1, 1, 25.00, 50.00, 15.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'aula_s4'), 'T4', 7, 1, 1, 75.00, 50.00, 15.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'aula_s4'), 'T5', 8, 1, 1, 25.00, 75.00, 15.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'aula_s4'), 'T6', 7, 1, 1, 75.00, 75.00, 15.00, 15.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'colossus'), 'T1', 9, 1, 1, 20.00, 33.33, 12.00, 20.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'colossus'), 'T2', 9, 1, 1, 40.00, 33.33, 12.00, 20.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'colossus'), 'T3', 9, 1, 1, 20.00, 66.67, 12.00, 20.00, 0, 'available'),
((SELECT id FROM study_rooms WHERE room_code = 'colossus'), 'T4', 8, 1, 1, 40.00, 66.67, 12.00, 20.00, 0, 'available');
