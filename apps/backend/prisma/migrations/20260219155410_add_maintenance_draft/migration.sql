-- AlterTable
ALTER TABLE `maintenances` ADD COLUMN `mobile_note` TEXT NULL,
    ADD COLUMN `status` ENUM('draft', 'confirmed') NOT NULL DEFAULT 'confirmed',
    MODIFY `operator_id` VARCHAR(191) NULL;
