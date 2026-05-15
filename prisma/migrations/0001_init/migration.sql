BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[facilities] (
    [id] NVARCHAR(64) NOT NULL,
    [name] NVARCHAR(200) NOT NULL,
    [address] NVARCHAR(500) NOT NULL,
    [capacity] INT NOT NULL,
    [levelOfCare] NVARCHAR(20) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [facilities_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [facilities_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[patients] (
    [id] NVARCHAR(64) NOT NULL,
    [facilityId] NVARCHAR(64) NOT NULL,
    [admissionDate] DATE NOT NULL,
    [dischargeDate] DATE,
    [levelOfCare] NVARCHAR(20) NOT NULL,
    [primaryDiagnosisCode] NVARCHAR(20) NOT NULL,
    [insurancePayer] NVARCHAR(100) NOT NULL,
    [insuranceAuthExpiresAt] DATE,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [patients_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [patients_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[encounters] (
    [id] NVARCHAR(64) NOT NULL,
    [patientId] NVARCHAR(64) NOT NULL,
    [encounterDate] DATETIME2 NOT NULL,
    [encounterType] NVARCHAR(20) NOT NULL,
    [attended] BIT NOT NULL CONSTRAINT [encounters_attended_df] DEFAULT 1,
    [notes] NVARCHAR(2000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [encounters_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [encounters_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[risk_flags] (
    [id] NVARCHAR(64) NOT NULL,
    [patientId] NVARCHAR(64) NOT NULL,
    [flagType] NVARCHAR(30) NOT NULL,
    [severity] NVARCHAR(20) NOT NULL,
    [resolved] BIT NOT NULL CONSTRAINT [risk_flags_resolved_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [risk_flags_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [resolvedAt] DATETIME2,
    CONSTRAINT [risk_flags_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[patients] ADD CONSTRAINT [patients_facilityId_fkey] FOREIGN KEY ([facilityId]) REFERENCES [dbo].[facilities]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[encounters] ADD CONSTRAINT [encounters_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[patients]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[risk_flags] ADD CONSTRAINT [risk_flags_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[patients]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
