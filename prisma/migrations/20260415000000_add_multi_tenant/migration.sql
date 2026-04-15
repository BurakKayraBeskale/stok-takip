BEGIN TRY

BEGIN TRAN;

-- CreateTable: organizations
CREATE TABLE [dbo].[organizations] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [organizations_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [organizations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AlterTable: users - add organizationId
ALTER TABLE [dbo].[users] ADD [organizationId] INT NOT NULL CONSTRAINT [users_organizationId_df] DEFAULT 0;
ALTER TABLE [dbo].[users] DROP CONSTRAINT [users_organizationId_df];

-- AlterTable: warehouses - add organizationId
ALTER TABLE [dbo].[warehouses] ADD [organizationId] INT NOT NULL CONSTRAINT [warehouses_organizationId_df] DEFAULT 0;
ALTER TABLE [dbo].[warehouses] DROP CONSTRAINT [warehouses_organizationId_df];

-- AlterTable: categories - add organizationId
ALTER TABLE [dbo].[categories] ADD [organizationId] INT NOT NULL CONSTRAINT [categories_organizationId_df] DEFAULT 0;
ALTER TABLE [dbo].[categories] DROP CONSTRAINT [categories_organizationId_df];

-- AlterTable: suppliers - add organizationId
ALTER TABLE [dbo].[suppliers] ADD [organizationId] INT NOT NULL CONSTRAINT [suppliers_organizationId_df] DEFAULT 0;
ALTER TABLE [dbo].[suppliers] DROP CONSTRAINT [suppliers_organizationId_df];

-- AlterTable: products - add organizationId, drop old unique constraint on sku
ALTER TABLE [dbo].[products] ADD [organizationId] INT NOT NULL CONSTRAINT [products_organizationId_df] DEFAULT 0;
ALTER TABLE [dbo].[products] DROP CONSTRAINT [products_organizationId_df];
ALTER TABLE [dbo].[products] DROP CONSTRAINT [products_sku_key];

-- AlterTable: inventory - add organizationId, drop old unique constraint
ALTER TABLE [dbo].[inventory] ADD [organizationId] INT NOT NULL CONSTRAINT [inventory_organizationId_df] DEFAULT 0;
ALTER TABLE [dbo].[inventory] DROP CONSTRAINT [inventory_organizationId_df];
ALTER TABLE [dbo].[inventory] DROP CONSTRAINT [inventory_productId_warehouseId_key];

-- AlterTable: purchase_orders - add organizationId, drop old unique constraint on orderNo
ALTER TABLE [dbo].[purchase_orders] ADD [organizationId] INT NOT NULL CONSTRAINT [purchase_orders_organizationId_df] DEFAULT 0;
ALTER TABLE [dbo].[purchase_orders] DROP CONSTRAINT [purchase_orders_organizationId_df];
ALTER TABLE [dbo].[purchase_orders] DROP CONSTRAINT [purchase_orders_orderNo_key];

-- AlterTable: stock_movements - add organizationId
ALTER TABLE [dbo].[stock_movements] ADD [organizationId] INT NOT NULL CONSTRAINT [stock_movements_organizationId_df] DEFAULT 0;
ALTER TABLE [dbo].[stock_movements] DROP CONSTRAINT [stock_movements_organizationId_df];

-- CreateIndex: composite unique for products(organizationId, sku)
CREATE UNIQUE NONCLUSTERED INDEX [products_organizationId_sku_key] ON [dbo].[products]([organizationId], [sku]);

-- CreateIndex: composite unique for inventory(organizationId, productId, warehouseId)
CREATE UNIQUE NONCLUSTERED INDEX [inventory_organizationId_productId_warehouseId_key] ON [dbo].[inventory]([organizationId], [productId], [warehouseId]);

-- CreateIndex: composite unique for purchase_orders(organizationId, orderNo)
CREATE UNIQUE NONCLUSTERED INDEX [purchase_orders_organizationId_orderNo_key] ON [dbo].[purchase_orders]([organizationId], [orderNo]);

-- AddForeignKey: users -> organizations
ALTER TABLE [dbo].[users] ADD CONSTRAINT [users_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: warehouses -> organizations
ALTER TABLE [dbo].[warehouses] ADD CONSTRAINT [warehouses_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: categories -> organizations
ALTER TABLE [dbo].[categories] ADD CONSTRAINT [categories_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: suppliers -> organizations
ALTER TABLE [dbo].[suppliers] ADD CONSTRAINT [suppliers_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: products -> organizations
ALTER TABLE [dbo].[products] ADD CONSTRAINT [products_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: inventory -> organizations
ALTER TABLE [dbo].[inventory] ADD CONSTRAINT [inventory_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: purchase_orders -> organizations
ALTER TABLE [dbo].[purchase_orders] ADD CONSTRAINT [purchase_orders_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: stock_movements -> organizations
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Update existing FK relations to NoAction
ALTER TABLE [dbo].[warehouse_locations] DROP CONSTRAINT [warehouse_locations_warehouseId_fkey];
ALTER TABLE [dbo].[warehouse_locations] ADD CONSTRAINT [warehouse_locations_warehouseId_fkey] FOREIGN KEY ([warehouseId]) REFERENCES [dbo].[warehouses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[categories] DROP CONSTRAINT [categories_parentId_fkey];
ALTER TABLE [dbo].[categories] ADD CONSTRAINT [categories_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[categories]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[products] DROP CONSTRAINT [products_categoryId_fkey];
ALTER TABLE [dbo].[products] ADD CONSTRAINT [products_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[categories]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[products] DROP CONSTRAINT [products_supplierId_fkey];
ALTER TABLE [dbo].[products] ADD CONSTRAINT [products_supplierId_fkey] FOREIGN KEY ([supplierId]) REFERENCES [dbo].[suppliers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[inventory] DROP CONSTRAINT [inventory_productId_fkey];
ALTER TABLE [dbo].[inventory] ADD CONSTRAINT [inventory_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[products]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[inventory] DROP CONSTRAINT [inventory_warehouseId_fkey];
ALTER TABLE [dbo].[inventory] ADD CONSTRAINT [inventory_warehouseId_fkey] FOREIGN KEY ([warehouseId]) REFERENCES [dbo].[warehouses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[inventory] DROP CONSTRAINT [inventory_locationId_fkey];
ALTER TABLE [dbo].[inventory] ADD CONSTRAINT [inventory_locationId_fkey] FOREIGN KEY ([locationId]) REFERENCES [dbo].[warehouse_locations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[purchase_orders] DROP CONSTRAINT [purchase_orders_supplierId_fkey];
ALTER TABLE [dbo].[purchase_orders] ADD CONSTRAINT [purchase_orders_supplierId_fkey] FOREIGN KEY ([supplierId]) REFERENCES [dbo].[suppliers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[purchase_orders] DROP CONSTRAINT [purchase_orders_userId_fkey];
ALTER TABLE [dbo].[purchase_orders] ADD CONSTRAINT [purchase_orders_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[order_items] DROP CONSTRAINT [order_items_purchaseOrderId_fkey];
ALTER TABLE [dbo].[order_items] ADD CONSTRAINT [order_items_purchaseOrderId_fkey] FOREIGN KEY ([purchaseOrderId]) REFERENCES [dbo].[purchase_orders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[order_items] DROP CONSTRAINT [order_items_productId_fkey];
ALTER TABLE [dbo].[order_items] ADD CONSTRAINT [order_items_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[products]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[stock_movements] DROP CONSTRAINT [stock_movements_productId_fkey];
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[products]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[stock_movements] DROP CONSTRAINT [stock_movements_warehouseId_fkey];
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_warehouseId_fkey] FOREIGN KEY ([warehouseId]) REFERENCES [dbo].[warehouses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[stock_movements] DROP CONSTRAINT [stock_movements_userId_fkey];
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
