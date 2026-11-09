ALTER TYPE "TransactionType" ADD VALUE 'KIT_OUT';

CREATE TABLE "Kit" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Kit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KitItem" (
  "id" TEXT NOT NULL,
  "kitId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "quantity" DECIMAL(14,3) NOT NULL,
  CONSTRAINT "KitItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StockTransaction" ADD COLUMN "kitId" TEXT;
ALTER TABLE "StockTransaction" ADD COLUMN "kitQuantity" INTEGER;

CREATE UNIQUE INDEX "Kit_code_key" ON "Kit"("code");
CREATE UNIQUE INDEX "KitItem_kitId_materialId_key" ON "KitItem"("kitId", "materialId");
CREATE INDEX "KitItem_materialId_idx" ON "KitItem"("materialId");
CREATE INDEX "StockTransaction_kitId_idx" ON "StockTransaction"("kitId");

ALTER TABLE "KitItem" ADD CONSTRAINT "KitItem_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KitItem" ADD CONSTRAINT "KitItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
