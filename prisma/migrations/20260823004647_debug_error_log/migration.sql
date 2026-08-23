-- CreateTable
CREATE TABLE "debug_error_logs" (
    "id" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debug_error_logs_pkey" PRIMARY KEY ("id")
);

