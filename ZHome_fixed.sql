USE master;
GO

IF DB_ID(N'ZHome') IS NOT NULL
BEGIN
    DROP DATABASE [ZHome];
END
GO

CREATE DATABASE [ZHome];
GO

USE [ZHome];
GO

CREATE TABLE [dbo].[__EFMigrationsHistory](
	[MigrationId] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ProductVersion] [nvarchar](32) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
 CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY CLUSTERED 
(
	[MigrationId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bill_transactions](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[monthly_bill_id] [bigint] NOT NULL,
	[tenant_id] [bigint] NOT NULL,
	[amount] [decimal](12, 2) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[note] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
 CONSTRAINT [PK_bill_transactions] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[contracts](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[room_id] [bigint] NOT NULL,
	[tenant_id] [bigint] NOT NULL,
	[start_date] [date] NOT NULL,
	[end_date] [date] NOT NULL,
	[room_price] [decimal](12, 2) NOT NULL,
	[status] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================
-- BẢNG LOCATIONS GỘP TỪ DISTRICTS VÀ WARDS
-- ==========================================
CREATE TABLE [dbo].[locations] (
    [id] [int] NOT NULL,
    [parent_id] [int] NULL, 
    [name] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [type] [nvarchar](50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
 CONSTRAINT [PK_locations] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[favorites](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[room_id] [bigint] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[landlord_verifications](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[id_card_number] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[id_card_front_url] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[id_card_back_url] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ownership_document_url] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[status] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[verified_at] [datetime] NULL,
	[notes] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[matching_profiles](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[student_id] [bigint] NOT NULL,
	[gender] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[budget_min] [decimal](12, 2) NOT NULL,
	[budget_max] [decimal](12, 2) NOT NULL,
	[smoke] [bit] NULL,
	[sleep_late] [bit] NULL,
	[has_pet] [bit] NULL,
	[hometown] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[description] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[roommate_gender_preference] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[is_active] [bit] NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[monthly_bills](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[room_id] [bigint] NOT NULL,
	[billing_month] [int] NOT NULL,
	[billing_year] [int] NOT NULL,
	[room_fee] [decimal](12, 2) NOT NULL,
	[electricity_old_reading] [decimal](10, 2) NULL,
	[electricity_new_reading] [decimal](10, 2) NULL,
	[electricity_fee] [decimal](12, 2) NULL,
	[water_old_reading] [decimal](10, 2) NULL,
	[water_new_reading] [decimal](10, 2) NULL,
	[water_fee] [decimal](12, 2) NULL,
	[service_fee] [decimal](12, 2) NULL,
	[repair_deduction] [decimal](12, 2) NULL,
	[total_amount] [decimal](12, 2) NOT NULL,
	[status] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[paid_at] [datetime] NULL,
	[paid_amount] [decimal](12, 2) NOT NULL,
	[note] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[properties](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[landlord_id] [bigint] NOT NULL,
	[title] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[description] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[address] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[latitude] [decimal](10, 8) NULL,
	[longitude] [decimal](11, 8) NULL,
	[is_verified_tick] [bit] NULL,
	[created_at] [datetime] NULL,
	[view_count] [int] NOT NULL,
	[image_url] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[reports](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[tenant_id] [bigint] NOT NULL,
	[title] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[content] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[status] [nvarchar](50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[created_at] [datetime] NOT NULL,
	[contract_id] [bigint] NULL,
	[rating] [int] NULL,
	[landlord_reply] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[replied_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[roles](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[role_name] [varchar](50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[room_amenities](
	[room_id] [bigint] NOT NULL,
	[amenity_name] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[room_id] ASC,
	[amenity_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[room_images](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[room_id] [bigint] NOT NULL,
	[media_url] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[media_type] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[rooms](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[property_id] [bigint] NOT NULL,
	[room_number] [varchar](50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[price] [decimal](12, 2) NOT NULL,
	[area] [decimal](5, 2) NOT NULL,
	[max_occupants] [int] NOT NULL,
	[status] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[service_orders](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[provider_id] [bigint] NOT NULL,
	[user_id] [bigint] NOT NULL,
	[order_details] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[total_price] [decimal](12, 2) NOT NULL,
	[commission_amount] [decimal](12, 2) NOT NULL,
	[status] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[service_providers](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[provider_name] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[service_type] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[phone] [varchar](15) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[rating] [decimal](3, 2) NULL,
	[is_active] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[subscription_packages](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[price] [decimal](12, 2) NOT NULL,
	[max_rooms] [int] NOT NULL,
	[description] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tax_configs](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[effective_date] [date] NOT NULL,
	[revenue_threshold] [decimal](12, 2) NOT NULL,
	[vat_rate] [decimal](5, 4) NOT NULL,
	[pit_rate] [decimal](5, 4) NOT NULL,
	[description] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[users](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[role_id] [int] NOT NULL,
	[phone] [varchar](15) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[email] [varchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[password_hash] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[full_name] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[avatar_url] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[created_at] [datetime] NULL,
	[updated_at] [datetime] NULL,
	[cccd_number] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[cccd_front_url] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[cccd_back_url] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[verification_status] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[subscription_id] [int] NULL,
	[subscription_end_date] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

-- ==========================================
-- DỮ LIỆU INSERT
-- ==========================================
SET IDENTITY_INSERT [dbo].[bill_transactions] ON 
GO
INSERT [dbo].[bill_transactions] ([id], [monthly_bill_id], [tenant_id], [amount], [created_at], [note]) VALUES (11, 29, 3, CAST(4050000.00 AS Decimal(12, 2)), CAST(N'2026-07-07T13:32:25.6012661' AS DateTime2), N'Landlord logged payment')
INSERT [dbo].[bill_transactions] ([id], [monthly_bill_id], [tenant_id], [amount], [created_at], [note]) VALUES (12, 30, 3, CAST(2050000.00 AS Decimal(12, 2)), CAST(N'2026-07-07T13:32:27.2494789' AS DateTime2), N'Landlord logged payment')
INSERT [dbo].[bill_transactions] ([id], [monthly_bill_id], [tenant_id], [amount], [created_at], [note]) VALUES (13, 31, 10015, CAST(5000000.00 AS Decimal(12, 2)), CAST(N'2026-07-08T07:47:40.2136429' AS DateTime2), N'Landlord logged payment')
INSERT [dbo].[bill_transactions] ([id], [monthly_bill_id], [tenant_id], [amount], [created_at], [note]) VALUES (14, 32, 10017, CAST(2050000.00 AS Decimal(12, 2)), CAST(N'2026-07-08T08:12:16.6617972' AS DateTime2), N'Tenant paid')
INSERT [dbo].[bill_transactions] ([id], [monthly_bill_id], [tenant_id], [amount], [created_at], [note]) VALUES (15, 33, 10020, CAST(2050000.00 AS Decimal(12, 2)), CAST(N'2026-07-13T16:00:22.2450775' AS DateTime2), N'Landlord logged payment')
INSERT [dbo].[bill_transactions] ([id], [monthly_bill_id], [tenant_id], [amount], [created_at], [note]) VALUES (16, 34, 10021, CAST(2447000.00 AS Decimal(12, 2)), CAST(N'2026-07-13T16:07:13.2098711' AS DateTime2), N'Landlord logged payment')
GO
SET IDENTITY_INSERT [dbo].[bill_transactions] OFF
GO

SET IDENTITY_INSERT [dbo].[contracts] ON 
GO
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (1, 1, 4, CAST(N'2026-01-01' AS Date), CAST(N'2026-12-31' AS Date), CAST(2500000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-06-20T10:31:40.710' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (2, 2, 6, CAST(N'2026-06-20' AS Date), CAST(N'2027-06-20' AS Date), CAST(1000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-06-20T03:36:33.400' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (3, 3, 7, CAST(N'2026-06-20' AS Date), CAST(N'2027-06-20' AS Date), CAST(4000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-06-20T03:38:05.357' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (4, 3, 8, CAST(N'2026-06-20' AS Date), CAST(N'2027-06-20' AS Date), CAST(4000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-06-20T03:43:59.257' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (5, 3, 9, CAST(N'2026-06-20' AS Date), CAST(N'2027-06-20' AS Date), CAST(4000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-06-20T03:44:39.910' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (6, 1, 10, CAST(N'2026-06-20' AS Date), CAST(N'2027-06-20' AS Date), CAST(2500000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-06-20T03:54:10.970' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (7, 2, 8, CAST(N'2026-06-20' AS Date), CAST(N'2027-06-20' AS Date), CAST(1000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-06-20T04:10:22.643' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (8, 2, 11, CAST(N'2026-06-20' AS Date), CAST(N'2027-06-20' AS Date), CAST(1000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-06-20T04:48:38.747' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10002, 4, 10006, CAST(N'2026-06-20' AS Date), CAST(N'2027-06-20' AS Date), CAST(2000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-06-20T05:06:31.580' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10003, 5, 10007, CAST(N'2026-06-20' AS Date), CAST(N'2027-06-20' AS Date), CAST(101000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-06-20T05:12:01.247' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10004, 6, 10008, CAST(N'2026-06-20' AS Date), CAST(N'2027-06-20' AS Date), CAST(2000000.00 AS Decimal(12, 2)), N'Terminated', CAST(N'2026-06-20T06:59:44.183' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10005, 7, 10010, CAST(N'2026-06-23' AS Date), CAST(N'2027-06-23' AS Date), CAST(10000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-06-23T01:35:20.770' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10006, 8, 10009, CAST(N'2026-06-23' AS Date), CAST(N'2027-06-23' AS Date), CAST(10000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-06-23T01:39:10.307' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10007, 12, 5, CAST(N'2026-07-03' AS Date), CAST(N'2027-07-03' AS Date), CAST(2000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-07-03T04:49:19.490' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10008, 15, 5, CAST(N'2026-07-04' AS Date), CAST(N'2027-07-04' AS Date), CAST(1000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-07-04T04:52:30.307' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10009, 15, 8, CAST(N'2026-07-04' AS Date), CAST(N'2027-07-04' AS Date), CAST(1000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-07-04T04:58:10.707' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10010, 16, 10014, CAST(N'2026-07-05' AS Date), CAST(N'2027-07-05' AS Date), CAST(2000000.00 AS Decimal(12, 2)), N'Terminated', CAST(N'2026-07-05T15:41:07.433' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10011, 16, 10014, CAST(N'2026-07-05' AS Date), CAST(N'2027-07-05' AS Date), CAST(2000000.00 AS Decimal(12, 2)), N'Terminated', CAST(N'2026-07-05T15:48:14.357' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10012, 16, 10014, CAST(N'2026-07-05' AS Date), CAST(N'2027-07-05' AS Date), CAST(2000000.00 AS Decimal(12, 2)), N'Terminated', CAST(N'2026-07-05T15:48:41.127' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10013, 16, 10014, CAST(N'2026-07-05' AS Date), CAST(N'2027-07-05' AS Date), CAST(2000000.00 AS Decimal(12, 2)), N'Terminated', CAST(N'2026-07-05T15:49:51.687' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10014, 16, 10014, CAST(N'2026-07-05' AS Date), CAST(N'2027-07-05' AS Date), CAST(10000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-07-05T15:54:57.153' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10015, 17, 11, CAST(N'2026-07-06' AS Date), CAST(N'2027-07-06' AS Date), CAST(2000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-07-06T01:48:47.153' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10016, 22, 5, CAST(N'2026-07-08' AS Date), CAST(N'2027-07-08' AS Date), CAST(5000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-07-08T07:45:06.040' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10017, 22, 4, CAST(N'2026-07-08' AS Date), CAST(N'2027-07-08' AS Date), CAST(5000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-07-08T07:45:38.007' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10018, 18, 10017, CAST(N'2026-07-08' AS Date), CAST(N'2027-07-08' AS Date), CAST(2000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-07-08T08:07:42.313' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10019, 25, 9, CAST(N'2026-07-13' AS Date), CAST(N'2027-07-13' AS Date), CAST(2000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-07-13T15:59:47.937' AS DateTime))
INSERT [dbo].[contracts] ([id], [room_id], [tenant_id], [start_date], [end_date], [room_price], [status], [created_at]) VALUES (10020, 26, 11, CAST(N'2026-07-13' AS Date), CAST(N'2027-07-13' AS Date), CAST(2000000.00 AS Decimal(12, 2)), N'Active', CAST(N'2026-07-13T16:05:56.210' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[contracts] OFF
GO

-- ==========================================
-- INSERT CHO BẢNG LOCATIONS (QUẬN, HUYỆN & XÃ PHƯỜNG)
-- ==========================================
-- 1. Cấp Quận / Huyện (parent_id = NULL)
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1, NULL, N'Ba Đình', N'Quận')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (2, NULL, N'Hoàn Kiếm', N'Quận')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (3, NULL, N'Tây Hồ', N'Quận')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (4, NULL, N'Long Biên', N'Quận')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (5, NULL, N'Cầu Giấy', N'Quận')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (6, NULL, N'Đống Đa', N'Quận')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (7, NULL, N'Hai Bà Trưng', N'Quận')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (8, NULL, N'Thanh Xuân', N'Quận')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (9, NULL, N'Hoàng Mai', N'Quận')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (10, NULL, N'Nam Từ Liêm', N'Quận')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (11, NULL, N'Bắc Từ Liêm', N'Quận')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (12, NULL, N'Hà Đông', N'Quận')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (13, NULL, N'Sơn Tây', N'Thị xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (14, NULL, N'Ba Vì', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (15, NULL, N'Chương Mỹ', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (16, NULL, N'Đan Phượng', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (17, NULL, N'Đông Anh', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (18, NULL, N'Gia Lâm', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (19, NULL, N'Hoài Đức', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (20, NULL, N'Mê Linh', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (21, NULL, N'Mỹ Đức', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (22, NULL, N'Phú Xuyên', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (23, NULL, N'Phúc Thọ', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (24, NULL, N'Quốc Oai', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (25, NULL, N'Sóc Sơn', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (26, NULL, N'Thạch Thất', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (27, NULL, N'Thanh Oai', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (28, NULL, N'Thanh Trì', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (29, NULL, N'Thường Tín', N'Huyện')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (30, NULL, N'Ứng Hòa', N'Huyện')

-- 2. Cấp Phường / Xã / Thị trấn
-- Cầu Giấy (id = 5)
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (101, 5, N'Dịch Vọng', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (102, 5, N'Dịch Vọng Hậu', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (103, 5, N'Mai Dịch', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (104, 5, N'Nghĩa Đô', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (105, 5, N'Nghĩa Tân', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (106, 5, N'Quan Hoa', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (107, 5, N'Trung Hòa', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (108, 5, N'Yên Hòa', N'Phường')
-- Đống Đa (id = 6)
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (201, 6, N'Cát Linh', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (202, 6, N'Hàng Bột', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (203, 6, N'Khâm Thiên', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (204, 6, N'Khương Thượng', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (205, 6, N'Kim Liên', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (206, 6, N'Láng Hạ', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (207, 6, N'Láng Thượng', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (208, 6, N'Nam Đồng', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (209, 6, N'Ngã Tư Sở', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (210, 6, N'Ô Chợ Dừa', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (211, 6, N'Phương Mai', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (212, 6, N'Quang Trung', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (213, 6, N'Thịnh Quang', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (214, 6, N'Thổ Quan', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (215, 6, N'Trung Liệt', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (216, 6, N'Trung Tự', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (217, 6, N'Văn Miếu', N'Phường')
-- Thanh Xuân (id = 8)
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (301, 8, N'Hạ Đình', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (302, 8, N'Khương Đình', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (303, 8, N'Khương Mai', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (304, 8, N'Khương Trung', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (305, 8, N'Nhân Chính', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (306, 8, N'Phương Liệt', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (307, 8, N'Thanh Xuân Bắc', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (308, 8, N'Thanh Xuân Nam', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (309, 8, N'Thượng Đình', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (310, 8, N'Kim Giang', N'Phường')
-- Nam Từ Liêm (id = 10)
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (401, 10, N'Cầu Diễn', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (402, 10, N'Đại Mỗ', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (403, 10, N'Mễ Trì', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (404, 10, N'Mỹ Đình 1', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (405, 10, N'Mỹ Đình 2', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (406, 10, N'Phú Đô', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (407, 10, N'Phương Canh', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (408, 10, N'Tây Mỗ', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (409, 10, N'Trung Văn', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (410, 10, N'Xuân Phương', N'Phường')
-- Bắc Từ Liêm (id = 11)
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (501, 11, N'Cổ Nhuế 1', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (502, 11, N'Cổ Nhuế 2', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (503, 11, N'Đông Ngạc', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (504, 11, N'Đức Thắng', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (505, 11, N'Liên Mạc', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (506, 11, N'Minh Khai', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (507, 11, N'Phú Diễn', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (508, 11, N'Phúc Diễn', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (509, 11, N'Tây Tựu', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (510, 11, N'Thượng Cát', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (511, 11, N'Thụy Phương', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (512, 11, N'Xuân Đỉnh', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (513, 11, N'Xuân Tảo', N'Phường')
-- Ba Đình (id = 1)
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (601, 1, N'Cống Vị', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (602, 1, N'Điện Biên', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (603, 1, N'Đội Cấn', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (604, 1, N'Giảng Võ', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (605, 1, N'Kim Mã', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (606, 1, N'Liễu Giai', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (607, 1, N'Ngọc Khánh', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (608, 1, N'Ngọc Hà', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (609, 1, N'Phúc Xá', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (610, 1, N'Thành Công', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (611, 1, N'Trúc Bạch', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (612, 1, N'Vĩnh Phúc', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (613, 1, N'Quán Thánh', N'Phường')
-- Hoàn Kiếm (id = 2)
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (701, 2, N'Chương Dương', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (702, 2, N'Cửa Đông', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (703, 2, N'Cửa Nam', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (704, 2, N'Đồng Xuân', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (705, 2, N'Hàng Bạc', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (706, 2, N'Hàng Bài', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (707, 2, N'Hàng Bông', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (708, 2, N'Hàng Gai', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (709, 2, N'Hàng Mã', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (710, 2, N'Lý Thái Tổ', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (711, 2, N'Phan Chu Trinh', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (712, 2, N'Tràng Tiền', N'Phường')
-- Hai Bà Trưng (id = 7)
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (801, 7, N'Bạch Đằng', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (802, 7, N'Bách Khoa', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (803, 7, N'Bạch Mai', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (804, 7, N'Cầu Dền', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (805, 7, N'Đồng Nhân', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (806, 7, N'Đồng Tâm', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (807, 7, N'Lê Đại Hành', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (808, 7, N'Minh Khai', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (809, 7, N'Nguyễn Du', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (810, 7, N'Phạm Đình Hổ', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (811, 7, N'Phố Huế', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (812, 7, N'Quỳnh Mai', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (813, 7, N'Thanh Lương', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (814, 7, N'Thanh Nhàn', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (815, 7, N'Trương Định', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (816, 7, N'Vĩnh Tuy', N'Phường')
-- Tây Hồ (id = 3)
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (901, 3, N'Bưởi', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (902, 3, N'Quảng An', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (903, 3, N'Thụy Khuê', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (904, 3, N'Tứ Liên', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (905, 3, N'Xuân La', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (906, 3, N'Yên Phụ', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (907, 3, N'Nhật Tân', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (908, 3, N'Phú Thượng', N'Phường')
-- Hà Đông (id = 12)
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1001, 12, N'Biên Giang', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1002, 12, N'Đồng Mai', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1003, 12, N'Dương Nội', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1004, 12, N'Hà Cầu', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1005, 12, N'Kiến Hưng', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1006, 12, N'La Khê', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1007, 12, N'Mộ Lao', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1008, 12, N'Nguyễn Trãi', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1009, 12, N'Phú La', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1010, 12, N'Phú Lãm', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1011, 12, N'Phú Lương', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1012, 12, N'Phúc La', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1013, 12, N'Quang Trung', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1014, 12, N'Vạn Phúc', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1015, 12, N'Văn Quán', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1016, 12, N'Yên Nghĩa', N'Phường')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1017, 12, N'Yết Kiêu', N'Phường')
-- Gia Lâm (id = 18)
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1101, 18, N'Trâu Quỳ', N'Thị trấn')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1102, 18, N'Yên Viên', N'Thị trấn')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1103, 18, N'Phú Sơn', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1104, 18, N'Bát Tràng', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1105, 18, N'Thiên Đức', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1106, 18, N'Cổ Bi', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1107, 18, N'Đa Tốn', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1108, 18, N'Đặng Xá', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1109, 18, N'Dương Xá', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1110, 18, N'Kiêu Kỵ', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1111, 18, N'Lệ Chi', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1112, 18, N'Ninh Hiệp', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1113, 18, N'Phù Đổng', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1114, 18, N'Trung Mầu', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1115, 18, N'Dương Quang', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1116, 18, N'Kim Lan', N'Xã')
INSERT [dbo].[locations] ([id], [parent_id], [name], [type]) VALUES (1117, 18, N'Văn Đức', N'Xã')
GO

SET IDENTITY_INSERT [dbo].[landlord_verifications] ON 
GO
INSERT [dbo].[landlord_verifications] ([id], [user_id], [id_card_number], [id_card_front_url], [id_card_back_url], [ownership_document_url], [status], [verified_at], [notes]) VALUES (1, 2, N'037096001234', N'/media/cards/hung_front.png', N'/media/cards/hung_back.png', N'/media/docs/hung_redbook.pdf', N'Approved', CAST(N'2026-06-20T10:31:40.667' AS DateTime), N'Giấy tờ pháp lý đầy đủ và hợp lệ')
INSERT [dbo].[landlord_verifications] ([id], [user_id], [id_card_number], [id_card_front_url], [id_card_back_url], [ownership_document_url], [status], [verified_at], [notes]) VALUES (2, 3, N'037096005678', N'/media/cards/mai_front.png', N'/media/cards/mai_back.png', N'/media/docs/mai_redbook.pdf', N'Pending', NULL, N'Đang đối chiếu thông tin với cơ sở dữ liệu quốc gia')
GO
SET IDENTITY_INSERT [dbo].[landlord_verifications] OFF
GO

SET IDENTITY_INSERT [dbo].[matching_profiles] ON 
GO
INSERT [dbo].[matching_profiles] ([id], [student_id], [gender], [budget_min], [budget_max], [smoke], [sleep_late], [has_pet], [hometown], [description], [roommate_gender_preference], [is_active], [created_at]) VALUES (1, 4, N'Male', CAST(1500000.00 AS Decimal(12, 2)), CAST(2500000.00 AS Decimal(12, 2)), 0, 0, 0, N'Thanh Hóa', N'Mình là sinh viên năm 2 Đại học Bách Khoa, tính cách hòa đồng, gọn gàng ngăn nắp, mong muốn tìm bạn cùng phòng không hút thuốc và giữ vệ sinh chung.', N'Male', 1, CAST(N'2026-06-20T10:31:40.707' AS DateTime))
INSERT [dbo].[matching_profiles] ([id], [student_id], [gender], [budget_min], [budget_max], [smoke], [sleep_late], [has_pet], [hometown], [description], [roommate_gender_preference], [is_active], [created_at]) VALUES (2, 5, N'Male', CAST(2000000.00 AS Decimal(12, 2)), CAST(3500000.00 AS Decimal(12, 2)), 1, 0, 0, N'Đà Nẵng', N'Mình học RMIT, thích nuôi mèo, hay thức đêm làm đồ án thiết kế. Tìm bạn nữ thoải mái, tôn trọng không gian riêng tư.', N'Female', 1, CAST(N'2026-06-20T10:31:40.707' AS DateTime))
INSERT [dbo].[matching_profiles] ([id], [student_id], [gender], [budget_min], [budget_max], [smoke], [sleep_late], [has_pet], [hometown], [description], [roommate_gender_preference], [is_active], [created_at]) VALUES (3, 10018, N'Male', CAST(1500000.00 AS Decimal(12, 2)), CAST(3000000.00 AS Decimal(12, 2)), 1, 1, 1, N'Hà Nội', N'Ăn ở vệ sinh sạch sẽ', N'Male', 1, CAST(N'2026-07-13T15:50:11.653' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[matching_profiles] OFF
GO

SET IDENTITY_INSERT [dbo].[monthly_bills] ON 
GO
INSERT [dbo].[monthly_bills] ([id], [room_id], [billing_month], [billing_year], [room_fee], [electricity_old_reading], [electricity_new_reading], [electricity_fee], [water_old_reading], [water_new_reading], [water_fee], [service_fee], [repair_deduction], [total_amount], [status], [paid_at], [paid_amount], [note]) VALUES (29, 3, 7, 2026, CAST(4000000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(50000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(4050000.00 AS Decimal(12, 2)), N'Paid', CAST(N'2026-07-07T13:32:25.600' AS DateTime), CAST(4050000.00 AS Decimal(12, 2)), NULL)
INSERT [dbo].[monthly_bills] ([id], [room_id], [billing_month], [billing_year], [room_fee], [electricity_old_reading], [electricity_new_reading], [electricity_fee], [water_old_reading], [water_new_reading], [water_fee], [service_fee], [repair_deduction], [total_amount], [status], [paid_at], [paid_amount], [note]) VALUES (30, 4, 7, 2026, CAST(2000000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(50000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(2050000.00 AS Decimal(12, 2)), N'Paid', CAST(N'2026-07-07T13:32:27.250' AS DateTime), CAST(2050000.00 AS Decimal(12, 2)), NULL)
INSERT [dbo].[monthly_bills] ([id], [room_id], [billing_month], [billing_year], [room_fee], [electricity_old_reading], [electricity_new_reading], [electricity_fee], [water_old_reading], [water_new_reading], [water_fee], [service_fee], [repair_deduction], [total_amount], [status], [paid_at], [paid_amount], [note]) VALUES (31, 22, 7, 2026, CAST(5000000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(5000000.00 AS Decimal(12, 2)), N'Paid', CAST(N'2026-07-08T07:47:40.213' AS DateTime), CAST(5000000.00 AS Decimal(12, 2)), NULL)
INSERT [dbo].[monthly_bills] ([id], [room_id], [billing_month], [billing_year], [room_fee], [electricity_old_reading], [electricity_new_reading], [electricity_fee], [water_old_reading], [water_new_reading], [water_fee], [service_fee], [repair_deduction], [total_amount], [status], [paid_at], [paid_amount], [note]) VALUES (32, 18, 7, 2026, CAST(2000000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(50000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(2050000.00 AS Decimal(12, 2)), N'Paid', CAST(N'2026-07-08T08:12:16.660' AS DateTime), CAST(2050000.00 AS Decimal(12, 2)), NULL)
INSERT [dbo].[monthly_bills] ([id], [room_id], [billing_month], [billing_year], [room_fee], [electricity_old_reading], [electricity_new_reading], [electricity_fee], [water_old_reading], [water_new_reading], [water_fee], [service_fee], [repair_deduction], [total_amount], [status], [paid_at], [paid_amount], [note]) VALUES (33, 25, 7, 2026, CAST(2000000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(50000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(2050000.00 AS Decimal(12, 2)), N'Paid', CAST(N'2026-07-13T16:00:22.243' AS DateTime), CAST(2050000.00 AS Decimal(12, 2)), NULL)
INSERT [dbo].[monthly_bills] ([id], [room_id], [billing_month], [billing_year], [room_fee], [electricity_old_reading], [electricity_new_reading], [electricity_fee], [water_old_reading], [water_new_reading], [water_fee], [service_fee], [repair_deduction], [total_amount], [status], [paid_at], [paid_amount], [note]) VALUES (34, 26, 7, 2026, CAST(2000000.00 AS Decimal(12, 2)), CAST(1.00 AS Decimal(10, 2)), CAST(100.00 AS Decimal(10, 2)), CAST(297000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(10, 2)), CAST(10.00 AS Decimal(10, 2)), CAST(100000.00 AS Decimal(12, 2)), CAST(50000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(2447000.00 AS Decimal(12, 2)), N'Paid', CAST(N'2026-07-13T16:07:13.210' AS DateTime), CAST(2447000.00 AS Decimal(12, 2)), NULL)
GO
SET IDENTITY_INSERT [dbo].[monthly_bills] OFF
GO

SET IDENTITY_INSERT [dbo].[properties] ON 
GO
INSERT [dbo].[properties] ([id], [landlord_id], [title], [description], [address], [latitude], [longitude], [is_verified_tick], [created_at], [view_count], [image_url]) VALUES (1, 2, N'Khu Trọ Hùng Phát Cầu Giấy', N'Phòng trọ cao cấp, khép kín, an ninh tốt, gần Đại học Quốc Gia Hà Nội.', N'Số 12 Ngõ 102 Trần Thái Tông, Cầu Giấy, Hà Nội', CAST(21.02780000 AS Decimal(10, 8)), CAST(105.78820000 AS Decimal(11, 8)), 1, CAST(N'2026-07-06T15:39:01.137' AS DateTime), 10, NULL)
INSERT [dbo].[properties] ([id], [landlord_id], [title], [description], [address], [latitude], [longitude], [is_verified_tick], [created_at], [view_count], [image_url]) VALUES (2, 3, N'Chung cư Mini Trần Mai', N'Đầy đủ đồ đạc, thang máy, chỗ để xe rộng rãi, tự do giờ giấc.', N'Số 8 Láng Hạ, Đống Đa, Hà Nội', CAST(21.01890000 AS Decimal(10, 8)), CAST(105.81730000 AS Decimal(11, 8)), 0, CAST(N'2026-07-06T15:39:01.137' AS DateTime), 11, N'/media/properties/property_0712345678_639190195043722201.jpg')
INSERT [dbo].[properties] ([id], [landlord_id], [title], [description], [address], [latitude], [longitude], [is_verified_tick], [created_at], [view_count], [image_url]) VALUES (3, 3, N'Nhà trọ Hùng Hồn', N'Bảo mật tuyệt đối', N'Hòa Lạc', NULL, NULL, 0, CAST(N'2026-07-06T15:39:01.137' AS DateTime), 0, N'/media/properties/property_0712345678_639190195096261979.jpg')
INSERT [dbo].[properties] ([id], [landlord_id], [title], [description], [address], [latitude], [longitude], [is_verified_tick], [created_at], [view_count], [image_url]) VALUES (4, 10009, N'Chung cư to nhất HÀ NỘi', N'Đầy đủ tiện nghi', N'Hà Nội', NULL, NULL, 0, CAST(N'2026-07-06T15:39:01.137' AS DateTime), 12, NULL)
INSERT [dbo].[properties] ([id], [landlord_id], [title], [description], [address], [latitude], [longitude], [is_verified_tick], [created_at], [view_count], [image_url]) VALUES (5, 10012, N'Nhà trọ Uy Tín', N'', N'Hòa Lạc, Hà Nội', NULL, NULL, 0, CAST(N'2026-07-06T15:39:01.137' AS DateTime), 8, NULL)
INSERT [dbo].[properties] ([id], [landlord_id], [title], [description], [address], [latitude], [longitude], [is_verified_tick], [created_at], [view_count], [image_url]) VALUES (6, 10013, N'chung cư', N'', N'Cầu giấy', NULL, NULL, 1, CAST(N'2026-07-06T15:39:01.137' AS DateTime), 1, NULL)
INSERT [dbo].[properties] ([id], [landlord_id], [title], [description], [address], [latitude], [longitude], [is_verified_tick], [created_at], [view_count], [image_url]) VALUES (7, 10011, N'A', N'', N'A A, , Hoàng Mai, Hà Nội', NULL, NULL, 1, CAST(N'2026-07-06T15:39:01.137' AS DateTime), 12, N'/media/properties/property_0928374659_639189834973113138.jpg')
INSERT [dbo].[properties] ([id], [landlord_id], [title], [description], [address], [latitude], [longitude], [is_verified_tick], [created_at], [view_count], [image_url]) VALUES (8, 10011, N'B', N'', N'số 11 , , Cầu Giấy, Hà Nội', NULL, NULL, 1, CAST(N'2026-07-07T00:56:52.143' AS DateTime), 15, N'/media/properties/property_0928374659_639189826121414030.jpg')
INSERT [dbo].[properties] ([id], [landlord_id], [title], [description], [address], [latitude], [longitude], [is_verified_tick], [created_at], [view_count], [image_url]) VALUES (9, 10015, N'CC MN', N'good', N'A , xã Thạch Hòa, , Hà Nội', NULL, NULL, 0, CAST(N'2026-07-08T07:42:49.587' AS DateTime), 1, N'/media/properties/property_0993874659_639190933695755100.jpg')
INSERT [dbo].[properties] ([id], [landlord_id], [title], [description], [address], [latitude], [longitude], [is_verified_tick], [created_at], [view_count], [image_url]) VALUES (10, 10020, N'chung cư', N'nhà tốt', N'số nhà 30 , , Long Biên, Hà Nội', NULL, NULL, 1, CAST(N'2026-07-13T15:59:08.947' AS DateTime), 0, N'/media/properties/property_0988883322_639195551489435105.jpg')
INSERT [dbo].[properties] ([id], [landlord_id], [title], [description], [address], [latitude], [longitude], [is_verified_tick], [created_at], [view_count], [image_url]) VALUES (11, 10021, N'Nhà trọ BBB', N'nhà trọ uy tín', N'số 30 , , Thanh Xuân, Hà Nội', NULL, NULL, 1, CAST(N'2026-07-13T16:05:23.450' AS DateTime), 1, NULL)
GO
SET IDENTITY_INSERT [dbo].[properties] OFF
GO

SET IDENTITY_INSERT [dbo].[reports] ON 
GO
INSERT [dbo].[reports] ([id], [tenant_id], [title], [content], [status], [created_at], [contract_id], [rating], [landlord_reply], [replied_at]) VALUES (1, 5, N'Đánh giá trải nghiệm thuê trọ', N'good', N'Replied', CAST(N'2026-07-04T06:30:19.080' AS DateTime), 10007, 4, N'cảm ơn', CAST(N'2026-07-04T16:28:28.7875753' AS DateTime2))
INSERT [dbo].[reports] ([id], [tenant_id], [title], [content], [status], [created_at], [contract_id], [rating], [landlord_reply], [replied_at]) VALUES (2, 5, N'Đánh giá trải nghiệm thuê trọ', N'aaa', N'Pending', CAST(N'2026-07-04T06:35:47.617' AS DateTime), 10007, 1, NULL, NULL)
INSERT [dbo].[reports] ([id], [tenant_id], [title], [content], [status], [created_at], [contract_id], [rating], [landlord_reply], [replied_at]) VALUES (3, 5, N'Đánh giá trải nghiệm thuê trọ', N'aa', N'Pending', CAST(N'2026-07-04T15:43:00.857' AS DateTime), 10007, 3, NULL, NULL)
INSERT [dbo].[reports] ([id], [tenant_id], [title], [content], [status], [created_at], [contract_id], [rating], [landlord_reply], [replied_at]) VALUES (4, 5, N'Đánh giá trải nghiệm thuê trọ', N'4', N'Pending', CAST(N'2026-07-04T15:44:28.087' AS DateTime), 10007, 1, NULL, NULL)
INSERT [dbo].[reports] ([id], [tenant_id], [title], [content], [status], [created_at], [contract_id], [rating], [landlord_reply], [replied_at]) VALUES (5, 5, N'Đánh giá trải nghiệm thuê trọ', N'good', N'Pending', CAST(N'2026-07-05T14:56:08.533' AS DateTime), 10008, 5, NULL, NULL)
INSERT [dbo].[reports] ([id], [tenant_id], [title], [content], [status], [created_at], [contract_id], [rating], [landlord_reply], [replied_at]) VALUES (6, 5, N'Đánh giá trải nghiệm thuê trọ', N'dịch vụ hơi đắt', N'Replied', CAST(N'2026-07-05T14:57:05.960' AS DateTime), 10008, 4, N'ok', CAST(N'2026-07-05T15:40:40.1299757' AS DateTime2))
INSERT [dbo].[reports] ([id], [tenant_id], [title], [content], [status], [created_at], [contract_id], [rating], [landlord_reply], [replied_at]) VALUES (7, 5, N'Đánh giá trải nghiệm thuê trọ', N'dịch vụ hơi đắt', N'Replied', CAST(N'2026-07-05T14:57:07.620' AS DateTime), 10008, 4, N'ok', CAST(N'2026-07-05T15:40:37.0025489' AS DateTime2))
INSERT [dbo].[reports] ([id], [tenant_id], [title], [content], [status], [created_at], [contract_id], [rating], [landlord_reply], [replied_at]) VALUES (8, 5, N'Đánh giá trải nghiệm thuê trọ', N'dịch vụ hơi đắt', N'Replied', CAST(N'2026-07-05T14:57:08.477' AS DateTime), 10008, 4, N'Cháu có thể inbox cho tôi', CAST(N'2026-07-05T14:59:03.1458360' AS DateTime2))
INSERT [dbo].[reports] ([id], [tenant_id], [title], [content], [status], [created_at], [contract_id], [rating], [landlord_reply], [replied_at]) VALUES (9, 5, N'Wifi P1', N'Wifi P1 mất rồi ạ', N'Pending', CAST(N'2026-07-06T11:29:58.260' AS DateTime), NULL, NULL, NULL, NULL)
INSERT [dbo].[reports] ([id], [tenant_id], [title], [content], [status], [created_at], [contract_id], [rating], [landlord_reply], [replied_at]) VALUES (10, 10017, N'Wifi P1', N'hỏng', N'Pending', CAST(N'2026-07-08T08:12:33.130' AS DateTime), NULL, NULL, NULL, NULL)
INSERT [dbo].[reports] ([id], [tenant_id], [title], [content], [status], [created_at], [contract_id], [rating], [landlord_reply], [replied_at]) VALUES (11, 11, N'Đánh giá trải nghiệm thuê trọ', N'dịch vụ nhà trọ chưa tốt', N'Replied', CAST(N'2026-07-13T16:08:45.250' AS DateTime), 10020, 3, N'ok', CAST(N'2026-07-13T16:09:29.7008687' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[reports] OFF
GO

SET IDENTITY_INSERT [dbo].[roles] ON 
GO
INSERT [dbo].[roles] ([id], [role_name]) VALUES (1, N'Administrator')
INSERT [dbo].[roles] ([id], [role_name]) VALUES (2, N'Landlord')
INSERT [dbo].[roles] ([id], [role_name]) VALUES (3, N'Tenant')
GO
SET IDENTITY_INSERT [dbo].[roles] OFF
GO

INSERT [dbo].[room_amenities] ([room_id], [amenity_name]) VALUES (1, N'Điều hòa inverter')
INSERT [dbo].[room_amenities] ([room_id], [amenity_name]) VALUES (1, N'Phòng tắm khép kín')
INSERT [dbo].[room_amenities] ([room_id], [amenity_name]) VALUES (1, N'Wifi tốc độ cao')
INSERT [dbo].[room_amenities] ([room_id], [amenity_name]) VALUES (3, N'Điều hòa inverter')
INSERT [dbo].[room_amenities] ([room_id], [amenity_name]) VALUES (3, N'Thang máy')
INSERT [dbo].[room_amenities] ([room_id], [amenity_name]) VALUES (3, N'Tủ lạnh mini')
INSERT [dbo].[room_amenities] ([room_id], [amenity_name]) VALUES (3, N'Wifi tốc độ cao')
GO

SET IDENTITY_INSERT [dbo].[room_images] ON 
GO
INSERT [dbo].[room_images] ([id], [room_id], [media_url], [media_type]) VALUES (1, 1, N'/media/rooms/101_bed.png', N'Image')
INSERT [dbo].[room_images] ([id], [room_id], [media_url], [media_type]) VALUES (2, 1, N'/media/rooms/101_360view.vr', N'VR360')
INSERT [dbo].[room_images] ([id], [room_id], [media_url], [media_type]) VALUES (3, 3, N'/media/rooms/201_main.png', N'Image')
GO
SET IDENTITY_INSERT [dbo].[room_images] OFF
GO

SET IDENTITY_INSERT [dbo].[rooms] ON 
GO
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (1, 1, N'101', CAST(2500000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (2, 1, N'102', CAST(3000000.00 AS Decimal(12, 2)), CAST(25.00 AS Decimal(5, 2)), 3, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (3, 2, N'201', CAST(4000000.00 AS Decimal(12, 2)), CAST(30.00 AS Decimal(5, 2)), 3, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (4, 2, N'999', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (5, 3, N'999', CAST(101000000.00 AS Decimal(12, 2)), CAST(100.00 AS Decimal(5, 2)), 10, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (6, 2, N'202', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Available')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (7, 4, N'101', CAST(10000000.00 AS Decimal(12, 2)), CAST(100.00 AS Decimal(5, 2)), 5, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (8, 4, N'102', CAST(10000000.00 AS Decimal(12, 2)), CAST(100.00 AS Decimal(5, 2)), 5, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (9, 4, N'103', CAST(10000000.00 AS Decimal(12, 2)), CAST(100.00 AS Decimal(5, 2)), 5, N'Available')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (10, 5, N'A1', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Available')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (11, 5, N'A2', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Available')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (12, 6, N'101', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (13, 6, N'102', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Available')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (14, 6, N'103', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Available')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (15, 7, N'1', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (16, 7, N'2', CAST(10000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (17, 7, N'3', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (18, 7, N'104', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (19, 8, N'1', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Available')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (20, 8, N'2', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Available')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (21, 8, N'3', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Available')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (22, 9, N'A1', CAST(5000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (23, 9, N'A2', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Available')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (24, 9, N'A3', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Available')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (25, 10, N'101', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Rented')
INSERT [dbo].[rooms] ([id], [property_id], [room_number], [price], [area], [max_occupants], [status]) VALUES (26, 11, N'101', CAST(2000000.00 AS Decimal(12, 2)), CAST(20.00 AS Decimal(5, 2)), 2, N'Rented')
GO
SET IDENTITY_INSERT [dbo].[rooms] OFF
GO

SET IDENTITY_INSERT [dbo].[service_orders] ON 
GO
INSERT [dbo].[service_orders] ([id], [provider_id], [user_id], [order_details], [total_price], [commission_amount], [status], [created_at]) VALUES (1, 2, 4, N'Đặt 5 bình nước Lavie 19L giao đến phòng 101 khu Hùng Phát', CAST(300000.00 AS Decimal(12, 2)), CAST(30000.00 AS Decimal(12, 2)), N'Completed', CAST(N'2026-06-20T10:31:40.727' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[service_orders] OFF
GO

SET IDENTITY_INSERT [dbo].[service_providers] ON 
GO
INSERT [dbo].[service_providers] ([id], [provider_name], [service_type], [phone], [rating], [is_active]) VALUES (1, N'Vận Tải Thành Hưng', N'Moving', N'0912222333', CAST(4.85 AS Decimal(3, 2)), 1)
INSERT [dbo].[service_providers] ([id], [provider_name], [service_type], [phone], [rating], [is_active]) VALUES (2, N'Đại Lý Nước Tinh Khiết Lavie Cầu Giấy', N'Water', N'0388889999', CAST(4.90 AS Decimal(3, 2)), 1)
INSERT [dbo].[service_providers] ([id], [provider_name], [service_type], [phone], [rating], [is_active]) VALUES (3, N'Sửa Chữa Điện Lạnh Bách Khoa 24h', N'Maintenance', N'0766667777', CAST(4.50 AS Decimal(3, 2)), 1)
GO
SET IDENTITY_INSERT [dbo].[service_providers] OFF
GO

SET IDENTITY_INSERT [dbo].[subscription_packages] ON 
GO
INSERT [dbo].[subscription_packages] ([id], [name], [price], [max_rooms], [description]) VALUES (1, N'Gói Miễn Phí', CAST(0.00 AS Decimal(12, 2)), 10, N'Dành cho chủ trọ nhỏ lẻ (tối đa 25 phòng)')
INSERT [dbo].[subscription_packages] ([id], [name], [price], [max_rooms], [description]) VALUES (2, N'Gói Cơ Bản', CAST(99000.00 AS Decimal(12, 2)), 50, N'Quản lý quy mô tới 50 phòng')
INSERT [dbo].[subscription_packages] ([id], [name], [price], [max_rooms], [description]) VALUES (3, N'Gói Nâng Cao', CAST(199000.00 AS Decimal(12, 2)), 150, N'Quản lý quy mô tới 150 phòng')
GO
SET IDENTITY_INSERT [dbo].[subscription_packages] OFF
GO

SET IDENTITY_INSERT [dbo].[users] ON 
GO
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (1, 1, N'0312345678', N'admin@zhome.vn', N'hash_admin_123', N'Z-Home Administrator', NULL, CAST(N'2026-06-20T10:31:40.660' AS DateTime), CAST(N'2026-06-20T10:31:40.660' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (2, 2, N'0912345678', N'hung.nguyen@gmail.com', N'hash_hung_123', N'Nguyễn Văn Hùng', NULL, CAST(N'2026-06-20T10:31:40.660' AS DateTime), CAST(N'2026-06-20T10:31:40.660' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (3, 2, N'0712345678', N'mai.tran@gmail.com', N'hash_mai_123', N'Trần Thị Mai', NULL, CAST(N'2026-06-20T10:31:40.660' AS DateTime), CAST(N'2026-06-20T10:31:40.660' AS DateTime), NULL, NULL, NULL, NULL, 2, CAST(N'2026-08-07T13:30:27.817' AS DateTime))
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (4, 3, N'0812345678', N'an.le@student.edu.vn', N'hash_an_123', N'Lê Văn An', NULL, CAST(N'2026-06-20T10:31:40.660' AS DateTime), CAST(N'2026-06-20T10:31:40.660' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (5, 3, N'0512345678', N'thu.pham@gmail.com', N'hash_thu_123', N'Phạm Minh Thư', N'/media/cards/avatar_0512345678_639187324646321387.jpg', CAST(N'2026-06-20T10:31:40.660' AS DateTime), CAST(N'2026-07-04T03:36:53.900' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (6, 3, N'0911222333', NULL, N'$2a$11$lCKSZWmlZegZEv0qZ8QIweCS1INJJB8eG4wshg3u7Sn3lhcJkcpSm', N'MMot', NULL, CAST(N'2026-06-20T03:36:33.383' AS DateTime), CAST(N'2026-06-20T03:36:33.383' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (7, 3, N'0998374823', NULL, N'$2a$11$GXXdqwNsV1KRGpGd7KU0RuF1CLGQCse21OXgQzeZVmL4auyXags2.', N'Một', NULL, CAST(N'2026-06-20T03:38:05.347' AS DateTime), CAST(N'2026-06-20T03:38:05.347' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (8, 3, N'0944555666', NULL, N'$2a$11$W0Ks7k7FSkY5z7L9CoP7EO5V6uGP7jQlFyk7FLUKDqCYQnyn.tU5G', N'Hai', NULL, CAST(N'2026-06-20T03:43:59.017' AS DateTime), CAST(N'2026-06-20T03:43:59.017' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (9, 3, N'0977888999', NULL, N'$2a$11$h.J1ioFqd7cc5SN5crSah.LbiSLHwt2A.IxRy5aX2CLqyevG1IItW', N'Ba', NULL, CAST(N'2026-06-20T03:44:39.903' AS DateTime), CAST(N'2026-06-20T03:44:39.903' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10, 3, N'0872323323', NULL, N'$2a$11$D7MW47UmIgQwp2Kx5G50COPX1JYFTQKYftHY.i1Eoj3mg/jZJQlV.', N'Người thuê 2', NULL, CAST(N'2026-06-20T03:54:10.963' AS DateTime), CAST(N'2026-06-20T03:54:10.963' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (11, 3, N'0934543345', NULL, N'$2a$11$/o.RdtN/09i2qEY8juOdWuWDNFDNRcI.Gr2hLIUjzRqXztmvdDgmC', N'BA', NULL, CAST(N'2026-06-20T04:48:38.730' AS DateTime), CAST(N'2026-06-20T04:48:38.730' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10006, 3, N'0964339980', NULL, N'$2a$11$dlmpfz.6IBeeNe12q.FLme.e1YaFtDRHzAaCWSLfWG6DnWdunVB4C', N'Sơn ', NULL, CAST(N'2026-06-20T05:06:31.557' AS DateTime), CAST(N'2026-06-20T05:06:31.557' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10007, 3, N'0938475624', NULL, N'$2a$11$WjsiKPQtTNxbtJzYw.aXoO3adbu8o70k43Kq/c726YxeEiOLflLKi', N'Giàu', NULL, CAST(N'2026-06-20T05:12:01.217' AS DateTime), CAST(N'2026-06-20T05:12:01.217' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10008, 3, N'0323453431', NULL, N'$2a$11$Rnf07JDcABLNjgwCGLsqRuIoD/xh7wDzLkxowtFsn7cbna6clTtsO', N'A', NULL, CAST(N'2026-06-20T06:59:44.170' AS DateTime), CAST(N'2026-06-20T06:59:44.170' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10009, 2, N'0776738224', N'123@gmail.com', N'$2a$11$GhuhpS8U2Qvty3PLV0NRRe7TFhsPldzIyP5.kmybkzjWBIg6BuKWy', N'Phương Anh', NULL, CAST(N'2026-06-23T01:33:03.967' AS DateTime), CAST(N'2026-06-23T01:33:03.967' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10010, 3, N'0928374658', NULL, N'$2a$11$pccDH0rJeVU3/nBe1SmyTupYo5cV1.y5nGKPXsA0QrlBg6spzP7V.', N'Người thuê 1', NULL, CAST(N'2026-06-23T01:35:20.753' AS DateTime), CAST(N'2026-06-23T01:35:20.753' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10011, 2, N'0928374659', N'danghoangson2752k4@gmail.com', N'$2a$11$5f8oKCjJzz.G7L4AXb8iL.bM1/iMp9HJe/OXaOT1fwutrDvpiRksC', N'Đặng Hoàng Sơn ', N'/media/cards/avatar_0928374659_639187364646981862.jpg', CAST(N'2026-06-29T01:03:18.610' AS DateTime), CAST(N'2026-07-04T04:34:24.697' AS DateTime), N'019283746598', N'/media/cards/cccd_front_0928374659_639182917983524619.jpg', N'/media/cards/cccd_back_0928374659_639182917983539750.jpg', N'Approved', 3, CAST(N'2026-09-06T14:55:11.237' AS DateTime))
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10012, 2, N'0987898789', N'2@gmail.com', N'123456', N'aaa', NULL, CAST(N'2026-06-29T01:11:01.957' AS DateTime), CAST(N'2026-06-29T01:12:01.867' AS DateTime), N'009090909090', N'/media/cards/cccd_front_0987898789_639182922616966804.jpg', N'/media/cards/cccd_back_0987898789_639182922617037310.jpg', N'Approved', NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10013, 2, N'0394857384', N'a@gmail.com', N'$2a$11$g6krSxCQH7oJzGbQb38o7.wyrgWcthW365RDRixSReyAPL5rreP62', N'Nguyễn Văn ANh', NULL, CAST(N'2026-07-03T03:49:33.387' AS DateTime), CAST(N'2026-07-03T04:08:15.813' AS DateTime), N'002938475485', N'/media/cards/cccd_front_0394857384_639186473731259201.jpg', N'/media/cards/cccd_back_0394857384_639186473731276180.jpg', N'Approved', NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10014, 3, N'0983746574', N'dhthao01052006@gmail.com', N'$2a$11$8ZJld.QVcNIGM6p48j2qcuyvMY5MUD15g.9CXi.wULY17a6nYLE2G', N'Thảo', N'/media/cards/avatar_0983746574_639188627564359584.jpg', CAST(N'2026-07-05T15:38:51.570' AS DateTime), CAST(N'2026-07-05T15:39:16.433' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10015, 2, N'0993874659', NULL, N'$2a$11$NT9magN3KkvMU7YOzy27DuK00/QBADce4Ni8ElQudD67scPyfuVuW', N'grdsvav ', NULL, CAST(N'2026-07-08T07:39:51.377' AS DateTime), CAST(N'2026-07-08T07:39:51.377' AS DateTime), N'093847583723', N'/media/cards/cccd_front_0993874659_639190931910495612.jpg', N'/media/cards/cccd_back_0993874659_639190931910529415.jpg', N'Pending', 3, CAST(N'2026-08-08T07:46:24.467' AS DateTime))
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10016, 3, N'0983746577', N'tungvthe181549@gmail.com', N'$2a$11$EAnDalMJIZNC4l71dEAxYehrVbRmm/mcgFAoWEWR3TTN22ih7Ot6e', N'tùng', NULL, CAST(N'2026-07-08T08:05:34.433' AS DateTime), CAST(N'2026-07-08T08:05:34.433' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10017, 3, N'0748573643', N'tungvu182004@gmail.com', N'$2a$11$qiJ7liliWk2t7Q6ESKoDyeX7aEc/5AENyO6iZJdGZBRceGKmYfEZq', N'tùng', NULL, CAST(N'2026-07-08T08:06:56.570' AS DateTime), CAST(N'2026-07-08T08:06:56.570' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10018, 3, N'0999999999', N'a123@gmail.com', N'$2a$11$ta6MwG42JjKHAQOFEdTtcO3ilD5pnxXJAUhgoQd7XGqjsYnM3bFN6', N'Nguyễn Annn', NULL, CAST(N'2026-07-13T15:47:32.237' AS DateTime), CAST(N'2026-07-13T15:47:32.237' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10019, 2, N'0999999991', N'ltb@gmail.com', N'$2a$11$E0ON4SWqTygSPjsLKnsBF.v4s0cPh.QGTcyA2Bh3jsrfc5JNXCDAC', N'Lê Thị B', NULL, CAST(N'2026-07-13T15:51:52.197' AS DateTime), CAST(N'2026-07-13T15:52:21.580' AS DateTime), N'009298739845', N'/media/cards/cccd_front_0999999991_639195547120667061.jpg', N'/media/cards/cccd_back_0999999991_639195547120688816.jpg', N'Approved', NULL, NULL)
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10020, 2, N'0988883322', N'abc@gmail.com', N'$2a$11$6zL2xMqEQK.ECKlsn.PO7OfUECHewSSyGHSUvQYyWSJnDhxRRxoaS', N'Nguyễn N', NULL, CAST(N'2026-07-13T15:57:14.120' AS DateTime), CAST(N'2026-07-13T15:58:06.723' AS DateTime), N'009839849334', N'/media/cards/cccd_front_0988883322_639195550337871565.jpg', N'/media/cards/cccd_back_0988883322_639195550337885421.jpg', N'Approved', 2, CAST(N'2026-08-13T16:00:06.993' AS DateTime))
INSERT [dbo].[users] ([id], [role_id], [phone], [email], [password_hash], [full_name], [avatar_url], [created_at], [updated_at], [cccd_number], [cccd_front_url], [cccd_back_url], [verification_status], [subscription_id], [subscription_end_date]) VALUES (10021, 2, N'0987987678', N'abcd@gmail.com', N'$2a$11$fCl5KMMq.I8cCty6maPANuptXxJwKkidZWSZvzTUvH44MLPZ9GkgW', N'Nguyễn B', NULL, CAST(N'2026-07-13T16:03:58.340' AS DateTime), CAST(N'2026-07-13T16:04:19.277' AS DateTime), N'007485736454', N'/media/cards/cccd_front_0987987678_639195554381765352.jpg', N'/media/cards/cccd_back_0987987678_639195554381799430.jpg', N'Approved', 3, CAST(N'2026-08-13T16:06:28.003' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[users] OFF
GO

-- ==========================================
-- INDEXES, DEFAULT CONSTRAINTS, KHÓA NGOẠI
-- ==========================================
CREATE NONCLUSTERED INDEX [IX_bill_transactions_monthly_bill_id] ON [dbo].[bill_transactions] ([monthly_bill_id] ASC)
CREATE NONCLUSTERED INDEX [IX_bill_transactions_tenant_id] ON [dbo].[bill_transactions] ([tenant_id] ASC)
GO
CREATE NONCLUSTERED INDEX [idx_contracts_active] ON [dbo].[contracts] ([status] ASC, [end_date] ASC)
CREATE NONCLUSTERED INDEX [idx_contracts_room] ON [dbo].[contracts] ([room_id] ASC)
CREATE NONCLUSTERED INDEX [idx_contracts_tenant] ON [dbo].[contracts] ([tenant_id] ASC)
GO
ALTER TABLE [dbo].[landlord_verifications] ADD UNIQUE NONCLUSTERED ([user_id] ASC)
ALTER TABLE [dbo].[matching_profiles] ADD UNIQUE NONCLUSTERED ([student_id] ASC)
GO
CREATE NONCLUSTERED INDEX [idx_monthly_bills_contract] ON [dbo].[monthly_bills] ([room_id] ASC)
CREATE NONCLUSTERED INDEX [idx_monthly_bills_period] ON [dbo].[monthly_bills] ([billing_year] ASC, [billing_month] ASC)
GO
CREATE NONCLUSTERED INDEX [idx_properties_coords] ON [dbo].[properties] ([latitude] ASC, [longitude] ASC)
CREATE NONCLUSTERED INDEX [idx_properties_landlord] ON [dbo].[properties] ([landlord_id] ASC)
GO
ALTER TABLE [dbo].[roles] ADD UNIQUE NONCLUSTERED ([role_name] ASC)
GO
ALTER TABLE [dbo].[rooms] ADD CONSTRAINT [UQ_Rooms_Property_RoomNumber] UNIQUE NONCLUSTERED ([property_id] ASC, [room_number] ASC)
CREATE NONCLUSTERED INDEX [idx_rooms_price] ON [dbo].[rooms] ([price] ASC)
CREATE NONCLUSTERED INDEX [idx_rooms_property] ON [dbo].[rooms] ([property_id] ASC)
CREATE NONCLUSTERED INDEX [idx_rooms_status] ON [dbo].[rooms] ([status] ASC)
GO
CREATE NONCLUSTERED INDEX [idx_service_orders_provider] ON [dbo].[service_orders] ([provider_id] ASC)
CREATE NONCLUSTERED INDEX [idx_service_orders_user] ON [dbo].[service_orders] ([user_id] ASC)
GO
ALTER TABLE [dbo].[users] ADD UNIQUE NONCLUSTERED ([phone] ASC)
CREATE NONCLUSTERED INDEX [idx_users_role] ON [dbo].[users] ([role_id] ASC)
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Users_Email] ON [dbo].[users] ([email] ASC) WHERE ([email] IS NOT NULL)
GO

-- DEFAULT VALUES
ALTER TABLE [dbo].[contracts] ADD DEFAULT ('Active') FOR [status]
ALTER TABLE [dbo].[contracts] ADD DEFAULT (getdate()) FOR [created_at]
ALTER TABLE [dbo].[favorites] ADD DEFAULT (getutcdate()) FOR [created_at]
ALTER TABLE [dbo].[landlord_verifications] ADD DEFAULT ('Pending') FOR [status]
ALTER TABLE [dbo].[landlord_verifications] ADD DEFAULT (NULL) FOR [verified_at]
ALTER TABLE [dbo].[matching_profiles] ADD DEFAULT ((0)) FOR [budget_min]
ALTER TABLE [dbo].[matching_profiles] ADD DEFAULT ((0)) FOR [smoke]
ALTER TABLE [dbo].[matching_profiles] ADD DEFAULT ((0)) FOR [sleep_late]
ALTER TABLE [dbo].[matching_profiles] ADD DEFAULT ((0)) FOR [has_pet]
ALTER TABLE [dbo].[matching_profiles] ADD DEFAULT ('Any') FOR [roommate_gender_preference]
ALTER TABLE [dbo].[matching_profiles] ADD DEFAULT ((1)) FOR [is_active]
ALTER TABLE [dbo].[matching_profiles] ADD DEFAULT (getdate()) FOR [created_at]
ALTER TABLE [dbo].[monthly_bills] ADD DEFAULT ((0)) FOR [electricity_old_reading]
ALTER TABLE [dbo].[monthly_bills] ADD DEFAULT ((0)) FOR [electricity_new_reading]
ALTER TABLE [dbo].[monthly_bills] ADD DEFAULT ((0)) FOR [electricity_fee]
ALTER TABLE [dbo].[monthly_bills] ADD DEFAULT ((0)) FOR [water_old_reading]
ALTER TABLE [dbo].[monthly_bills] ADD DEFAULT ((0)) FOR [water_new_reading]
ALTER TABLE [dbo].[monthly_bills] ADD DEFAULT ((0)) FOR [water_fee]
ALTER TABLE [dbo].[monthly_bills] ADD DEFAULT ((0)) FOR [service_fee]
ALTER TABLE [dbo].[monthly_bills] ADD DEFAULT ((0)) FOR [repair_deduction]
ALTER TABLE [dbo].[monthly_bills] ADD DEFAULT ('Unpaid') FOR [status]
ALTER TABLE [dbo].[monthly_bills] ADD DEFAULT (NULL) FOR [paid_at]
ALTER TABLE [dbo].[monthly_bills] ADD DEFAULT ((0.0)) FOR [paid_amount]
ALTER TABLE [dbo].[properties] ADD DEFAULT ((0)) FOR [is_verified_tick]
ALTER TABLE [dbo].[properties] ADD DEFAULT (getdate()) FOR [created_at]
ALTER TABLE [dbo].[properties] ADD DEFAULT ((0)) FOR [view_count]
ALTER TABLE [dbo].[reports] ADD DEFAULT ('Pending') FOR [status]
ALTER TABLE [dbo].[reports] ADD DEFAULT (getutcdate()) FOR [created_at]
ALTER TABLE [dbo].[room_images] ADD DEFAULT ('Image') FOR [media_type]
ALTER TABLE [dbo].[rooms] ADD DEFAULT ((1)) FOR [max_occupants]
ALTER TABLE [dbo].[rooms] ADD DEFAULT ('Available') FOR [status]
ALTER TABLE [dbo].[service_orders] ADD DEFAULT ('Pending') FOR [status]
ALTER TABLE [dbo].[service_orders] ADD DEFAULT (getdate()) FOR [created_at]
ALTER TABLE [dbo].[service_providers] ADD DEFAULT ((5.0)) FOR [rating]
ALTER TABLE [dbo].[service_providers] ADD DEFAULT ((1)) FOR [is_active]
ALTER TABLE [dbo].[users] ADD DEFAULT (NULL) FOR [email]
ALTER TABLE [dbo].[users] ADD DEFAULT (NULL) FOR [avatar_url]
ALTER TABLE [dbo].[users] ADD DEFAULT (getdate()) FOR [created_at]
ALTER TABLE [dbo].[users] ADD DEFAULT (getdate()) FOR [updated_at]
ALTER TABLE [dbo].[users] ADD CONSTRAINT [DF_Users_VerificationStatus] DEFAULT (NULL) FOR [verification_status]
GO

-- FOREIGN KEYS
ALTER TABLE [dbo].[bill_transactions] WITH NOCHECK ADD CONSTRAINT [FK_bill_transactions_monthly_bills_monthly_bill_id] FOREIGN KEY([monthly_bill_id]) REFERENCES [dbo].[monthly_bills] ([id]) ON DELETE CASCADE
ALTER TABLE [dbo].[bill_transactions] CHECK CONSTRAINT [FK_bill_transactions_monthly_bills_monthly_bill_id]
ALTER TABLE [dbo].[bill_transactions] WITH NOCHECK ADD CONSTRAINT [FK_bill_transactions_users_tenant_id] FOREIGN KEY([tenant_id]) REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE
ALTER TABLE [dbo].[bill_transactions] CHECK CONSTRAINT [FK_bill_transactions_users_tenant_id]
GO
ALTER TABLE [dbo].[contracts] WITH NOCHECK ADD CONSTRAINT [FK_Contracts_Rooms] FOREIGN KEY([room_id]) REFERENCES [dbo].[rooms] ([id])
ALTER TABLE [dbo].[contracts] CHECK CONSTRAINT [FK_Contracts_Rooms]
ALTER TABLE [dbo].[contracts] WITH NOCHECK ADD CONSTRAINT [FK_Contracts_Users] FOREIGN KEY([tenant_id]) REFERENCES [dbo].[users] ([id])
ALTER TABLE [dbo].[contracts] CHECK CONSTRAINT [FK_Contracts_Users]
GO
ALTER TABLE [dbo].[favorites] WITH NOCHECK ADD CONSTRAINT [FK_favorites_rooms] FOREIGN KEY([room_id]) REFERENCES [dbo].[rooms] ([id])
ALTER TABLE [dbo].[favorites] CHECK CONSTRAINT [FK_favorites_rooms]
ALTER TABLE [dbo].[favorites] WITH NOCHECK ADD CONSTRAINT [FK_favorites_users] FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([id])
ALTER TABLE [dbo].[favorites] CHECK CONSTRAINT [FK_favorites_users]
GO
ALTER TABLE [dbo].[landlord_verifications] WITH NOCHECK ADD CONSTRAINT [FK_Verifications_Users] FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE
ALTER TABLE [dbo].[landlord_verifications] CHECK CONSTRAINT [FK_Verifications_Users]
GO
ALTER TABLE [dbo].[matching_profiles] WITH NOCHECK ADD CONSTRAINT [FK_Profiles_Users] FOREIGN KEY([student_id]) REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE
ALTER TABLE [dbo].[matching_profiles] CHECK CONSTRAINT [FK_Profiles_Users]
GO
ALTER TABLE [dbo].[monthly_bills] WITH NOCHECK ADD CONSTRAINT [FK_monthly_bills_rooms_room_id] FOREIGN KEY([room_id]) REFERENCES [dbo].[rooms] ([id])
ALTER TABLE [dbo].[monthly_bills] CHECK CONSTRAINT [FK_monthly_bills_rooms_room_id]
GO
ALTER TABLE [dbo].[properties] WITH NOCHECK ADD CONSTRAINT [FK_Properties_Users] FOREIGN KEY([landlord_id]) REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE
ALTER TABLE [dbo].[properties] CHECK CONSTRAINT [FK_Properties_Users]
GO
ALTER TABLE [dbo].[reports] WITH NOCHECK ADD CONSTRAINT [FK_Reports_Users] FOREIGN KEY([tenant_id]) REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE
ALTER TABLE [dbo].[reports] CHECK CONSTRAINT [FK_Reports_Users]
GO
ALTER TABLE [dbo].[room_amenities] WITH NOCHECK ADD CONSTRAINT [FK_Amenities_Rooms] FOREIGN KEY([room_id]) REFERENCES [dbo].[rooms] ([id]) ON DELETE CASCADE
ALTER TABLE [dbo].[room_amenities] CHECK CONSTRAINT [FK_Amenities_Rooms]
GO
ALTER TABLE [dbo].[room_images] WITH NOCHECK ADD CONSTRAINT [FK_Images_Rooms] FOREIGN KEY([room_id]) REFERENCES [dbo].[rooms] ([id]) ON DELETE CASCADE
ALTER TABLE [dbo].[room_images] CHECK CONSTRAINT [FK_Images_Rooms]
GO
ALTER TABLE [dbo].[rooms] WITH NOCHECK ADD CONSTRAINT [FK_Rooms_Properties] FOREIGN KEY([property_id]) REFERENCES [dbo].[properties] ([id]) ON DELETE CASCADE
ALTER TABLE [dbo].[rooms] CHECK CONSTRAINT [FK_Rooms_Properties]
GO
ALTER TABLE [dbo].[service_orders] WITH NOCHECK ADD CONSTRAINT [FK_Orders_Providers] FOREIGN KEY([provider_id]) REFERENCES [dbo].[service_providers] ([id])
ALTER TABLE [dbo].[service_orders] CHECK CONSTRAINT [FK_Orders_Providers]
ALTER TABLE [dbo].[service_orders] WITH NOCHECK ADD CONSTRAINT [FK_Orders_Users] FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([id])
ALTER TABLE [dbo].[service_orders] CHECK CONSTRAINT [FK_Orders_Users]
GO
ALTER TABLE [dbo].[users] WITH NOCHECK ADD CONSTRAINT [FK_Users_Roles] FOREIGN KEY([role_id]) REFERENCES [dbo].[roles] ([id])
ALTER TABLE [dbo].[users] CHECK CONSTRAINT [FK_Users_Roles]
ALTER TABLE [dbo].[users] WITH NOCHECK ADD CONSTRAINT [FK_Users_Subscriptions] FOREIGN KEY([subscription_id]) REFERENCES [dbo].[subscription_packages] ([id])
ALTER TABLE [dbo].[users] CHECK CONSTRAINT [FK_Users_Subscriptions]
GO

-- THIẾT LẬP RECURSIVE FK CHO BẢNG LOCATIONS
ALTER TABLE [dbo].[locations] WITH NOCHECK ADD CONSTRAINT [FK_locations_parent] FOREIGN KEY ([parent_id]) REFERENCES [dbo].[locations] ([id])
GO

-- CHECK CONSTRAINTS KHÁC
ALTER TABLE [dbo].[contracts] WITH NOCHECK ADD CONSTRAINT [chk_contract_dates] CHECK (([end_date]>[start_date]))
ALTER TABLE [dbo].[contracts] CHECK CONSTRAINT [chk_contract_dates]
ALTER TABLE [dbo].[contracts] WITH NOCHECK ADD CONSTRAINT [chk_contract_price] CHECK (([room_price]>=(0)))
ALTER TABLE [dbo].[contracts] CHECK CONSTRAINT [chk_contract_price]
ALTER TABLE [dbo].[contracts] WITH NOCHECK ADD CONSTRAINT [chk_contract_status] CHECK (([status]='Terminated' OR [status]='Expired' OR [status]='Active'))
ALTER TABLE [dbo].[contracts] CHECK CONSTRAINT [chk_contract_status]
GO
ALTER TABLE [dbo].[landlord_verifications] WITH NOCHECK ADD CONSTRAINT [chk_id_card_number] CHECK (((len([id_card_number])=(12) OR len([id_card_number])=(9)) AND NOT [id_card_number] like '%[^0-9]%'))
ALTER TABLE [dbo].[landlord_verifications] CHECK CONSTRAINT [chk_id_card_number]
ALTER TABLE [dbo].[landlord_verifications] WITH NOCHECK ADD CONSTRAINT [chk_verification_status] CHECK (([status]='Rejected' OR [status]='Approved' OR [status]='Pending'))
ALTER TABLE [dbo].[landlord_verifications] CHECK CONSTRAINT [chk_verification_status]
GO
ALTER TABLE [dbo].[matching_profiles] WITH NOCHECK ADD CONSTRAINT [chk_budget_min] CHECK (([budget_min]>=(0)))
ALTER TABLE [dbo].[matching_profiles] CHECK CONSTRAINT [chk_budget_min]
ALTER TABLE [dbo].[matching_profiles] WITH NOCHECK ADD CONSTRAINT [chk_budget_range] CHECK (([budget_max]>=[budget_min]))
ALTER TABLE [dbo].[matching_profiles] CHECK CONSTRAINT [chk_budget_range]
ALTER TABLE [dbo].[matching_profiles] WITH NOCHECK ADD CONSTRAINT [chk_profile_gender] CHECK (([gender]='Other' OR [gender]='Female' OR [gender]='Male'))
ALTER TABLE [dbo].[matching_profiles] CHECK CONSTRAINT [chk_profile_gender]
ALTER TABLE [dbo].[matching_profiles] WITH NOCHECK ADD CONSTRAINT [chk_profile_roommate_pref] CHECK (([roommate_gender_preference]='Any' OR [roommate_gender_preference]='Other' OR [roommate_gender_preference]='Female' OR [roommate_gender_preference]='Male'))
ALTER TABLE [dbo].[matching_profiles] CHECK CONSTRAINT [chk_profile_roommate_pref]
GO
ALTER TABLE [dbo].[monthly_bills] WITH NOCHECK ADD CONSTRAINT [chk_bill_status] CHECK (([status]='Paid' OR [status]='Unpaid'))
ALTER TABLE [dbo].[monthly_bills] CHECK CONSTRAINT [chk_bill_status]
ALTER TABLE [dbo].[monthly_bills] WITH NOCHECK ADD CONSTRAINT [chk_billing_month] CHECK (([billing_month]>=(1) AND [billing_month]<=(12)))
ALTER TABLE [dbo].[monthly_bills] CHECK CONSTRAINT [chk_billing_month]
ALTER TABLE [dbo].[monthly_bills] WITH NOCHECK ADD CONSTRAINT [chk_billing_year] CHECK (([billing_year]>=(2020)))
ALTER TABLE [dbo].[monthly_bills] CHECK CONSTRAINT [chk_billing_year]
ALTER TABLE [dbo].[monthly_bills] WITH NOCHECK ADD CONSTRAINT [chk_electricity_fee] CHECK (([electricity_fee]>=(0)))
ALTER TABLE [dbo].[monthly_bills] CHECK CONSTRAINT [chk_electricity_fee]
ALTER TABLE [dbo].[monthly_bills] WITH NOCHECK ADD CONSTRAINT [chk_electricity_readings] CHECK (([electricity_new_reading]>=[electricity_old_reading]))
ALTER TABLE [dbo].[monthly_bills] CHECK CONSTRAINT [chk_electricity_readings]
ALTER TABLE [dbo].[monthly_bills] WITH NOCHECK ADD CONSTRAINT [chk_repair_deduction] CHECK (([repair_deduction]>=(0)))
ALTER TABLE [dbo].[monthly_bills] CHECK CONSTRAINT [chk_repair_deduction]
ALTER TABLE [dbo].[monthly_bills] WITH NOCHECK ADD CONSTRAINT [chk_room_fee] CHECK (([room_fee]>=(0)))
ALTER TABLE [dbo].[monthly_bills] CHECK CONSTRAINT [chk_room_fee]
ALTER TABLE [dbo].[monthly_bills] WITH NOCHECK ADD CONSTRAINT [chk_service_fee] CHECK (([service_fee]>=(0)))
ALTER TABLE [dbo].[monthly_bills] CHECK CONSTRAINT [chk_service_fee]
ALTER TABLE [dbo].[monthly_bills] WITH NOCHECK ADD CONSTRAINT [chk_total_amount] CHECK (([total_amount]>=(0)))
ALTER TABLE [dbo].[monthly_bills] CHECK CONSTRAINT [chk_total_amount]
ALTER TABLE [dbo].[monthly_bills] WITH NOCHECK ADD CONSTRAINT [chk_water_fee] CHECK (([water_fee]>=(0)))
ALTER TABLE [dbo].[monthly_bills] CHECK CONSTRAINT [chk_water_fee]
ALTER TABLE [dbo].[monthly_bills] WITH NOCHECK ADD CONSTRAINT [chk_water_readings] CHECK (([water_new_reading]>=[water_old_reading]))
ALTER TABLE [dbo].[monthly_bills] CHECK CONSTRAINT [chk_water_readings]
GO
ALTER TABLE [dbo].[properties] WITH NOCHECK ADD CONSTRAINT [chk_property_latitude] CHECK (([latitude]>=(-90.00000000) AND [latitude]<=(90.00000000)))
ALTER TABLE [dbo].[properties] CHECK CONSTRAINT [chk_property_latitude]
ALTER TABLE [dbo].[properties] WITH NOCHECK ADD CONSTRAINT [chk_property_longitude] CHECK (([longitude]>=(-180.00000000) AND [longitude]<=(180.00000000)))
ALTER TABLE [dbo].[properties] CHECK CONSTRAINT [chk_property_longitude]
GO
ALTER TABLE [dbo].[room_images] WITH NOCHECK ADD CONSTRAINT [chk_media_type] CHECK (([media_type]='VR360' OR [media_type]='Video' OR [media_type]='Image'))
ALTER TABLE [dbo].[room_images] CHECK CONSTRAINT [chk_media_type]
GO
ALTER TABLE [dbo].[rooms] WITH NOCHECK ADD CONSTRAINT [chk_max_occupants] CHECK (([max_occupants]>=(1)))
ALTER TABLE [dbo].[rooms] CHECK CONSTRAINT [chk_max_occupants]
ALTER TABLE [dbo].[rooms] WITH NOCHECK ADD CONSTRAINT [chk_room_area] CHECK (([area]>(0)))
ALTER TABLE [dbo].[rooms] CHECK CONSTRAINT [chk_room_area]
ALTER TABLE [dbo].[rooms] WITH NOCHECK ADD CONSTRAINT [chk_room_price] CHECK (([price]>=(0)))
ALTER TABLE [dbo].[rooms] CHECK CONSTRAINT [chk_room_price]
ALTER TABLE [dbo].[rooms] WITH NOCHECK ADD CONSTRAINT [chk_room_status] CHECK (([status]='Maintenance' OR [status]='Rented' OR [status]='Available'))
ALTER TABLE [dbo].[rooms] CHECK CONSTRAINT [chk_room_status]
GO
ALTER TABLE [dbo].[service_orders] WITH NOCHECK ADD CONSTRAINT [chk_commission_logic] CHECK (([total_price]>=[commission_amount]))
ALTER TABLE [dbo].[service_orders] CHECK CONSTRAINT [chk_commission_logic]
ALTER TABLE [dbo].[service_orders] WITH NOCHECK ADD CONSTRAINT [chk_order_commission] CHECK (([commission_amount]>=(0)))
ALTER TABLE [dbo].[service_orders] CHECK CONSTRAINT [chk_order_commission]
ALTER TABLE [dbo].[service_orders] WITH NOCHECK ADD CONSTRAINT [chk_order_price] CHECK (([total_price]>=(0)))
ALTER TABLE [dbo].[service_orders] CHECK CONSTRAINT [chk_order_price]
ALTER TABLE [dbo].[service_orders] WITH NOCHECK ADD CONSTRAINT [chk_order_status] CHECK (([status]='Cancelled' OR [status]='Completed' OR [status]='Accepted' OR [status]='Pending'))
ALTER TABLE [dbo].[service_orders] CHECK CONSTRAINT [chk_order_status]
GO
ALTER TABLE [dbo].[service_providers] WITH NOCHECK ADD CONSTRAINT [chk_provider_phone] CHECK (([phone] like '0[35789][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'))
ALTER TABLE [dbo].[service_providers] CHECK CONSTRAINT [chk_provider_phone]
ALTER TABLE [dbo].[service_providers] WITH NOCHECK ADD CONSTRAINT [chk_provider_rating] CHECK (([rating]>=(0.00) AND [rating]<=(5.00)))
ALTER TABLE [dbo].[service_providers] CHECK CONSTRAINT [chk_provider_rating]
ALTER TABLE [dbo].[service_providers] WITH NOCHECK ADD CONSTRAINT [chk_provider_service_type] CHECK (([service_type]='Maintenance' OR [service_type]='Water' OR [service_type]='Moving'))
ALTER TABLE [dbo].[service_providers] CHECK CONSTRAINT [chk_provider_service_type]
GO
ALTER TABLE [dbo].[tax_configs] WITH NOCHECK ADD CONSTRAINT [chk_pit_rate] CHECK (([pit_rate]>=(0.0000) AND [pit_rate]<=(1.0000)))
ALTER TABLE [dbo].[tax_configs] CHECK CONSTRAINT [chk_pit_rate]
ALTER TABLE [dbo].[tax_configs] WITH NOCHECK ADD CONSTRAINT [chk_revenue_threshold] CHECK (([revenue_threshold]>=(0)))
ALTER TABLE [dbo].[tax_configs] CHECK CONSTRAINT [chk_revenue_threshold]
ALTER TABLE [dbo].[tax_configs] WITH NOCHECK ADD CONSTRAINT [chk_vat_rate] CHECK (([vat_rate]>=(0.0000) AND [vat_rate]<=(1.0000)))
ALTER TABLE [dbo].[tax_configs] CHECK CONSTRAINT [chk_vat_rate]
GO
ALTER TABLE [dbo].[users] WITH NOCHECK ADD CONSTRAINT [chk_user_phone] CHECK (([phone] like '0[35789][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'))
ALTER TABLE [dbo].[users] CHECK CONSTRAINT [chk_user_phone]
GO

ALTER TABLE [dbo].[locations] ADD [level] INT NOT NULL DEFAULT 1;