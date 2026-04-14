BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[roles] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(100) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [roles_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [roles_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [roles_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [password] NVARCHAR(255) NOT NULL,
    [roleId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[warehouses] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [location] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [warehouses_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [warehouses_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[warehouse_locations] (
    [id] INT NOT NULL IDENTITY(1,1),
    [warehouseId] INT NOT NULL,
    [zone] NVARCHAR(50),
    [aisle] NVARCHAR(50),
    [shelf] NVARCHAR(50),
    [bin] NVARCHAR(50),
    CONSTRAINT [warehouse_locations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[categories] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [parentId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [categories_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [categories_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[suppliers] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [contact] NVARCHAR(255),
    [phone] NVARCHAR(50),
    [email] NVARCHAR(255),
    [address] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [suppliers_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [suppliers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[products] (
    [id] INT NOT NULL IDENTITY(1,1),
    [sku] NVARCHAR(100) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(1000),
    [categoryId] INT NOT NULL,
    [supplierId] INT NOT NULL,
    [unitPrice] DECIMAL(18,2) NOT NULL,
    [unit] NVARCHAR(50) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [products_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [products_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [products_sku_key] UNIQUE NONCLUSTERED ([sku])
);

-- CreateTable
CREATE TABLE [dbo].[inventory] (
    [id] INT NOT NULL IDENTITY(1,1),
    [productId] INT NOT NULL,
    [warehouseId] INT NOT NULL,
    [locationId] INT,
    [quantity] INT NOT NULL CONSTRAINT [inventory_quantity_df] DEFAULT 0,
    [minStock] INT NOT NULL CONSTRAINT [inventory_minStock_df] DEFAULT 0,
    [maxStock] INT,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [inventory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [inventory_productId_warehouseId_key] UNIQUE NONCLUSTERED ([productId],[warehouseId])
);

-- CreateTable
CREATE TABLE [dbo].[purchase_orders] (
    [id] INT NOT NULL IDENTITY(1,1),
    [orderNo] NVARCHAR(100) NOT NULL,
    [supplierId] INT NOT NULL,
    [userId] INT NOT NULL,
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [purchase_orders_status_df] DEFAULT 'pending',
    [totalAmount] DECIMAL(18,2) NOT NULL,
    [orderDate] DATETIME2 NOT NULL CONSTRAINT [purchase_orders_orderDate_df] DEFAULT CURRENT_TIMESTAMP,
    [deliveryDate] DATETIME2,
    CONSTRAINT [purchase_orders_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [purchase_orders_orderNo_key] UNIQUE NONCLUSTERED ([orderNo])
);

-- CreateTable
CREATE TABLE [dbo].[order_items] (
    [id] INT NOT NULL IDENTITY(1,1),
    [purchaseOrderId] INT NOT NULL,
    [productId] INT NOT NULL,
    [quantity] INT NOT NULL,
    [unitPrice] DECIMAL(18,2) NOT NULL,
    [totalPrice] DECIMAL(18,2) NOT NULL,
    CONSTRAINT [order_items_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[stock_movements] (
    [id] INT NOT NULL IDENTITY(1,1),
    [productId] INT NOT NULL,
    [warehouseId] INT NOT NULL,
    [userId] INT NOT NULL,
    [type] NVARCHAR(50) NOT NULL,
    [quantity] INT NOT NULL,
    [reference] NVARCHAR(255),
    [note] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [stock_movements_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [stock_movements_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[users] ADD CONSTRAINT [users_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[roles]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[warehouse_locations] ADD CONSTRAINT [warehouse_locations_warehouseId_fkey] FOREIGN KEY ([warehouseId]) REFERENCES [dbo].[warehouses]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[categories] ADD CONSTRAINT [categories_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[categories]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[products] ADD CONSTRAINT [products_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[categories]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[products] ADD CONSTRAINT [products_supplierId_fkey] FOREIGN KEY ([supplierId]) REFERENCES [dbo].[suppliers]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[inventory] ADD CONSTRAINT [inventory_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[products]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[inventory] ADD CONSTRAINT [inventory_warehouseId_fkey] FOREIGN KEY ([warehouseId]) REFERENCES [dbo].[warehouses]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[inventory] ADD CONSTRAINT [inventory_locationId_fkey] FOREIGN KEY ([locationId]) REFERENCES [dbo].[warehouse_locations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[purchase_orders] ADD CONSTRAINT [purchase_orders_supplierId_fkey] FOREIGN KEY ([supplierId]) REFERENCES [dbo].[suppliers]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[purchase_orders] ADD CONSTRAINT [purchase_orders_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[order_items] ADD CONSTRAINT [order_items_purchaseOrderId_fkey] FOREIGN KEY ([purchaseOrderId]) REFERENCES [dbo].[purchase_orders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[order_items] ADD CONSTRAINT [order_items_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[products]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[products]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_warehouseId_fkey] FOREIGN KEY ([warehouseId]) REFERENCES [dbo].[warehouses]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
