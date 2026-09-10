-- CreateTable
CREATE TABLE "EntityPost" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityPost_entityId_idx" ON "EntityPost"("entityId");

-- CreateIndex
CREATE INDEX "EntityPost_authorId_idx" ON "EntityPost"("authorId");

-- AddForeignKey
ALTER TABLE "EntityPost" ADD CONSTRAINT "EntityPost_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityPost" ADD CONSTRAINT "EntityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
