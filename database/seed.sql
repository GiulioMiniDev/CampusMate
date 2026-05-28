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
('Facolta di Economia - Palazzo del Castro', 'RM019', 'Via del Castro Laurenziano 9, 00161 Roma', 'Castro Laurenziano', 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Facolt%C3%A0_di_Economia_Universit%C3%A0_Sapienza_Roma.jpg', 41.903494, 12.516568, '08:30 - 20:00', 'Chiuso', JSON_ARRAY('Wi-Fi', 'Prese elettriche', 'Aria condizionata', 'Computer Lab'), '08:30:00', '20:00:00', 'open'),
('Facolta di Architettura Valle Giulia', 'RM062', 'Via Antonio Gramsci 53, 00197 Roma', 'Valle Giulia', 'https://www.radiocolonna.it/public/images/2020/10/D940D26C-8E6B-49AF-B50C-C1B65A2E83D5-1280x720.jpeg', 41.918115, 12.477742, '09:00 - 19:30', 'Chiuso', JSON_ARRAY('Wi-Fi', 'Prese elettriche', 'Tavoli da disegno', 'Fotocopiatrici'), '09:00:00', '19:30:00', 'open'),
('Facolta di Giurisprudenza (Citta Universitaria)', 'CU002', 'Piazzale Aldo Moro 5, 00185 Roma', 'Citta Universitaria', 'https://www.uniroma1.it/sites/default/files/styles/1150_300/public/giurisprudenza_3.jpg', 41.904012, 12.514105, '08:30 - 22:00', 'Sabato 08:30 - 13:30', JSON_ARRAY('Wi-Fi', 'Prese elettriche', 'Riscaldamento', 'Silenziatore acustico'), '08:30:00', '22:00:00', 'open'),
('Sede di Via dei Sardi - San Lorenzo', 'RM035', 'Via dei Sardi 70, 00185 Roma', 'San Lorenzo', 'https://www.uniroma1.it/sites/default/files/styles/1150_300/public/psicologia_2.jpg', 41.897312, 12.519894, '09:00 - 19:00', 'Chiuso', JSON_ARRAY('Wi-Fi', 'Prese elettriche', 'Aria condizionata'), '09:00:00', '19:00:00', 'open');

INSERT INTO receptionist_assignments (user_id, building_id) VALUES
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
