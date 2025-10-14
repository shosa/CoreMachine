-- AlterTable
ALTER TABLE `documents` ADD COLUMN `maintenance_id` VARCHAR(191) NULL,
    MODIFY `machine_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_maintenance_id_fkey` FOREIGN KEY (`maintenance_id`) REFERENCES `maintenances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
