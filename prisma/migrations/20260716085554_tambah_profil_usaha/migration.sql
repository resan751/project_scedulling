/*
  Warnings:

  - You are about to alter the column `tgl_mulai` on the `project` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deadline` on the `project` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `laporan` ADD COLUMN `status_laporan` VARCHAR(50) NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `project` MODIFY `tgl_mulai` DATETIME NOT NULL,
    MODIFY `deadline` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `no_telp` VARCHAR(20) NULL;

-- CreateTable
CREATE TABLE `profil_freelance` (
    `id_profil_freelance` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NOT NULL,
    `headline` VARCHAR(255) NULL,
    `bio` VARCHAR(1000) NULL,
    `linkedin` VARCHAR(255) NULL,

    UNIQUE INDEX `profil_freelance_id_user_key`(`id_user`),
    PRIMARY KEY (`id_profil_freelance`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profil_usaha` (
    `id_profil_usaha` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NOT NULL,
    `nama_usaha` VARCHAR(100) NOT NULL,
    `bidang_usaha` VARCHAR(100) NOT NULL,
    `deskripsi_usaha` VARCHAR(1000) NULL,
    `jumlah_karyawan` INTEGER NULL,
    `tahun_berdiri` INTEGER NULL,
    `email_usaha` VARCHAR(100) NULL,
    `no_tlp_usaha` VARCHAR(20) NULL,
    `alamat_usaha` VARCHAR(255) NULL,

    UNIQUE INDEX `profil_usaha_id_user_key`(`id_user`),
    PRIMARY KEY (`id_profil_usaha`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `profil_freelance` ADD CONSTRAINT `profil_freelance_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profil_usaha` ADD CONSTRAINT `profil_usaha_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;
