-- CreateTable
CREATE TABLE "PgCacheRecord" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PgCacheRecord_id_key" ON "PgCacheRecord"("id");
