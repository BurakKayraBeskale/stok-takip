BEGIN TRY

BEGIN TRAN;

-- AlterTable: order_items - add organizationId column
ALTER TABLE [dbo].[order_items] ADD [organizationId] INT NOT NULL CONSTRAINT [order_items_organizationId_df] DEFAULT 0;
ALTER TABLE [dbo].[order_items] DROP CONSTRAINT [order_items_organizationId_df];

-- AddForeignKey: order_items -> organizations
ALTER TABLE [dbo].[order_items] ADD CONSTRAINT [order_items_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
