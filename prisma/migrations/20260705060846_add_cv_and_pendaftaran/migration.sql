/*
  Warnings:

  - You are about to alter the column `tgl_mulai` on the `project` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deadline` on the `project` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `project` MODIFY `tgl_mulai` DATETIME NOT NULL,
    MODIFY `deadline` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `cv` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `pendaftaran` (
    `id_pendaftaran` INTEGER NOT NULL AUTO_INCREMENT,
    `id_project` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,
    `role_project` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pendaftaran_id_project_idx`(`id_project`),
    INDEX `pendaftaran_id_user_idx`(`id_user`),
    UNIQUE INDEX `pendaftaran_id_project_id_user_role_project_key`(`id_project`, `id_user`, `role_project`),
    PRIMARY KEY (`id_pendaftaran`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pendaftaran` ADD CONSTRAINT `pendaftaran_id_project_fkey` FOREIGN KEY (`id_project`) REFERENCES `project`(`id_project`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pendaftaran` ADD CONSTRAINT `pendaftaran_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;
