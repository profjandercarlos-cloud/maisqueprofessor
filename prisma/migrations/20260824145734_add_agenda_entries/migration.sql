-- CreateTable
CREATE TABLE "agenda_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agenda_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agenda_entries_userId_weekStart_idx" ON "agenda_entries"("userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "agenda_entries_userId_seriesId_weekStart_weekday_key" ON "agenda_entries"("userId", "seriesId", "weekStart", "weekday");

-- AddForeignKey
ALTER TABLE "agenda_entries" ADD CONSTRAINT "agenda_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

