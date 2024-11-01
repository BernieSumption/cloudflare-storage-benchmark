-- Migration number: 0001 	 2024-06-02T12:49:07.539Z

-- CreateTable
CREATE TABLE "CacheRecord" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CacheRecord_id_key" ON "CacheRecord"("id");