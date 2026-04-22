USE campusmate;

INSERT INTO users (full_name, email, role) VALUES
('Mario Rossi', 'mario.rossi@uniroma1.it', 'student'),
('Giulia Bianchi', 'giulia.bianchi@uniroma1.it', 'student');

INSERT INTO study_rooms (name, building, floor_label, capacity, available_seats, status) VALUES
('Aula Studio Alfa', 'Edificio Marco Polo', 'Piano 1', 40, 18, 'open'),
('Aula Studio Beta', 'Edificio Marco Polo', 'Piano 2', 24, 9, 'open'),
('Sala Gruppi Gamma', 'Biblioteca Centrale', 'Piano Terra', 12, 4, 'open');
