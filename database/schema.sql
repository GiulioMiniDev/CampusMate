CREATE DATABASE IF NOT EXISTS campusmate;
USE campusmate;

DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS study_tables;
DROP TABLE IF EXISTS study_rooms;
DROP TABLE IF EXISTS buildings;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    student_number VARCHAR(30) NULL UNIQUE,
    degree_course VARCHAR(120) NULL,
    year_of_study TINYINT UNSIGNED NULL,
    phone VARCHAR(30) NULL,
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE buildings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    address VARCHAR(180) NULL,
    campus_area VARCHAR(100) NULL,
    opening_time TIME NULL,
    closing_time TIME NULL,
    status ENUM('open', 'closed', 'maintenance') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE study_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    floor_label VARCHAR(20) NOT NULL,
    room_code VARCHAR(30) NOT NULL,
    description VARCHAR(255) NULL,
    status ENUM('open', 'closed', 'maintenance') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_study_room_code UNIQUE (building_id, room_code),
    CONSTRAINT fk_study_room_building
        FOREIGN KEY (building_id) REFERENCES buildings(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE study_tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    table_code VARCHAR(30) NOT NULL,
    seats_count TINYINT UNSIGNED NOT NULL DEFAULT 1,
    has_power_outlet BOOLEAN NOT NULL DEFAULT FALSE,
    is_group_table BOOLEAN NOT NULL DEFAULT FALSE,
    layout_x DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    layout_y DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    layout_width DECIMAL(5,2) NOT NULL DEFAULT 14.00,
    layout_height DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    layout_rotation SMALLINT NOT NULL DEFAULT 0,
    status ENUM('available', 'unavailable', 'maintenance') NOT NULL DEFAULT 'available',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_study_table_code UNIQUE (room_id, table_code),
    CONSTRAINT chk_study_table_seats CHECK (seats_count > 0),
    CONSTRAINT fk_study_table_room
        FOREIGN KEY (room_id) REFERENCES study_rooms(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    study_table_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    reservation_type ENUM('individual', 'group') NOT NULL DEFAULT 'individual',
    seats_requested TINYINT UNSIGNED NOT NULL DEFAULT 1,
    status ENUM('active', 'cancelled', 'completed') NOT NULL DEFAULT 'active',
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_reservation_time CHECK (end_time > start_time),
    CONSTRAINT chk_reservation_seats CHECK (seats_requested > 0),
    CONSTRAINT fk_reservation_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_reservation_study_table
        FOREIGN KEY (study_table_id) REFERENCES study_tables(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_study_rooms_building_id ON study_rooms(building_id);
CREATE INDEX idx_study_tables_room_id ON study_tables(room_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_study_table_id ON reservations(study_table_id);
CREATE INDEX idx_reservations_time ON reservations(start_time, end_time);
CREATE INDEX idx_reservations_table_time ON reservations(study_table_id, start_time, end_time);
