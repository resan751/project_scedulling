-- Keep existing reports usable while connecting new and existing reports to their owner.
ALTER TABLE `laporan` ADD COLUMN `id_user` INTEGER NULL;

UPDATE `laporan` AS `lap`
INNER JOIN `user` AS `usr` ON `usr`.`nama_user` = `lap`.`nama_user`
SET `lap`.`id_user` = `usr`.`id_user`;

CREATE INDEX `laporan_id_user_idx` ON `laporan`(`id_user`);

ALTER TABLE `laporan`
  ADD CONSTRAINT `laporan_id_user_fkey`
  FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`)
  ON DELETE SET NULL ON UPDATE CASCADE;
