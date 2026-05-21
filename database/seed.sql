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
('Admin', 'CampusMate', 'admin@campusmate.local', 'scrypt$Rk4AIE0Kb3t9h_ya1sIP-g$C4h6NzsEe6co-UJKpOFJOe2Ic5A5-69Vt1jhkChG9nDItBGfb1YU7vpHL3WgcI7ZwlEX1bzwo4y8ZrSsSeHP4w', 'admin', NULL, NULL, NULL, NULL, 'active');

INSERT INTO buildings (
    name,
    code,
    address,
    campus_area,
    opening_time,
    closing_time,
    status
) VALUES
('Edificio Marco Polo', 'MP', 'Circonvallazione Tiburtina 4, Roma', 'San Lorenzo', '08:00:00', '20:00:00', 'open'),
('Biblioteca Centrale', 'BC', 'Piazzale Aldo Moro 5, Roma', 'Citta Universitaria', '08:30:00', '22:00:00', 'open'),
('Edificio Fermi', 'EF', 'Piazzale Aldo Moro 5, Roma', 'Citta Universitaria', '09:00:00', '19:00:00', 'open');

INSERT INTO study_rooms (
    building_id,
    name,
    floor_label,
    room_code,
    description,
    status
) VALUES
(1, 'Aula Studio Alfa', 'Piano 1', 'A101', 'Aula silenziosa per studio individuale.', 'open'),
(1, 'Aula Studio Beta', 'Piano 2', 'A204', 'Aula mista con tavoli individuali e tavoli gruppo.', 'open'),
(2, 'Sala Gruppi Gamma', 'Piano Terra', 'G01', 'Sala pensata per lavori di gruppo.', 'open'),
(3, 'Aula Studio Delta', 'Piano 1', 'D110', 'Aula piccola vicino ai laboratori.', 'open');

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
(1, 'T1', 1, TRUE, FALSE, 18.00, 24.00, 13.00, 13.00, 0, 'available'),
(1, 'T2', 1, TRUE, FALSE, 42.00, 24.00, 13.00, 13.00, 0, 'available'),
(1, 'T3', 1, FALSE, FALSE, 18.00, 58.00, 13.00, 13.00, 0, 'available'),
(1, 'T4', 1, FALSE, FALSE, 42.00, 58.00, 13.00, 13.00, 0, 'available'),
(2, 'T1', 1, TRUE, FALSE, 12.00, 18.00, 12.00, 12.00, 0, 'available'),
(2, 'T2', 1, TRUE, FALSE, 12.00, 44.00, 12.00, 12.00, 0, 'available'),
(2, 'G1', 4, TRUE, TRUE, 46.00, 18.00, 27.00, 16.00, 0, 'available'),
(2, 'G2', 4, TRUE, TRUE, 46.00, 54.00, 27.00, 16.00, 0, 'available'),
(3, 'G1', 6, TRUE, TRUE, 16.00, 20.00, 31.00, 18.00, 0, 'available'),
(3, 'G2', 6, TRUE, TRUE, 54.00, 20.00, 31.00, 18.00, 0, 'available'),
(3, 'G3', 4, FALSE, TRUE, 34.00, 58.00, 29.00, 16.00, 0, 'available'),
(4, 'T1', 1, TRUE, FALSE, 26.00, 28.00, 14.00, 14.00, 0, 'available'),
(4, 'T2', 1, FALSE, FALSE, 58.00, 56.00, 14.00, 14.00, 0, 'available');

INSERT INTO reservations (
    user_id,
    study_table_id,
    start_time,
    end_time,
    reservation_type,
    seats_requested,
    status,
    notes
) VALUES
(1, 1, '2026-04-23 09:00:00', '2026-04-23 11:00:00', 'individual', 1, 'active', 'Studio individuale mattina'),
(2, 7, '2026-04-23 14:00:00', '2026-04-23 16:00:00', 'group', 3, 'active', 'Preparazione progetto di gruppo'),
(3, 9, '2026-04-24 10:00:00', '2026-04-24 12:30:00', 'group', 4, 'active', NULL);
