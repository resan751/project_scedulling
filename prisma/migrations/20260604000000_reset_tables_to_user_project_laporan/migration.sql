DROP TABLE IF EXISTS `laporan`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `project`;
DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
    `id_user` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_user` VARCHAR(100) NOT NULL,
    `role_user` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `user_nama_user_key`(`nama_user`),
    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `project` (
    `id_project` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_project` VARCHAR(100) NOT NULL,
    `nama_user` VARCHAR(100) NOT NULL,
    `role_project` VARCHAR(100) NOT NULL,
    `tgl_mulai` DATETIME NOT NULL,
    `deadline` DATETIME NOT NULL,
    `status_project` VARCHAR(100) NOT NULL,
    `deskripsi_project` VARCHAR(255) NOT NULL,

    INDEX `project_nama_user_idx`(`nama_user`),
    INDEX `project_nama_project_role_project_idx`(`nama_project`, `role_project`),
    PRIMARY KEY (`id_project`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `laporan` (
    `id_laporan` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_project` VARCHAR(100) NOT NULL,
    `nama_user` VARCHAR(100) NOT NULL,
    `role_project` VARCHAR(100) NOT NULL,
    `bukti` VARCHAR(255) NOT NULL,
    `jenis_laporan` VARCHAR(100) NOT NULL,
    `deskripsi_laporan` VARCHAR(255) NOT NULL,

    INDEX `laporan_nama_user_idx`(`nama_user`),
    INDEX `laporan_nama_project_role_project_idx`(`nama_project`, `role_project`),
    PRIMARY KEY (`id_laporan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
