CREATE DATABASE IF NOT EXISTS campusmate;
USE campusmate;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL DEFAULT 'student'
);

CREATE TABLE IF NOT EXISTS study_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor_label VARCHAR(20) NOT NULL,
    capacity INT NOT NULL,
    available_seats INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    reservation_type VARCHAR(30) NOT NULL DEFAULT 'individual',
    seats_requested INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservation_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_reservation_room FOREIGN KEY (room_id) REFERENCES study_rooms(id)
);

