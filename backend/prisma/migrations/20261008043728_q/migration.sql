-- CreateTable
CREATE TABLE "EntityQuestion" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "askerId" TEXT NOT NULL,
    "question" VARCHAR(500) NOT NULL,
    "answer" VARCHAR(2000),
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityQuestion_entityId_createdAt_idx" ON "EntityQuestion"("entityId", "createdAt");

-- CreateIndex
CREATE INDEX "EntityQuestion_askerId_idx" ON "EntityQuestion"("askerId");

-- AddForeignKey
ALTER TABLE "EntityQuestion" ADD CONSTRAINT "EntityQuestion_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityQuestion" ADD CONSTRAINT "EntityQuestion_askerId_fkey" FOREIGN KEY ("askerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityQuestion" ADD CONSTRAINT "EntityQuestion_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
