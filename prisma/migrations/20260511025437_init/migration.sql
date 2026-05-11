-- CreateTable
CREATE TABLE `user` (
    `id_user` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_karyawan` VARCHAR(100) NOT NULL,
    `role` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id_project` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_project` VARCHAR(100) NOT NULL,
    `nama_karyawan` VARCHAR(100) NOT NULL,
    `tgl_mulai` DATETIME NOT NULL,
    `deadline` DATETIME NOT NULL,
    `status_project` VARCHAR(100) NOT NULL,
    `deskripsi` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_project`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
