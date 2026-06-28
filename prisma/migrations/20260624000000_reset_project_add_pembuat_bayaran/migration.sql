DROP TABLE IF EXISTS `project`;

CREATE TABLE `project` (
    `id_project` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_project` VARCHAR(100) NOT NULL,
    `pembuat` VARCHAR(100) NOT NULL,
    `id_user` VARCHAR(255) NOT NULL,
    `role_project` VARCHAR(255) NOT NULL,
    `bayaran` INTEGER NOT NULL,
    `tgl_mulai` DATETIME NOT NULL,
    `deadline` DATETIME NOT NULL,
    `status_project` VARCHAR(100) NOT NULL,
    `deskripsi_project` VARCHAR(255) NOT NULL,

    INDEX `project_pembuat_idx`(`pembuat`),
    INDEX `project_id_user_idx`(`id_user`),
    INDEX `project_nama_project_role_project_idx`(`nama_project`, `role_project`),
    PRIMARY KEY (`id_project`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
