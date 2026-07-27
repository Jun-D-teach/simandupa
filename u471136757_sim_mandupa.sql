-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 16, 2026 at 01:22 AM
-- Server version: 11.8.8-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u471136757_sim_mandupa`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` varchar(100) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `student_name` varchar(150) NOT NULL,
  `class_id` varchar(50) NOT NULL,
  `attendance_date` date NOT NULL,
  `attendance_time` time NOT NULL,
  `status` enum('hadir','terlambat','sangat terlambat','pulang','tidak hadir') NOT NULL,
  `scanner_id` varchar(50) NOT NULL,
  `notification_sent` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`attendance_id`, `student_id`, `student_name`, `class_id`, `attendance_date`, `attendance_time`, `status`, `scanner_id`, `notification_sent`, `created_at`) VALUES
('20260505_STD-2026-0004', 'STD-2026-0004', 'Joni', '8A', '2026-05-05', '14:59:59', 'sangat terlambat', 'SCN-001', 1, '2026-05-05 14:59:59'),
('20260505_STD-2026-0007', 'STD-2026-0007', 'Yuni', '7A', '2026-05-05', '14:59:55', 'sangat terlambat', 'SCN-001', 1, '2026-05-05 14:59:55'),
('20260505_STD-2026-0008', 'STD-2026-0008', 'deni', '8E', '2026-05-05', '15:00:14', 'sangat terlambat', 'SCN-001', 1, '2026-05-05 15:00:14'),
('20260619_STD-2026-0004', 'STD-2026-0004', 'Joni', '8A', '2026-06-19', '13:13:54', 'sangat terlambat', 'SCN-001', 0, '2026-06-19 13:13:54'),
('20260622_STD-2026-0001', 'STD-2026-0001', 'Junaidi', '8A', '2026-06-22', '13:00:08', 'tidak hadir', 'SYSTEM', 0, '2026-06-22 13:00:08'),
('20260622_STD-2026-0002', 'STD-2026-0002', 'Joko', '8A', '2026-06-22', '13:00:08', 'tidak hadir', 'SYSTEM', 0, '2026-06-22 13:00:08'),
('20260622_STD-2026-0003', 'STD-2026-0003', 'Jaka', '8A', '2026-06-22', '13:00:08', 'tidak hadir', 'SYSTEM', 0, '2026-06-22 13:00:08'),
('20260622_STD-2026-0004', 'STD-2026-0004', 'Joni', '8A', '2026-06-22', '13:00:08', 'tidak hadir', 'SYSTEM', 0, '2026-06-22 13:00:08'),
('20260622_STD-2026-0005', 'STD-2026-0005', 'JUn', '8A', '2026-06-22', '13:00:08', 'tidak hadir', 'SYSTEM', 0, '2026-06-22 13:00:08'),
('20260622_STD-2026-0007', 'STD-2026-0007', 'Yuni', '7A', '2026-06-22', '13:00:08', 'tidak hadir', 'SYSTEM', 0, '2026-06-22 13:00:08'),
('20260622_STD-2026-0008', 'STD-2026-0008', 'deni', '8E', '2026-06-22', '13:00:08', 'tidak hadir', 'SYSTEM', 0, '2026-06-22 13:00:08'),
('20260624_STD-2026-0001', 'STD-2026-0001', 'Junaidi', '8A', '2026-06-24', '13:00:49', 'tidak hadir', 'SYSTEM', 0, '2026-06-24 13:00:49'),
('20260624_STD-2026-0002', 'STD-2026-0002', 'Joko', '8A', '2026-06-24', '13:00:49', 'tidak hadir', 'SYSTEM', 0, '2026-06-24 13:00:49'),
('20260624_STD-2026-0003', 'STD-2026-0003', 'Jaka', '8A', '2026-06-24', '13:00:49', 'tidak hadir', 'SYSTEM', 0, '2026-06-24 13:00:49'),
('20260624_STD-2026-0004', 'STD-2026-0004', 'Joni', '8A', '2026-06-24', '13:00:49', 'tidak hadir', 'SYSTEM', 0, '2026-06-24 13:00:49'),
('20260624_STD-2026-0005', 'STD-2026-0005', 'JUn', '8A', '2026-06-24', '13:00:49', 'tidak hadir', 'SYSTEM', 0, '2026-06-24 13:00:49'),
('20260624_STD-2026-0007', 'STD-2026-0007', 'Yuni', '7A', '2026-06-24', '13:00:49', 'tidak hadir', 'SYSTEM', 0, '2026-06-24 13:00:49'),
('20260624_STD-2026-0008', 'STD-2026-0008', 'deni', '8E', '2026-06-24', '13:00:49', 'tidak hadir', 'SYSTEM', 0, '2026-06-24 13:00:49'),
('20260630_STD-2026-0001', 'STD-2026-0001', 'Junaidi', '8A', '2026-06-30', '13:00:03', 'tidak hadir', 'SYSTEM', 0, '2026-06-30 13:00:03'),
('20260630_STD-2026-0002', 'STD-2026-0002', 'Joko', '8A', '2026-06-30', '13:00:03', 'tidak hadir', 'SYSTEM', 0, '2026-06-30 13:00:03'),
('20260630_STD-2026-0003', 'STD-2026-0003', 'Jaka', '8A', '2026-06-30', '13:00:03', 'tidak hadir', 'SYSTEM', 0, '2026-06-30 13:00:03'),
('20260630_STD-2026-0004', 'STD-2026-0004', 'Joni', '8A', '2026-06-30', '13:00:03', 'tidak hadir', 'SYSTEM', 0, '2026-06-30 13:00:03'),
('20260630_STD-2026-0005', 'STD-2026-0005', 'JUn', '8A', '2026-06-30', '13:00:03', 'tidak hadir', 'SYSTEM', 0, '2026-06-30 13:00:03'),
('20260630_STD-2026-0007', 'STD-2026-0007', 'Yuni', '7A', '2026-06-30', '13:00:03', 'tidak hadir', 'SYSTEM', 0, '2026-06-30 13:00:03'),
('20260630_STD-2026-0008', 'STD-2026-0008', 'deni', '8E', '2026-06-30', '13:00:03', 'tidak hadir', 'SYSTEM', 0, '2026-06-30 13:00:03'),
('20260701_STD-2026-0001', 'STD-2026-0001', 'Junaidi', '8A', '2026-07-01', '13:00:16', 'tidak hadir', 'SYSTEM', 0, '2026-07-01 13:00:16'),
('20260701_STD-2026-0002', 'STD-2026-0002', 'Joko', '8A', '2026-07-01', '13:00:16', 'tidak hadir', 'SYSTEM', 0, '2026-07-01 13:00:16'),
('20260701_STD-2026-0003', 'STD-2026-0003', 'Jaka', '8A', '2026-07-01', '13:00:16', 'tidak hadir', 'SYSTEM', 0, '2026-07-01 13:00:16'),
('20260701_STD-2026-0004', 'STD-2026-0004', 'Joni', '8A', '2026-07-01', '13:00:16', 'tidak hadir', 'SYSTEM', 0, '2026-07-01 13:00:16'),
('20260701_STD-2026-0005', 'STD-2026-0005', 'JUn', '8A', '2026-07-01', '13:00:16', 'tidak hadir', 'SYSTEM', 0, '2026-07-01 13:00:16'),
('20260701_STD-2026-0007', 'STD-2026-0007', 'Yuni', '7A', '2026-07-01', '13:00:16', 'tidak hadir', 'SYSTEM', 0, '2026-07-01 13:00:16'),
('20260701_STD-2026-0008', 'STD-2026-0008', 'deni', '8E', '2026-07-01', '13:00:16', 'tidak hadir', 'SYSTEM', 0, '2026-07-01 13:00:16'),
('20260712_STD-2026-0001', 'STD-2026-0001', 'Junaidi', '8A', '2026-07-12', '13:00:48', 'tidak hadir', 'SYSTEM', 0, '2026-07-12 13:00:48'),
('20260712_STD-2026-0002', 'STD-2026-0002', 'Joko', '8A', '2026-07-12', '13:00:48', 'tidak hadir', 'SYSTEM', 0, '2026-07-12 13:00:48'),
('20260712_STD-2026-0003', 'STD-2026-0003', 'Jaka', '8A', '2026-07-12', '13:00:48', 'tidak hadir', 'SYSTEM', 0, '2026-07-12 13:00:48'),
('20260712_STD-2026-0004', 'STD-2026-0004', 'Joni', '8A', '2026-07-12', '13:00:48', 'tidak hadir', 'SYSTEM', 0, '2026-07-12 13:00:48'),
('20260712_STD-2026-0005', 'STD-2026-0005', 'JUn', '8A', '2026-07-12', '13:00:48', 'tidak hadir', 'SYSTEM', 0, '2026-07-12 13:00:48'),
('20260712_STD-2026-0007', 'STD-2026-0007', 'Yuni', '7A', '2026-07-12', '13:00:48', 'tidak hadir', 'SYSTEM', 0, '2026-07-12 13:00:48'),
('20260712_STD-2026-0008', 'STD-2026-0008', 'deni', '8E', '2026-07-12', '13:00:48', 'tidak hadir', 'SYSTEM', 0, '2026-07-12 13:00:48');

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `class_id` varchar(50) NOT NULL,
  `class_name` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `wali_kelas_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`class_id`, `class_name`, `created_at`, `updated_at`, `wali_kelas_id`) VALUES
('7A', '7', '2026-04-16 09:03:21', '2026-04-27 08:44:44', 'TCH-2026-0001'),
('8A', '8', '2026-04-16 10:16:38', '2026-05-06 11:21:09', 'TCH-2026-0002'),
('8E', '8', '2026-05-05 14:12:15', '2026-05-06 11:21:39', 'TCH-2026-0004'),
('9', '9ab', '2026-06-11 02:57:26', '2026-06-18 03:54:15', 'TCH-2026-0003');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` varchar(100) NOT NULL,
  `attendance_id` varchar(100) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `parent_id` varchar(50) DEFAULT NULL,
  `parent_name` varchar(150) DEFAULT NULL,
  `parent_phone` varchar(30) DEFAULT NULL,
  `parent_email` varchar(150) DEFAULT NULL,
  `parent_relation` varchar(20) DEFAULT NULL,
  `message` text NOT NULL,
  `channel` varchar(30) NOT NULL DEFAULT 'whatsapp',
  `status` enum('sent','failed') NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `attendance_id`, `student_id`, `parent_id`, `parent_name`, `parent_phone`, `parent_email`, `parent_relation`, `message`, `channel`, `status`, `created_at`) VALUES
