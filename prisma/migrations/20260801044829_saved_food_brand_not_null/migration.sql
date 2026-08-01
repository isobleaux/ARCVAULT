/*
  Warnings:

  - Made the column `brand` on table `SavedFood` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SavedFood" ALTER COLUMN "brand" SET NOT NULL,
ALTER COLUMN "brand" SET DEFAULT '';