('20260505_STD-2026-0004_P', '20260505_STD-2026-0004', 'STD-2026-0004', 'PAR-0002', 'Junaidi', '6285366488829', NULL, NULL, 'Ananda Joni (8A) telah absen masuk pada 14:59:59. Status: sangat terlambat.', 'whatsapp', 'sent', '2026-05-05 14:59:59'),
('20260505_STD-2026-0007_P', '20260505_STD-2026-0007', 'STD-2026-0007', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Ananda Yuni (7A) telah absen masuk pada 14:59:55. Status: sangat terlambat.', 'whatsapp', 'sent', '2026-05-05 14:59:56'),
('20260505_STD-2026-0008_P', '20260505_STD-2026-0008', 'STD-2026-0008', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Ananda deni (8E) telah absen masuk pada 15:00:14. Status: sangat terlambat.', 'whatsapp', 'sent', '2026-05-05 15:00:14'),
('20260619_STD-2026-0004_P', '20260619_STD-2026-0004', 'STD-2026-0004', 'PAR-0002', 'Junaidi', '6285366488829', NULL, NULL, 'Ananda Joni (8A) telah absen masuk pada 13:13:54. Status: sangat terlambat.', 'whatsapp', 'failed', '2026-06-19 13:13:54'),
('20260622_STD-2026-0002_A', '20260622_STD-2026-0002', 'STD-2026-0002', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Joko (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-22. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-22 13:00:08'),
('20260622_STD-2026-0003_A', '20260622_STD-2026-0003', 'STD-2026-0003', 'PAR-0002', 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Jaka (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-22. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-22 13:00:08'),
('20260622_STD-2026-0004_A', '20260622_STD-2026-0004', 'STD-2026-0004', 'PAR-0002', 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Joni (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-22. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-22 13:00:08'),
('20260622_STD-2026-0005_A', '20260622_STD-2026-0005', 'STD-2026-0005', NULL, NULL, '09090900', NULL, NULL, 'Yth. Orang Tua/Wali Ananda JUn (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-22. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-22 13:00:08'),
('20260622_STD-2026-0007_A', '20260622_STD-2026-0007', 'STD-2026-0007', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Yuni (7A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-22. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-22 13:00:08'),
('20260622_STD-2026-0008_A', '20260622_STD-2026-0008', 'STD-2026-0008', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda deni (8E). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-22. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-22 13:00:08'),
('20260624_STD-2026-0002_A', '20260624_STD-2026-0002', 'STD-2026-0002', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Joko (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-24. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-24 13:00:49'),
('20260624_STD-2026-0003_A', '20260624_STD-2026-0003', 'STD-2026-0003', 'PAR-0002', 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Jaka (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-24. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-24 13:00:49'),
('20260624_STD-2026-0004_A', '20260624_STD-2026-0004', 'STD-2026-0004', 'PAR-0002', 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Joni (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-24. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-24 13:00:49'),
('20260624_STD-2026-0005_A', '20260624_STD-2026-0005', 'STD-2026-0005', NULL, NULL, '09090900', NULL, NULL, 'Yth. Orang Tua/Wali Ananda JUn (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-24. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-24 13:00:49'),
('20260624_STD-2026-0007_A', '20260624_STD-2026-0007', 'STD-2026-0007', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Yuni (7A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-24. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-24 13:00:49'),
('20260624_STD-2026-0008_A', '20260624_STD-2026-0008', 'STD-2026-0008', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda deni (8E). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-24. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-24 13:00:49'),
('20260630_STD-2026-0002_A', '20260630_STD-2026-0002', 'STD-2026-0002', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Joko (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-30. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-30 13:00:03'),
('20260630_STD-2026-0003_A', '20260630_STD-2026-0003', 'STD-2026-0003', 'PAR-0002', 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Jaka (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-30. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-30 13:00:03'),
('20260630_STD-2026-0004_A', '20260630_STD-2026-0004', 'STD-2026-0004', 'PAR-0002', 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Joni (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-30. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-30 13:00:03'),
('20260630_STD-2026-0005_A', '20260630_STD-2026-0005', 'STD-2026-0005', NULL, NULL, '09090900', NULL, NULL, 'Yth. Orang Tua/Wali Ananda JUn (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-30. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-30 13:00:03'),
('20260630_STD-2026-0007_A', '20260630_STD-2026-0007', 'STD-2026-0007', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Yuni (7A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-30. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-30 13:00:03'),
('20260630_STD-2026-0008_A', '20260630_STD-2026-0008', 'STD-2026-0008', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda deni (8E). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-06-30. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-06-30 13:00:03'),
('20260701_STD-2026-0002_A', '20260701_STD-2026-0002', 'STD-2026-0002', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Joko (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-07-01. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-07-01 13:00:16'),
('20260701_STD-2026-0003_A', '20260701_STD-2026-0003', 'STD-2026-0003', 'PAR-0002', 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Jaka (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-07-01. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-07-01 13:00:16'),
('20260701_STD-2026-0004_A', '20260701_STD-2026-0004', 'STD-2026-0004', 'PAR-0002', 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Joni (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-07-01. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-07-01 13:00:16'),
('20260701_STD-2026-0005_A', '20260701_STD-2026-0005', 'STD-2026-0005', NULL, NULL, '09090900', NULL, NULL, 'Yth. Orang Tua/Wali Ananda JUn (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-07-01. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-07-01 13:00:16'),
('20260701_STD-2026-0007_A', '20260701_STD-2026-0007', 'STD-2026-0007', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Yuni (7A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-07-01. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-07-01 13:00:16'),
('20260701_STD-2026-0008_A', '20260701_STD-2026-0008', 'STD-2026-0008', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda deni (8E). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-07-01. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-07-01 13:00:16'),
('20260712_STD-2026-0002_A', '20260712_STD-2026-0002', 'STD-2026-0002', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Joko (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-07-12. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-07-12 13:00:48'),
('20260712_STD-2026-0003_A', '20260712_STD-2026-0003', 'STD-2026-0003', 'PAR-0002', 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Jaka (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-07-12. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-07-12 13:00:48'),
('20260712_STD-2026-0004_A', '20260712_STD-2026-0004', 'STD-2026-0004', 'PAR-0002', 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Joni (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-07-12. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-07-12 13:00:48'),
('20260712_STD-2026-0005_A', '20260712_STD-2026-0005', 'STD-2026-0005', NULL, NULL, '09090900', NULL, NULL, 'Yth. Orang Tua/Wali Ananda JUn (8A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-07-12. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-07-12 13:00:48'),
('20260712_STD-2026-0007_A', '20260712_STD-2026-0007', 'STD-2026-0007', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda Yuni (7A). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-07-12. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-07-12 13:00:48'),
('20260712_STD-2026-0008_A', '20260712_STD-2026-0008', 'STD-2026-0008', NULL, 'Junaidi', '6285366488829', NULL, NULL, 'Yth. Orang Tua/Wali Ananda deni (8E). Sampai pukul 13:00 ananda TIDAK HADIR / belum melakukan absensi di madrasah pada 2026-07-12. Mohon konfirmasi ke pihak madrasah apabila ada keperluan. Terima kasih.', 'whatsapp', 'failed', '2026-07-12 13:00:48');

-- --------------------------------------------------------

--
-- Table structure for table `scanners`
--

CREATE TABLE `scanners` (
  `scanner_id` varchar(50) NOT NULL,
  `scanner_name` varchar(100) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `status_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `scanners`
--

INSERT INTO `scanners` (`scanner_id`, `scanner_name`, `location`, `status_active`, `created_at`, `updated_at`) VALUES
('SCN-001', 'Scanner 1', 'Gerbang', 1, '2026-04-16 09:08:04', '2026-04-16 09:08:04'),
('SYSTEM', 'Sistem Otomatis', 'Auto', 1, '2026-06-19 13:06:46', '2026-06-19 13:06:46');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('absent_notify_time', '13:00', '2026-06-22 05:49:09'),
('attendance_close_return_time', '18:00', '2026-06-19 13:07:15'),
('attendance_open_time', '15:15', '2026-06-22 05:49:09'),
('current_school_year', '2025/2026', '2026-05-05 11:28:27'),
('current_semester', 'Genap', '2026-05-05 11:50:25'),
('default_homeroom_name', 'Dra. Hj. Hajidah, M.Si', '2026-04-17 08:53:16'),
('default_homeroom_nip', '196808081994032008', '2026-04-17 08:53:16'),
('principal_name', 'Yusri Erlini, M.Pd', '2026-06-11 05:55:59'),
('principal_nip', '196605012005011005', '2026-04-17 08:53:16'),
('school_address', 'Jl. Prof. KH. Zainal Abidin Fikri, Komplek UIN Raden Fatah, Pahlawan, Kec. Kemuning, Kota Palembang, Sumatera Selatan 30126', '2026-04-17 08:53:16'),
('school_late_time', '15:30', '2026-06-22 05:49:09'),
('school_logo_url', '/public/logo-man2.png', '2026-04-17 08:53:16'),
('school_name', 'MAN 2 Palembang', '2026-04-17 08:53:16'),
('school_return_time', '18:00', '2026-06-22 05:49:09'),
('school_start_time', '07:00', '2026-06-11 02:55:57');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `student_id` varchar(50) NOT NULL,
  `nis` varchar(50) DEFAULT NULL,
  `nisn` varchar(50) DEFAULT NULL,
  `student_name` varchar(150) NOT NULL,
  `gender` enum('L','P') DEFAULT NULL,
  `birth_place` varchar(100) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `class_id` varchar(50) NOT NULL,
  `entry_year` year(4) DEFAULT NULL,
  `status_active` enum('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  `parent_id` varchar(50) DEFAULT NULL,
  `parent_name` varchar(150) DEFAULT NULL,
  `parent_phone` varchar(30) DEFAULT NULL,
  `parent_email` varchar(150) DEFAULT NULL,
  `parent_relation` enum('ayah','ibu','wali') DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `qr_code` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `nis`, `nisn`, `student_name`, `gender`, `birth_place`, `birth_date`, `address`, `religion`, `class_id`, `entry_year`, `status_active`, `parent_id`, `parent_name`, `parent_phone`, `parent_email`, `parent_relation`, `created_at`, `updated_at`, `username`, `password`, `qr_code`) VALUES
('STD-2026-0001', NULL, NULL, 'Junaidi', 'L', NULL, NULL, NULL, NULL, '8A', NULL, 'aktif', NULL, NULL, NULL, NULL, NULL, '2026-04-16 08:59:15', '2026-04-23 14:47:06', NULL, '\"\"', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAALPSURBVO3BQW7EVgwFwX6E7n/ljnfh6gOCNBObYVX8wRqjWKMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoFw8l4ZtUTpLQqXRJ6FROkvBNKk8Ua5RijVKsUS5epvKmJJwkoVM5UXlC5U1JeFOxRinWK'),
('STD-2026-0002', '101010102', '101010102', 'Joko', 'L', 'palembang', '1899-11-29', 'sako', 'islam', '8A', '2024', 'aktif', NULL, 'Junaidi', '6285366488829', 'dataumumjun@gmail.com', 'ayah', '2026-04-16 10:18:49', '2026-04-24 09:34:33', NULL, NULL, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAAKVSURBVO3BQY7DVgwFwX6E7n/lziy5+oAgy4kZVsU/rDGKNUqxRinWKMUapVijFGuUYo1SrFGKNUqxRinWKMUapVijFGuUYo1y8VASvkmlS8IdKnck4ZtUnijWKMUapVijXHyYyicl4USlS8IdSehUTlQ+KQmfVKxRijVKsUa5eFkS7lD5JUm4Q+VNxRqlWKMUa5SLH5eEE5UuCZMVa5RijVKsUS6GUfk/K9YoxRqlWKNcvEzl35SETqVLwhMq/yXFGqVYoxRrlIsPS8JkSfgvK9YoxRqlWKNcPKTyy1ROVH5JsUYp1ijFGuXioSR0KnckoVPpknBHEjqVkyS8SeUkCZ3KE8UapVijFGuUi4dUuiQ8kYROpUtCp3KShE7lCZWTJHRJ6FTeVKxRijVKsUa5+DKVkyR0SehUTpLQqdyhcpKEO1S+qVijFGuUYo0S//AvSkKncpKEE5UuCXeo3JGETqVLQqfypmKNUqxRijVK/MMXJaFTOUlCp9Il4USlS0Kn0iXhDpU7knCi8kSxRinWKMUaJf7hhyXhl6h0SehUnijWKMUapVijXDyUhG9S+SSVLgmdSpeEO1S6JLypWKMUa5RijXLxYSqflIQTlS4JJyonKicqJ0k4UemS8EnFGqVYoxRrlIuXJeEOlTuS0Kl0SThJwhMqJ0noVN5UrFGKNUqxRrn4cSonKp+k8kQS3lSsUYo1SrFGuRgmCScqJyonSXhC5U3FGqVYoxRrlIuXqXyTSpeELglPqJwk4Y4kdCpPFGuUYo1SrFEuPiwJ35SEE5UuCZ1Kl4QTlROVLgldEt5UrFGKNUqxRol/WGMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoxRrlH40k8ujvwAO2AAAAAElFTkSuQmCC'),
('STD-2026-0003', '101010202', '101010202', 'Jaka', 'L', 'palembang', '0000-00-00', 'sako', 'islam', '8A', '2024', 'aktif', 'PAR-0002', 'Junaidi', '6285366488829', 'dataumumjun@gmail.com', 'ayah', '2026-04-16 10:28:47', '2026-04-24 11:09:18', '101010202', '123456', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAALWSURBVO3BQY7cQAwEwUxC//9yeY48NSBIs/bSjDAfrDGKNUqxRinWKMUapVijFGuUYo1SrFGKNUqxRinWKMUapVijFGuUYo1y8ZDKT0rCiUqXhE7lJAmdyk9KwhPFGqVYoxRrlIuXJeFNKicqJyonSbgjCW9SeVOxRinWKMUa5eLLVO5Iwh1J6FS6JHQqb1K5IwnfVKxRijVKsUa5GE7lRKVLwm9WrFGKNUqxRrn45VS6JHQq/5NijVKsUYo1ysWXJeGbknCShE6lS8ITSfiXFGuUYo1SrFEuXqbyk1S6JHQqXRI6lS4JJyr/smKNUqxRijWK+WAwlS4JkxVrlGKNUqxRLh5S6ZLQqXRJ6FS6JHQqXRJOVLoknKh0SbhDpUvCiUqXhDcVa5RijVKsUS5epvKESpeETqVLQpeEE5UuCZ1Kl4ROpUvCHUn4pmKNUqxRijWK+eCLVE6S0KmcJOEJlS4JJypdEjqVLgmdSpeEbyrWKMUapVijmA8eUOmS8IRKl4ROpUvCicoTSXhC5SQJbyrWKMUapVijmA8eULkjCXeodEl4QqVLwonKHUm4Q6VLwhPFGqVYoxRrFPPBL6ZykoQ7VLoknKh0SfibijVKsUYp1igXD6n8pCR0SehU7lA5UemScIfKSRLeVKxRijVKsUa5eFkS3qRyRxI6lS4JXRI6lSdUuiR0Kp1Kl4QnijVKsUYp1igXX6ZyRxLuUHlCpUtCp9Kp3KHyk4o1SrFGKdYoF79cEjqVE5UuCZ1Kl4ROpUvCHSpdEt5UrFGKNUqxRrn45VROktCpnCShU+mS0Kl0SThJQqfSJeGJYo1SrFGKNcrFlyXhm5LwhMpJEu5Q+ZuKNUqxRinWKBcvU/lJKidJOEnCiUqXhJMkdCpdEjqVNxVrlGKNUqxRzAdrjGKNUqxRijVKsUYp1ijFGqVYoxRrlGKNUqxRijVKsUYp1ijFGqVYo/wBo1kh/qlKDgkAAAAASUVORK5CYII='),
('STD-2026-0004', '201010202', '101110202', 'Joni', 'L', 'palembang', '0000-00-00', 'sako', 'islam', '8A', '2024', 'aktif', 'PAR-0002', 'Junaidi', '6285366488829', 'dataumumjun@gmail.com', 'ayah', '2026-04-16 11:46:39', '2026-04-24 09:33:22', NULL, NULL, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAALASURBVO3BQW7ARgwEwW5C///yxEeeFhAkOTHDKvODNUaxRinWKMUapVijFGuUYo1SrFGKNUqxRinWKMUapVijFGuUYo1SrFEuHlL5TUnoVE6S0KmcJKFT+U1JeKJYoxRrlGKNcvGyJLxJ5SQJnUqn0iWhU7kjCW9SeVOxRinWKMUa5eJjKnck4Q6VkyScJOEJlTuS8KVijVKsUYo1ysUfl4QTlS4JnUqXhL+sWKMUa5RijXIxjEqXhP+TYo1SrFGKNcrFx5LwJZUTlS4JXRKeSMJ/SbFGKdYoxRrl4mUq/6YkdConKl0STlT+y4o1SrFGKdYo5geDqZwkYZJijVKsUYo1ysVDKl0SOpUuCXeonCThCZUuCScqXRJOVLokdCpdEp4o1ijFGqVYo5gfPKBykoROpUvCJCpdEjqVLglvKtYoxRqlWKNcvCwJnUqXhE7ljiR0KidJuEPlTSq/qVijFGuUYo1y8TKVLgknSehUuiR0Kl0SOpU7VLoknKh0SehUTpLwpWKNUqxRijXKxUNJ6FROVLoknKh0SehUuiR0Kl0SuiR0KidJ6FROktCpnCThiWKNUqxRijWK+cEfpvJEEu5QuSMJnUqXhDcVa5RijVKsUS4eUvlNSThJwolKp3KShCdUuiR8qVijFGuUYo1y8bIkvEnlJAknKidJeFMS7lDpkvBEsUYp1ijFGuXiYyp3JOEJlS4JnUqnckcSOpUTlS4JXyrWKMUapVijXAyThE6lS8KbktCpdEk4ScKbijVKsUYp1igXf5zKm1S+pHKShCeKNUqxRinWKBcfS8KXktCp3KHSJeFE5SQJnUqXhE7lTcUapVijFGuUi5ep/CaVkyScJKFTeULlROVLxRqlWKMUaxTzgzVGsUYp1ijFGqVYoxRrlGKNUqxRijVKsUYp1ijFGqVYoxRrlGKNUqxR/gHIvA4G/tCLbgAAAABJRU5ErkJggg=='),
('STD-2026-0005', NULL, NULL, 'JUn', 'L', NULL, NULL, NULL, NULL, '8A', NULL, 'aktif', NULL, NULL, '09090900', NULL, NULL, '2026-04-23 14:39:51', '2026-04-23 14:39:51', NULL, NULL, NULL),
('STD-2026-0007', '987778798987987', '6767676767', 'Yuni', 'P', 'Palembang', '2001-09-08', 'PROF. KH. ZAINAL ABIDIN KOMPLEK UIN RADEN', 'Islam', '7A', '2024', 'aktif', NULL, 'Junaidi', '6285366488829', 'dataumumjun@gmail.com', 'ayah', '2026-04-24 10:26:30', '2026-04-27 09:20:24', '6767676767', '$2b$10$4mE4u/ayuXI6zeYa4t47Turw.0OwQS7C6zClP2q7lm/reRFdIYp/2', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAAK8SURBVO3BQW7kQAwEwUxC//9yrY88NSBIM2sTjDA/WGMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoxRrl4iGVb0rCEyonSehUvikJTxRrlGKNUqxRLl6WhDepnKh0SThJQqdyRxLepPKmYo1SrFGKNcrFh6nckYQ7ktCpdEnoVLokPKFyRxI+qVijFGuUYo1yMZzKiUqXhL+sWKMUa5RijXLxx6mcJKFTmaxYoxRrlGKNcvFhSfikJJyonCThiST8JsUapVijFGuUi5epfJNKl4STJHQqXRJOVH6zYo1SrFGKNYr5wRqjWKMUa5RijXLxkEqXhE6lS0Kn0iWhU+mScKLSJeFEpUvCHSpdEk5UuiS8qVijFGuUYo1ifvBFKidJuEOlS8KJSpeETqVLQqfSJeE3KdYoxRqlWKNcPKTyJpX/KQmdSpeETqVLQqfSJeGTijVKsUYp1ijmBx+kckcSTlS6JNyhckcSnlA5ScKbijVKsUYp1ijmBw+o3JGEE5VvSsKJyh1JuEOlS8ITxRqlWKMUaxTzgz9MpUtCp9Il4USlS8KJSpeE/6lYoxRrlGKNcvGQyjcloUvCSRJOVD5J5SQJbyrWKMUapVijXLwsCW9S+aQkdCqdSpeEE5UuCZ1Kp9Il4YlijVKsUYo1ysWHqdyRhDtUuiTcodIloVPpVO5Q+aZijVKsUYo1ysUfl4Q7VLokdCpdEjqVLgl3qHRJeFOxRinWKMUa5eKPU+mS0KnckYROpUtCp9Il4SQJnUqXhCeKNUqxRinWKBcfloRPSsJJEjqVTuUkCXeo/E/FGqVYoxRrlIuXqXyTyhNJOFHpknCShE6lS0Kn8qZijVKsUYo1ivnBGqNYoxRrlGKNUqxRijVKsUYp1ijFGqVYoxRrlGKNUqxRijVKsUYp1ij/AHZJD/gcctVaAAAAAElFTkSuQmCC'),
('STD-2026-0008', '98098809899898', '767687576556', 'deni', 'L', 'palembang', '2026-05-04', 'PROF. KH. ZAINAL ABIDIN KOMPLEK UIN RADEN', 'Islam', '8E', '2024', 'aktif', NULL, 'Junaidi', '6285366488829', 'dataumumjun@gmail.com', 'ayah', '2026-05-05 14:13:20', '2026-05-05 14:17:56', '767687576556', '$2b$10$vXM3G7KFOuQtFtLXi9cvwOmciLBwZ1KzN9WwZqG6ap9z0ebC9ehhO', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAAKgSURBVO3BQW7sWAwEwSxC979yjpdcPUCQ2t/NYUT8wRqjWKMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoFw8l4TepnCThCZUuCb9J5YlijVKsUYo1ysXLVN6UhJMkdCpdEk5U7lB5UxLeVKxRijVKsUa5+LAk3KHyRBJOVN6UhDtUPqlYoxRrlGKNcjGMyv9ZsUYp1ijFGuXiy6l0SXhC5ZsVa5RijVKsUS4+TOVfUjlJwhMqf0mxRinWKMUa5eJlSfhNSehUuiR0Kk8k4S8r1ijFGqVYo8QffLEkvEnlmxVrlGKNUqxRLh5KQqfypiR0KneonCShS8KJykkS7lB5U7FGKdYoxRrl4iGVLgmdSpeEO1TuUOmS0KmcqHRJOEnCE0noVJ4o1ijFGqVYo1w8lISTJHQqXRJOktCpPJGETuVEpUtCp3KShE6lS8KbijVKsUYp1igXD6l0SXhC5SQJncodKp+UhE7lROVNxRqlWKMUa5SLh5JwRxLuSMJJEt6UhBOVLgl3JOFE5YlijVKsUYo1SvzBF0tCp9Il4QmVLglvUnlTsUYp1ijFGuXioST8JpVOpUtCp3KShE7lDpWTJJwkoVN5olijFGuUYo1y8TKVNyXhDpWTJNyRhDepfFKxRinWKMUa5eLDknCHyhNJOFHpknCickcSTpLQqbypWKMUa5RijXIxjEqXhL9E5ZOKNUqxRinWKBfDJOEOlS4Jb1LpknCi8kSxRinWKMUa5eLDVP4llTtUTpJwonKi0iXhTcUapVijFGuUi5cl4TcloVM5SUKn8oTKSRI6lU7lTcUapVijFGuU+IM1RrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUf4DDvf070X2TVgAAAAASUVORK5CYII=');

-- --------------------------------------------------------

--
-- Table structure for table `student_permits`
--

CREATE TABLE `student_permits` (
  `permit_id` varchar(100) NOT NULL,
  `teacher_id` varchar(50) NOT NULL,
  `teacher_name` varchar(150) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `student_name` varchar(150) NOT NULL,
  `nis` varchar(50) DEFAULT NULL,
  `nisn` varchar(50) DEFAULT NULL,
  `class_id` varchar(50) DEFAULT NULL,
  `wali_kelas_id` varchar(50) DEFAULT NULL,
  `wali_kelas_name` varchar(150) DEFAULT NULL,
  `permit_type` enum('izin_keluar','izin_pulang','izin_sakit','lainnya') NOT NULL DEFAULT 'izin_keluar',
  `permit_date` date NOT NULL,
  `permit_time` time NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('dibuat','dibatalkan') NOT NULL DEFAULT 'dibuat',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_permits`
--

INSERT INTO `student_permits` (`permit_id`, `teacher_id`, `teacher_name`, `student_id`, `student_name`, `nis`, `nisn`, `class_id`, `wali_kelas_id`, `wali_kelas_name`, `permit_type`, `permit_date`, `permit_time`, `reason`, `status`, `created_at`, `updated_at`) VALUES
('IZIN-1778033602647-STD-2026-0008', 'TCH-2026-0001', 'Musdalifah', 'STD-2026-0008', 'deni', '98098809899898', '767687576556', '8E', NULL, NULL, 'izin_keluar', '2026-05-06', '09:11:00', 'makan', 'dibuat', '2026-05-06 09:13:22', '2026-05-06 09:13:22');

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `teacher_id` varchar(50) NOT NULL,
  `teacher_name` varchar(150) NOT NULL,
  `nip` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `status_active` enum('aktif','nonaktif') DEFAULT 'aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`teacher_id`, `teacher_name`, `nip`, `phone`, `email`, `username`, `password`, `status_active`, `created_at`, `updated_at`) VALUES
('TCH-2026-0001', 'Musdalifah', '1987878272827287', '6265778989898', 'Hui@juj.com', '1987878272827287', '$2b$10$QTkpc.VnU07T.1szVvXwseGo13rz7kmRj0wFSYe0ljUjFAk.ZPuRa', 'aktif', '2026-04-24 08:03:29', '2026-04-24 08:03:29'),
('TCH-2026-0002', 'joko', '779878787', '8798989', 's@mail.com', '779878787', '$2b$10$o5Auze9Eb8PojLCN6Vlv9ud7colKYhEM5Auhh3qfnJ3lhpzGGFUo.', 'aktif', '2026-05-05 07:13:47', '2026-05-05 07:13:47'),
('TCH-2026-0003', 'jaya', '9898789', '999898', 'jun@mal.com', '9898789', '$2b$10$vFLvmCyxuDUN3AbKoQI2Ku7jgIAo.j7TEykNQ2JI8FvhOxIuHhO9e', 'aktif', '2026-05-06 04:10:10', '2026-05-06 04:10:10'),
('TCH-2026-0004', 'jaya', '34343', '085366488829', 'DRAMSCLOFFEN@GMAIL.COM', '34343', '$2b$10$6El66VICwH4GrrMtXnFOQu/0jsBJMdK2i9eElwSrWqq3i0SOl7RVO', 'aktif', '2026-05-06 04:21:32', '2026-05-06 04:21:32');

-- --------------------------------------------------------

--
-- Table structure for table `teacher_roles`
--

CREATE TABLE `teacher_roles` (
  `id` int(11) NOT NULL,
  `teacher_id` varchar(50) NOT NULL,
  `role` enum('guru','wali_kelas','bk','admin','kepala_madrasah','pegawai') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teacher_roles`
--

INSERT INTO `teacher_roles` (`id`, `teacher_id`, `role`, `created_at`) VALUES
(2, 'TCH-2026-0001', 'guru', '2026-04-24 08:11:55'),
(3, 'TCH-2026-0001', 'wali_kelas', '2026-04-24 08:11:55'),
(6, 'TCH-2026-0003', 'guru', '2026-05-06 04:10:10'),
(7, 'TCH-2026-0003', 'wali_kelas', '2026-05-06 04:10:10'),
(8, 'TCH-2026-0002', 'guru', '2026-05-06 04:20:59'),
(9, 'TCH-2026-0002', 'wali_kelas', '2026-05-06 04:20:59'),
(10, 'TCH-2026-0004', 'guru', '2026-05-06 04:21:32'),
(11, 'TCH-2026-0004', 'wali_kelas', '2026-05-06 04:21:32');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'admin',
  `status_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `status_active`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2b$10$IXBflJM9BbWk0W38muuKyek0ba8Qyjk.ipFBj61oTmnLMkf6sB7SS', 'Administrator', 'admin', 1, '2026-04-16 14:00:09', '2026-04-16 14:23:41');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD UNIQUE KEY `uniq_student_date` (`student_id`,`attendance_date`),
  ADD KEY `fk_attendance_class` (`class_id`),
  ADD KEY `fk_attendance_scanner` (`scanner_id`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`class_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `fk_notifications_attendance` (`attendance_id`),
  ADD KEY `fk_notifications_student` (`student_id`);

--
-- Indexes for table `scanners`
--
ALTER TABLE `scanners`
  ADD PRIMARY KEY (`scanner_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `student_permits`
--
ALTER TABLE `student_permits`
  ADD PRIMARY KEY (`permit_id`),
  ADD KEY `idx_permit_teacher` (`teacher_id`),
  ADD KEY `idx_permit_student` (`student_id`),
  ADD KEY `idx_permit_date` (`permit_date`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`teacher_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `teacher_roles`
--
ALTER TABLE `teacher_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_teacher_role` (`teacher_id`,`role`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `teacher_roles`
--
ALTER TABLE `teacher_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `fk_attendance_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`),
  ADD CONSTRAINT `fk_attendance_scanner` FOREIGN KEY (`scanner_id`) REFERENCES `scanners` (`scanner_id`),
  ADD CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_attendance` FOREIGN KEY (`attendance_id`) REFERENCES `attendance` (`attendance_id`),
  ADD CONSTRAINT `fk_notifications_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`);

--
-- Constraints for table `teacher_roles`
--
ALTER TABLE `teacher_roles`
  ADD CONSTRAINT `teacher_roles_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
