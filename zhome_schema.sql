-- =========================================================================
-- HỆ THỐNG Z-HOME: QUẢN LÝ PHÒNG TRỌ & TÌM Ở GHÉP CHO SINH VIÊN
-- FILE SQL KHỞI TẠO VÀ CẤU TRÚC CƠ SỞ DỮ LIỆU CHUẨN T-SQL (MS SQL SERVER)
-- =========================================================================

-- 1. Kiểm tra và Tạo Cơ sở dữ liệu
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ZHome')
BEGIN
    CREATE DATABASE ZHome;
END;
GO

USE ZHome;
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 2. Dọn dẹp bảng cũ nếu tồn tại (theo thứ tự ngược lại của ràng buộc khóa ngoại)
IF OBJECT_ID('dbo.service_orders', 'U') IS NOT NULL DROP TABLE dbo.service_orders;
IF OBJECT_ID('dbo.service_providers', 'U') IS NOT NULL DROP TABLE dbo.service_providers;
IF OBJECT_ID('dbo.tax_configs', 'U') IS NOT NULL DROP TABLE dbo.tax_configs;
IF OBJECT_ID('dbo.monthly_bills', 'U') IS NOT NULL DROP TABLE dbo.monthly_bills;
IF OBJECT_ID('dbo.contracts', 'U') IS NOT NULL DROP TABLE dbo.contracts;
IF OBJECT_ID('dbo.matching_profiles', 'U') IS NOT NULL DROP TABLE dbo.matching_profiles;
IF OBJECT_ID('dbo.room_images', 'U') IS NOT NULL DROP TABLE dbo.room_images;
IF OBJECT_ID('dbo.room_amenities', 'U') IS NOT NULL DROP TABLE dbo.room_amenities;
IF OBJECT_ID('dbo.rooms', 'U') IS NOT NULL DROP TABLE dbo.rooms;
IF OBJECT_ID('dbo.properties', 'U') IS NOT NULL DROP TABLE dbo.properties;
IF OBJECT_ID('dbo.landlord_verifications', 'U') IS NOT NULL DROP TABLE dbo.landlord_verifications;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
IF OBJECT_ID('dbo.roles', 'U') IS NOT NULL DROP TABLE dbo.roles;
IF OBJECT_ID('dbo.v_landlord_annual_revenue_and_tax', 'V') IS NOT NULL DROP VIEW dbo.v_landlord_annual_revenue_and_tax;
IF OBJECT_ID('dbo.sp_GetLandlordRevenueAndTaxReport', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetLandlordRevenueAndTaxReport;
GO

-- =========================================================================
-- PHÂN HỆ 1: NGƯỜI DÙNG & PHÂN QUYỀN (USERS & AUTHENTICATION)
-- =========================================================================

-- Bảng Gói cước (Subscription Packages)
CREATE TABLE subscription_packages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    max_rooms INT NOT NULL,
    description NVARCHAR(MAX)
);

-- Bảng Vai trò (Roles)
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- Bảng Người dùng (Users)
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    role_id INT NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255) DEFAULT NULL,
    cccd_number VARCHAR(20) DEFAULT NULL,
    cccd_front_url VARCHAR(255) DEFAULT NULL,
    cccd_back_url VARCHAR(255) DEFAULT NULL,
    verification_status VARCHAR(20) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    subscription_id INT NULL,
    subscription_end_date DATETIME NULL,
    
    CONSTRAINT FK_Users_Roles FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT FK_Users_Subscriptions FOREIGN KEY (subscription_id) REFERENCES subscription_packages(id),
    -- Ràng buộc kiểm tra định dạng số điện thoại Việt Nam (10 chữ số bắt đầu bằng 03, 05, 07, 08, 09)
    CONSTRAINT chk_user_phone CHECK (phone LIKE '0[35789][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')
);

-- Bảng Xác thực Chủ trọ (Landlord Verifications)
CREATE TABLE landlord_verifications (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    id_card_number VARCHAR(20) NOT NULL,
    id_card_front_url VARCHAR(255) NOT NULL,
    id_card_back_url VARCHAR(255) NOT NULL,
    ownership_document_url VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    verified_at DATETIME NULL DEFAULT NULL,
    notes NVARCHAR(MAX),
    
    CONSTRAINT FK_Verifications_Users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_verification_status CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    -- CCCD Việt Nam gồm 12 số (hoặc CMND cũ gồm 9 số), không chứa chữ
    CONSTRAINT chk_id_card_number CHECK (
        (LEN(id_card_number) = 12 OR LEN(id_card_number) = 9) AND 
        id_card_number NOT LIKE '%[^0-9]%'
    )
);

-- =========================================================================
-- PHÂN HỆ 2: QUẢN LÝ PHÒNG TRỌ & Ở GHÉP (PROPERTIES, ROOMS & MATCHING)
-- =========================================================================

-- Bảng Khu trọ / Tòa nhà trọ (Properties)
CREATE TABLE properties (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    landlord_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    address NVARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    is_verified_tick BIT DEFAULT 0, -- Tích xanh xác minh khu trọ chính chủ
    view_count INT NOT NULL DEFAULT 0, -- Số lượt xem
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT FK_Properties_Users FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_property_latitude CHECK (latitude BETWEEN -90.00000000 AND 90.00000000),
    CONSTRAINT chk_property_longitude CHECK (longitude BETWEEN -180.00000000 AND 180.00000000)
);

-- Bảng Chi tiết phòng trọ (Rooms)
CREATE TABLE rooms (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    property_id BIGINT NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    area DECIMAL(5, 2) NOT NULL,
    max_occupants INT NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'Available',
    
    CONSTRAINT FK_Rooms_Properties FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    -- Tránh trùng lặp số phòng trong cùng một khu trọ
    CONSTRAINT UQ_Rooms_Property_RoomNumber UNIQUE (property_id, room_number),
    CONSTRAINT chk_room_status CHECK (status IN ('Available', 'Rented', 'Maintenance')),
    CONSTRAINT chk_room_price CHECK (price >= 0),
    CONSTRAINT chk_room_area CHECK (area > 0),
    CONSTRAINT chk_max_occupants CHECK (max_occupants >= 1)
);

-- Bảng Tiện ích phòng trọ (Room Amenities)
CREATE TABLE room_amenities (
    room_id BIGINT NOT NULL,
    amenity_name NVARCHAR(100) NOT NULL,
    
    PRIMARY KEY (room_id, amenity_name),
    CONSTRAINT FK_Amenities_Rooms FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Bảng Hình ảnh/Video phòng trọ (Room Images & Media)
CREATE TABLE room_images (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    room_id BIGINT NOT NULL,
    media_url VARCHAR(255) NOT NULL,
    media_type VARCHAR(20) DEFAULT 'Image',
    
    CONSTRAINT FK_Images_Rooms FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    CONSTRAINT chk_media_type CHECK (media_type IN ('Image', 'Video', 'VR360'))
);

-- Bảng Hồ sơ tìm ở ghép của Sinh viên (Matching Profiles)
CREATE TABLE matching_profiles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    student_id BIGINT NOT NULL UNIQUE,
    gender VARCHAR(10) NOT NULL,
    budget_min DECIMAL(12, 2) NOT NULL DEFAULT 0,
    budget_max DECIMAL(12, 2) NOT NULL,
    smoke BIT DEFAULT 0,
    sleep_late BIT DEFAULT 0,
    has_pet BIT DEFAULT 0,
    hometown NVARCHAR(100),
    description NVARCHAR(MAX),
    roommate_gender_preference VARCHAR(10) DEFAULT 'Any', -- Ưu tiên giới tính bạn ở ghép
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT FK_Profiles_Users FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_profile_gender CHECK (gender IN ('Male', 'Female', 'Other')),
    CONSTRAINT chk_profile_roommate_pref CHECK (roommate_gender_preference IN ('Male', 'Female', 'Other', 'Any')),
    CONSTRAINT chk_budget_range CHECK (budget_max >= budget_min),
    CONSTRAINT chk_budget_min CHECK (budget_min >= 0)
);

-- =========================================================================
-- PHÂN HỆ 3: HỢP ĐỒNG, HÓA ĐƠN & THUẾ (FINANCE, BILLING & TAX)
-- =========================================================================

-- Bảng Hợp đồng thuê phòng (Contracts)
CREATE TABLE contracts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    room_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    room_price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT FK_Contracts_Rooms FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT FK_Contracts_Users FOREIGN KEY (tenant_id) REFERENCES users(id),
    CONSTRAINT chk_contract_status CHECK (status IN ('Active', 'Expired', 'Terminated')),
    CONSTRAINT chk_contract_dates CHECK (end_date > start_date),
    CONSTRAINT chk_contract_price CHECK (room_price >= 0)
);

-- Bảng Hóa đơn hàng tháng (Monthly Bills)
CREATE TABLE monthly_bills (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id BIGINT NOT NULL,
    billing_month INT NOT NULL,
    billing_year INT NOT NULL,
    room_fee DECIMAL(12, 2) NOT NULL,
    
    -- Số liệu điện thực tế
    electricity_old_reading DECIMAL(10, 2) DEFAULT 0,
    electricity_new_reading DECIMAL(10, 2) DEFAULT 0,
    electricity_fee DECIMAL(12, 2) DEFAULT 0,
    
    -- Số liệu nước thực tế
    water_old_reading DECIMAL(10, 2) DEFAULT 0,
    water_new_reading DECIMAL(10, 2) DEFAULT 0,
    water_fee DECIMAL(12, 2) DEFAULT 0,
    
    service_fee DECIMAL(12, 2) DEFAULT 0,
    repair_deduction DECIMAL(12, 2) DEFAULT 0, -- Khoản trừ chi phí sửa chữa do chủ trọ chịu
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Unpaid',
    paid_at DATETIME NULL DEFAULT NULL,
    
    CONSTRAINT FK_Bills_Contracts FOREIGN KEY (contract_id) REFERENCES contracts(id),
    CONSTRAINT chk_bill_status CHECK (status IN ('Unpaid', 'Paid')),
    CONSTRAINT chk_billing_month CHECK (billing_month BETWEEN 1 AND 12),
    CONSTRAINT chk_billing_year CHECK (billing_year >= 2020),
    CONSTRAINT chk_room_fee CHECK (room_fee >= 0),
    CONSTRAINT chk_electricity_readings CHECK (electricity_new_reading >= electricity_old_reading),
    CONSTRAINT chk_electricity_fee CHECK (electricity_fee >= 0),
    CONSTRAINT chk_water_readings CHECK (water_new_reading >= water_old_reading),
    CONSTRAINT chk_water_fee CHECK (water_fee >= 0),
    CONSTRAINT chk_service_fee CHECK (service_fee >= 0),
    CONSTRAINT chk_repair_deduction CHECK (repair_deduction >= 0),
    CONSTRAINT chk_total_amount CHECK (total_amount >= 0)
);

-- Bảng Cấu hình chính sách thuế nhà nước (Tax Configs)
CREATE TABLE tax_configs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    effective_date DATE NOT NULL,
    revenue_threshold DECIMAL(12, 2) NOT NULL, -- Ngưỡng doanh thu tính thuế trong năm dương lịch
    vat_rate DECIMAL(5, 4) NOT NULL, -- Tỷ lệ Thuế Giá trị gia tăng (GTGT)
    pit_rate DECIMAL(5, 4) NOT NULL, -- Tỷ lệ Thuế Thu nhập cá nhân (TNCN)
    description NVARCHAR(255),
    
    CONSTRAINT chk_vat_rate CHECK (vat_rate BETWEEN 0.0000 AND 1.0000),
    CONSTRAINT chk_pit_rate CHECK (pit_rate BETWEEN 0.0000 AND 1.0000),
    CONSTRAINT chk_revenue_threshold CHECK (revenue_threshold >= 0)
);

-- =========================================================================
-- PHÂN HỆ 4: ĐỐI TÁC & DỊCH VỤ NGOÀI LỀ (ADD-ON SERVICES)
-- =========================================================================

-- Bảng Đơn vị cung cấp dịch vụ (Service Providers)
CREATE TABLE service_providers (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    provider_name NVARCHAR(150) NOT NULL,
    service_type VARCHAR(20) NOT NULL, -- 'Moving' (Chuyển nhà), 'Water' (Cung cấp nước), 'Maintenance' (Sửa chữa)
    phone VARCHAR(15) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 5.0,
    is_active BIT DEFAULT 1,
    
    CONSTRAINT chk_provider_service_type CHECK (service_type IN ('Moving', 'Water', 'Maintenance')),
    CONSTRAINT chk_provider_phone CHECK (phone LIKE '0[35789][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
    CONSTRAINT chk_provider_rating CHECK (rating BETWEEN 0.00 AND 5.00)
);

-- Bảng Đơn đặt dịch vụ (Service Orders)
CREATE TABLE service_orders (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    provider_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    order_details NVARCHAR(MAX) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    commission_amount DECIMAL(12, 2) NOT NULL, -- Phí hoa hồng Z-Home thu từ đối tác
    status VARCHAR(20) DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT FK_Orders_Providers FOREIGN KEY (provider_id) REFERENCES service_providers(id),
    CONSTRAINT FK_Orders_Users FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_order_status CHECK (status IN ('Pending', 'Accepted', 'Completed', 'Cancelled')),
    CONSTRAINT chk_order_price CHECK (total_price >= 0),
    CONSTRAINT chk_order_commission CHECK (commission_amount >= 0),
    CONSTRAINT chk_commission_logic CHECK (total_price >= commission_amount)
);
GO

-- =========================================================================
-- TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN (INDEXES)
-- =========================================================================

-- Chỉ mục nguyên bản của người dùng
CREATE INDEX idx_users_role ON users(role_id);
CREATE UNIQUE NONCLUSTERED INDEX UX_Users_Email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_rooms_price ON rooms(price);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_properties_coords ON properties(latitude, longitude);
CREATE INDEX idx_monthly_bills_period ON monthly_bills(billing_year, billing_month);
CREATE INDEX idx_contracts_active ON contracts(status, end_date);

-- Chỉ mục bổ sung hỗ trợ tối ưu các phép liên kết khóa ngoại (Foreign Keys joins)
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_rooms_property ON rooms(property_id);
CREATE INDEX idx_contracts_room ON contracts(room_id);
CREATE INDEX idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX idx_monthly_bills_contract ON monthly_bills(contract_id);
CREATE INDEX idx_service_orders_provider ON service_orders(provider_id);
CREATE INDEX idx_service_orders_user ON service_orders(user_id);
GO

-- =========================================================================
-- CÁC ĐỐI TƯỢNG XỬ LÝ DOANH THU & THUẾ (VIEW & STORED PROCEDURE)
-- =========================================================================

-- View: Báo cáo Doanh thu & Thuế ước tính theo năm dương lịch của Chủ trọ
-- Chỉ tính trên các Hóa đơn đã thanh toán ('Paid')
CREATE VIEW v_landlord_annual_revenue_and_tax AS
WITH LandlordBills AS (
    SELECT 
        p.landlord_id,
        u.full_name AS landlord_name,
        b.billing_year,
        SUM(b.total_amount) AS total_annual_revenue
    FROM monthly_bills b
    INNER JOIN contracts c ON b.contract_id = c.id
    INNER JOIN rooms r ON c.room_id = r.id
    INNER JOIN properties p ON r.property_id = p.id
    INNER JOIN users u ON p.landlord_id = u.id
    WHERE b.status = 'Paid'
    GROUP BY p.landlord_id, u.full_name, b.billing_year
)
SELECT 
    lb.landlord_id,
    lb.landlord_name,
    lb.billing_year,
    lb.total_annual_revenue,
    tc.revenue_threshold,
    tc.vat_rate,
    tc.pit_rate,
    CASE 
        WHEN lb.total_annual_revenue > tc.revenue_threshold THEN 1 
        ELSE 0 
    END AS is_taxable,
    CASE 
        WHEN lb.total_annual_revenue > tc.revenue_threshold THEN CAST(lb.total_annual_revenue * tc.vat_rate AS DECIMAL(12, 2))
        ELSE 0.00 
    END AS estimated_vat,
    CASE 
        WHEN lb.total_annual_revenue > tc.revenue_threshold THEN CAST(lb.total_annual_revenue * tc.pit_rate AS DECIMAL(12, 2))
        ELSE 0.00 
    END AS estimated_pit,
    CASE 
        WHEN lb.total_annual_revenue > tc.revenue_threshold THEN CAST(lb.total_annual_revenue * (tc.vat_rate + tc.pit_rate) AS DECIMAL(12, 2))
        ELSE 0.00 
    END AS total_estimated_tax
FROM LandlordBills lb
OUTER APPLY (
    SELECT TOP 1 revenue_threshold, vat_rate, pit_rate
    FROM tax_configs
    WHERE effective_date <= DATEFROMPARTS(lb.billing_year, 12, 31)
    ORDER BY effective_date DESC
) tc;
GO

-- Stored Procedure: Xuất báo cáo Doanh thu & Chi tiết đề xuất thuế
-- Hỗ trợ xem cả năm hoặc xem cụ thể từng tháng để quản trị tài chính.
CREATE PROCEDURE sp_GetLandlordRevenueAndTaxReport
    @LandlordId BIGINT,
    @Year INT,
    @Month INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Lấy cấu hình thuế áp dụng cho năm báo cáo
    DECLARE @Threshold DECIMAL(12, 2);
    DECLARE @VatRate DECIMAL(5, 4);
    DECLARE @PitRate DECIMAL(5, 4);

    SELECT TOP 1 
        @Threshold = revenue_threshold, 
        @VatRate = vat_rate, 
        @PitRate = pit_rate
    FROM tax_configs
    WHERE effective_date <= DATEFROMPARTS(@Year, 12, 31)
    ORDER BY effective_date DESC;

    -- Sử dụng chính sách thuế mặc định của Việt Nam nếu không tìm thấy cấu hình phù hợp
    IF @Threshold IS NULL
    BEGIN
        SET @Threshold = 100000000.00; -- Ngưỡng 100 triệu VND/năm
        SET @VatRate = 0.0500;         -- 5% thuế GTGT
        SET @PitRate = 0.0500;         -- 5% thuế TNCN
    END

    -- 2. Tính tổng doanh thu tích lũy cả năm đã thanh toán thực tế (YTD Paid Revenue)
    DECLARE @TotalAnnualRevenue DECIMAL(12, 2);
    SELECT @TotalAnnualRevenue = ISNULL(SUM(b.total_amount), 0)
    FROM monthly_bills b
    INNER JOIN contracts c ON b.contract_id = c.id
    INNER JOIN rooms r ON c.room_id = r.id
    INNER JOIN properties p ON r.property_id = p.id
    WHERE p.landlord_id = @LandlordId 
      AND b.billing_year = @Year 
      AND b.status = 'Paid';

    -- 3. Xử lý xuất báo cáo theo yêu cầu
    IF @Month IS NULL
    BEGIN
        -- Báo cáo tổng quan cả năm
        SELECT 
            @LandlordId AS landlord_id,
            u.full_name AS landlord_name,
            @Year AS report_year,
            @TotalAnnualRevenue AS total_annual_revenue,
            @Threshold AS tax_threshold,
            CASE WHEN @TotalAnnualRevenue > @Threshold THEN 1 ELSE 0 END AS is_taxable,
            CASE WHEN @TotalAnnualRevenue > @Threshold THEN CAST(@TotalAnnualRevenue * @VatRate AS DECIMAL(12, 2)) ELSE 0.00 END AS annual_vat_due,
            CASE WHEN @TotalAnnualRevenue > @Threshold THEN CAST(@TotalAnnualRevenue * @PitRate AS DECIMAL(12, 2)) ELSE 0.00 END AS annual_pit_due,
            CASE WHEN @TotalAnnualRevenue > @Threshold THEN CAST(@TotalAnnualRevenue * (@VatRate + @PitRate) AS DECIMAL(12, 2)) ELSE 0.00 END AS total_annual_tax,
            N'Cách tính thuế: Theo Thông tư 40/2021/TT-BTC, nếu tổng doanh thu từ hoạt động cho thuê tài sản của cá nhân trong năm dương lịch vượt quá 100 triệu đồng, cá nhân đó sẽ phải chịu 5% Thuế Giá trị gia tăng (VAT) và 5% Thuế Thu nhập cá nhân (TNCN) trên doanh thu nhận được.' AS tax_note
        FROM users u
        WHERE u.id = @LandlordId;

        -- Chi tiết từng tháng trong năm đó
        SELECT 
            b.billing_month AS Month,
            COUNT(b.id) AS total_bills_generated,
            SUM(CASE WHEN b.status = 'Paid' THEN b.total_amount ELSE 0 END) AS paid_revenue,
            SUM(CASE WHEN b.status = 'Unpaid' THEN b.total_amount ELSE 0 END) AS unpaid_revenue,
            SUM(b.total_amount) AS total_billed_amount
        FROM monthly_bills b
        INNER JOIN contracts c ON b.contract_id = c.id
        INNER JOIN rooms r ON c.room_id = r.id
        INNER JOIN properties p ON r.property_id = p.id
        WHERE p.landlord_id = @LandlordId 
          AND b.billing_year = @Year
        GROUP BY b.billing_month
        ORDER BY b.billing_month;
    END
    ELSE
    BEGIN
        -- Báo cáo chi tiết cho một tháng cụ thể
        DECLARE @PaidMonthlyRevenue DECIMAL(12, 2);
        SELECT @PaidMonthlyRevenue = ISNULL(SUM(b.total_amount), 0)
        FROM monthly_bills b
        INNER JOIN contracts c ON b.contract_id = c.id
        INNER JOIN rooms r ON c.room_id = r.id
        INNER JOIN properties p ON r.property_id = p.id
        WHERE p.landlord_id = @LandlordId 
          AND b.billing_year = @Year 
          AND b.billing_month = @Month
          AND b.status = 'Paid';

        SELECT 
            @LandlordId AS landlord_id,
            @Year AS report_year,
            @Month AS report_month,
            @PaidMonthlyRevenue AS monthly_paid_revenue,
            @TotalAnnualRevenue AS ytd_paid_revenue,
            @Threshold AS tax_threshold,
            CASE WHEN @TotalAnnualRevenue > @Threshold THEN 1 ELSE 0 END AS currently_subject_to_tax,
            CASE WHEN @TotalAnnualRevenue > @Threshold THEN CAST(@PaidMonthlyRevenue * @VatRate AS DECIMAL(12, 2)) ELSE 0.00 END AS estimated_monthly_vat,
            CASE WHEN @TotalAnnualRevenue > @Threshold THEN CAST(@PaidMonthlyRevenue * @PitRate AS DECIMAL(12, 2)) ELSE 0.00 END AS estimated_monthly_pit,
            N'Lưu ý: Do nghĩa vụ thuế tính theo doanh thu nguyên năm dương lịch, nếu doanh thu tích lũy từ đầu năm (YTD) vượt 100 triệu VND, các hóa đơn phát sinh sau đó sẽ được tạm tính thuế VAT 5% và PIT 5%.' AS calculation_explanation;
    END
END;
GO


-- =========================================================================
-- KHỞI TẠO DỮ LIỆU MẪU (SEEDING DATA)
-- =========================================================================

-- 1. Khởi tạo phân quyền (Roles)
INSERT INTO roles (role_name) VALUES ('Administrator');
INSERT INTO roles (role_name) VALUES ('Landlord');
INSERT INTO roles (role_name) VALUES ('Tenant');
GO

-- 2. Khởi tạo Cấu hình thuế (Thông tư 40/2021/TT-BTC)
INSERT INTO tax_configs (effective_date, revenue_threshold, vat_rate, pit_rate, description)
VALUES ('2026-01-01', 100000000.00, 0.0500, 0.0500, N'Thuế kinh doanh phòng trọ - Thông tư 40/2021/TT-BTC');
GO

-- 3. Tạo tài khoản người dùng mẫu sử dụng biến nội bộ để liên kết tự động
DECLARE @AdminRole INT, @LandlordRole INT, @TenantRole INT;
SELECT @AdminRole = id FROM roles WHERE role_name = 'Administrator';
SELECT @LandlordRole = id FROM roles WHERE role_name = 'Landlord';
SELECT @TenantRole = id FROM roles WHERE role_name = 'Tenant';

-- Thêm quản trị viên
INSERT INTO users (role_id, phone, email, password_hash, full_name)
VALUES (@AdminRole, '0312345678', 'admin@zhome.vn', 'hash_admin_123', N'Z-Home Administrator');

-- Thêm chủ trọ 1 (Nguyễn Văn Hùng - Sẽ được duyệt tích xanh)
INSERT INTO users (role_id, phone, email, password_hash, full_name)
VALUES (@LandlordRole, '0912345678', 'hung.nguyen@gmail.com', 'hash_hung_123', N'Nguyễn Văn Hùng');

-- Thêm chủ trọ 2 (Trần Thị Mai - Chưa xác thực xong)
INSERT INTO users (role_id, phone, email, password_hash, full_name)
VALUES (@LandlordRole, '0712345678', 'mai.tran@gmail.com', 'hash_mai_123', N'Trần Thị Mai');

-- Thêm sinh viên thuê trọ 1
INSERT INTO users (role_id, phone, email, password_hash, full_name)
VALUES (@TenantRole, '0812345678', 'an.le@student.edu.vn', 'hash_an_123', N'Lê Văn An');

-- Thêm sinh viên thuê trọ 2
INSERT INTO users (role_id, phone, email, password_hash, full_name)
VALUES (@TenantRole, '0512345678', 'thu.pham@student.edu.vn', 'hash_thu_123', N'Phạm Minh Thư');
GO

-- 4. Khởi tạo xác thực thông tin chủ trọ
DECLARE @HungLandlordId BIGINT, @MaiLandlordId BIGINT;
SELECT @HungLandlordId = id FROM users WHERE phone = '0912345678';
SELECT @MaiLandlordId = id FROM users WHERE phone = '0712345678';

-- Chủ trọ Nguyễn Văn Hùng đã được Admin duyệt
INSERT INTO landlord_verifications (user_id, id_card_number, id_card_front_url, id_card_back_url, ownership_document_url, status, verified_at, notes)
VALUES (@HungLandlordId, '037096001234', '/media/cards/hung_front.png', '/media/cards/hung_back.png', '/media/docs/hung_redbook.pdf', 'Approved', CURRENT_TIMESTAMP, N'Giấy tờ pháp lý đầy đủ và hợp lệ');

-- Chủ trọ Trần Thị Mai đang chờ duyệt
INSERT INTO landlord_verifications (user_id, id_card_number, id_card_front_url, id_card_back_url, ownership_document_url, status, notes)
VALUES (@MaiLandlordId, '037096005678', '/media/cards/mai_front.png', '/media/cards/mai_back.png', '/media/docs/mai_redbook.pdf', 'Pending', N'Đang đối chiếu thông tin với cơ sở dữ liệu quốc gia');
GO

-- 5. Khởi tạo Khu trọ và Phòng trọ
DECLARE @HungLandlordId BIGINT, @MaiLandlordId BIGINT;
SELECT @HungLandlordId = id FROM users WHERE phone = '0912345678';
SELECT @MaiLandlordId = id FROM users WHERE phone = '0712345678';

-- Khu trọ của ông Hùng (Được xác minh)
INSERT INTO properties (landlord_id, title, description, address, latitude, longitude, is_verified_tick)
VALUES (@HungLandlordId, N'Khu Trọ Hùng Phát Cầu Giấy', N'Phòng trọ cao cấp, khép kín, an ninh tốt, gần Đại học Quốc Gia Hà Nội.', N'Số 12 Ngõ 102 Trần Thái Tông, Cầu Giấy, Hà Nội', 21.0278, 105.7882, 1);

-- Chung cư mini của bà Mai (Chưa được tích xanh)
INSERT INTO properties (landlord_id, title, description, address, latitude, longitude, is_verified_tick)
VALUES (@MaiLandlordId, N'Chung cư Mini Trần Mai', N'Đầy đủ đồ đạc, thang máy, chỗ để xe rộng rãi, tự do giờ giấc.', N'Số 8 Láng Hạ, Đống Đa, Hà Nội', 21.0189, 105.8173, 0);
GO

-- Tạo phòng
DECLARE @HungPropertyId BIGINT, @MaiPropertyId BIGINT;
SELECT @HungPropertyId = id FROM properties WHERE title LIKE N'%Hùng Phát%';
SELECT @MaiPropertyId = id FROM properties WHERE title LIKE N'%Trần Mai%';

-- Phòng trọ khu Hùng Phát
INSERT INTO rooms (property_id, room_number, price, area, max_occupants, status)
VALUES (@HungPropertyId, '101', 2500000.00, 20.00, 2, 'Rented'); -- Đang thuê

INSERT INTO rooms (property_id, room_number, price, area, max_occupants, status)
VALUES (@HungPropertyId, '102', 3000000.00, 25.00, 3, 'Available'); -- Trống

-- Phòng trọ khu Trần Mai
INSERT INTO rooms (property_id, room_number, price, area, max_occupants, status)
VALUES (@MaiPropertyId, '201', 4000000.00, 30.00, 3, 'Available');
GO

-- 6. Khởi tạo tiện ích và hình ảnh
DECLARE @Room101Id BIGINT, @Room201Id BIGINT;
SELECT @Room101Id = r.id FROM rooms r INNER JOIN properties p ON r.property_id = p.id WHERE p.title LIKE N'%Hùng Phát%' AND r.room_number = '101';
SELECT @Room201Id = r.id FROM rooms r INNER JOIN properties p ON r.property_id = p.id WHERE p.title LIKE N'%Trần Mai%' AND r.room_number = '201';

-- Tiện ích phòng 101
INSERT INTO room_amenities (room_id, amenity_name) VALUES (@Room101Id, N'Wifi tốc độ cao');
INSERT INTO room_amenities (room_id, amenity_name) VALUES (@Room101Id, N'Điều hòa inverter');
INSERT INTO room_amenities (room_id, amenity_name) VALUES (@Room101Id, N'Phòng tắm khép kín');

-- Tiện ích phòng 201
INSERT INTO room_amenities (room_id, amenity_name) VALUES (@Room201Id, N'Wifi tốc độ cao');
INSERT INTO room_amenities (room_id, amenity_name) VALUES (@Room201Id, N'Điều hòa inverter');
INSERT INTO room_amenities (room_id, amenity_name) VALUES (@Room201Id, N'Tủ lạnh mini');
INSERT INTO room_amenities (room_id, amenity_name) VALUES (@Room201Id, N'Thang máy');

-- Hình ảnh phòng
INSERT INTO room_images (room_id, media_url, media_type) VALUES (@Room101Id, '/media/rooms/101_bed.png', 'Image');
INSERT INTO room_images (room_id, media_url, media_type) VALUES (@Room101Id, '/media/rooms/101_360view.vr', 'VR360');
INSERT INTO room_images (room_id, media_url, media_type) VALUES (@Room201Id, '/media/rooms/201_main.png', 'Image');
GO

-- 7. Khởi tạo Hồ sơ ở ghép của Sinh viên
DECLARE @AnStudentId BIGINT, @ThuStudentId BIGINT;
SELECT @AnStudentId = id FROM users WHERE phone = '0812345678';
SELECT @ThuStudentId = id FROM users WHERE phone = '0512345678';

-- Hồ sơ bạn Lê Văn An
INSERT INTO matching_profiles (student_id, gender, budget_min, budget_max, smoke, sleep_late, has_pet, hometown, description, roommate_gender_preference)
VALUES (@AnStudentId, 'Male', 1500000.00, 2500000.00, 0, 0, 0, N'Thanh Hóa', N'Mình là sinh viên năm 2 Đại học Bách Khoa, tính cách hòa đồng, gọn gàng ngăn nắp, mong muốn tìm bạn cùng phòng không hút thuốc và giữ vệ sinh chung.', 'Male');

-- Hồ sơ bạn Phạm Minh Thư
INSERT INTO matching_profiles (student_id, gender, budget_min, budget_max, smoke, sleep_late, has_pet, hometown, description, roommate_gender_preference)
VALUES (@ThuStudentId, 'Female', 2000000.00, 3500000.00, 0, 1, 1, N'Đà Nẵng', N'Mình học RMIT, thích nuôi mèo, hay thức đêm làm đồ án thiết kế. Tìm bạn nữ thoải mái, tôn trọng không gian riêng tư.', 'Female');
GO

-- 8. Khởi tạo Hợp đồng thuê
DECLARE @Room101Id BIGINT, @AnStudentId BIGINT;
SELECT @Room101Id = r.id FROM rooms r INNER JOIN properties p ON r.property_id = p.id WHERE p.title LIKE N'%Hùng Phát%' AND r.room_number = '101';
SELECT @AnStudentId = id FROM users WHERE phone = '0812345678';

-- Hợp đồng Lê Văn An thuê phòng 101 trong 1 năm
INSERT INTO contracts (room_id, tenant_id, start_date, end_date, room_price, status)
VALUES (@Room101Id, @AnStudentId, '2026-01-01', '2026-12-31', 2500000.00, 'Active');
GO

-- 9. Khởi tạo các Hóa đơn hàng tháng của hợp đồng trên
DECLARE @ContractId BIGINT;
SELECT @ContractId = id FROM contracts WHERE status = 'Active';

-- Hóa đơn Tháng 1/2026 (Đã thanh toán)
-- Điện: 120 kWh x 3,000 VND = 360,000 VND
-- Nước: 8 m3 x 10,000 VND = 80,000 VND
-- Dịch vụ (Vệ sinh, rác): 50,000 VND
-- Khấu trừ sửa chữa vòi nước: 50,000 VND
-- Tổng: 2,500,000 + 360,000 + 80,000 + 50,000 - 50,000 = 2,940,000 VND
INSERT INTO monthly_bills (
    contract_id, billing_month, billing_year, room_fee, 
    electricity_old_reading, electricity_new_reading, electricity_fee, 
    water_old_reading, water_new_reading, water_fee, 
    service_fee, repair_deduction, total_amount, status, paid_at
)
VALUES (
    @ContractId, 1, 2026, 2500000.00,
    100.00, 220.00, 360000.00,
    50.00, 58.00, 80000.00,
    50000.00, 50000.00, 2940000.00, 'Paid', '2026-02-05 09:30:00'
);

-- Hóa đơn Tháng 2/2026 (Đã thanh toán)
-- Điện: 130 kWh x 3,000 VND = 390,000 VND
-- Nước: 7 m3 x 10,000 VND = 70,000 VND
-- Dịch vụ: 50,000 VND
-- Tổng: 2,500,000 + 390,000 + 70,000 + 50,000 = 3,010,000 VND
INSERT INTO monthly_bills (
    contract_id, billing_month, billing_year, room_fee, 
    electricity_old_reading, electricity_new_reading, electricity_fee, 
    water_old_reading, water_new_reading, water_fee, 
    service_fee, repair_deduction, total_amount, status, paid_at
)
VALUES (
    @ContractId, 2, 2026, 2500000.00,
    220.00, 350.00, 390000.00,
    58.00, 65.00, 70000.00,
    50000.00, 0.00, 3010000.00, 'Paid', '2026-03-05 10:15:00'
);

-- Hóa đơn Tháng 3/2026 (Chưa thanh toán)
-- Điện: 140 kWh x 3,000 VND = 420,000 VND
-- Nước: 8 m3 x 10,000 VND = 80,000 VND
-- Dịch vụ: 50,000 VND
-- Tổng: 2,500,000 + 420,000 + 80,000 + 50,000 = 3,050,000 VND
INSERT INTO monthly_bills (
    contract_id, billing_month, billing_year, room_fee, 
    electricity_old_reading, electricity_new_reading, electricity_fee, 
    water_old_reading, water_new_reading, water_fee, 
    service_fee, repair_deduction, total_amount, status
)
VALUES (
    @ContractId, 3, 2026, 2500000.00,
    350.00, 490.00, 420000.00,
    65.00, 73.00, 80000.00,
    50000.00, 0.00, 3050000.00, 'Unpaid'
);
GO

-- 10. Khởi tạo Đối tác dịch vụ ngoại lệ
INSERT INTO service_providers (provider_name, service_type, phone, rating, is_active)
VALUES (N'Vận Tải Thành Hưng', 'Moving', '0912222333', 4.85, 1);

INSERT INTO service_providers (provider_name, service_type, phone, rating, is_active)
VALUES (N'Đại Lý Nước Tinh Khiết Lavie Cầu Giấy', 'Water', '0388889999', 4.90, 1);

INSERT INTO service_providers (provider_name, service_type, phone, rating, is_active)
VALUES (N'Sửa Chữa Điện Lạnh Bách Khoa 24h', 'Maintenance', '0766667777', 4.50, 1);
GO

-- 11. Khởi tạo đơn đặt dịch vụ
DECLARE @ProviderId BIGINT, @UserId BIGINT;
SELECT @ProviderId = id FROM service_providers WHERE provider_name LIKE N'%Lavie%';
SELECT @UserId = id FROM users WHERE phone = '0812345678'; -- Sinh viên Lê Văn An

-- Lê Văn An đặt 5 bình nước Lavie 19L
-- Tổng giá trị: 300,000 VND
-- Hoa hồng Z-Home (10%): 30,000 VND
INSERT INTO service_orders (provider_id, user_id, order_details, total_price, commission_amount, status)
VALUES (@ProviderId, @UserId, N'Đặt 5 bình nước Lavie 19L giao đến phòng 101 khu Hùng Phát', 300000.00, 30000.00, 'Completed');
GO

-- Thêm các cột lưu thông tin CCCD vào bảng users
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'cccd_number')
BEGIN
    ALTER TABLE users ADD cccd_number VARCHAR(20) NULL;
END;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'cccd_front_url')
BEGIN
    ALTER TABLE users ADD cccd_front_url VARCHAR(255) NULL;
END;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'cccd_back_url')
BEGIN
    ALTER TABLE users ADD cccd_back_url VARCHAR(255) NULL;
END;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'verification_status')
BEGIN
    ALTER TABLE users ADD verification_status VARCHAR(20) NULL CONSTRAINT DF_Users_VerificationStatus DEFAULT NULL;
END;
GO

CREATE TABLE [favorites] (
  [id] bigint IDENTITY(1,1) PRIMARY KEY,
  [user_id] bigint NOT NULL,
  [room_id] bigint NOT NULL,
  [created_at] datetime2 NOT NULL DEFAULT GETUTCDATE(),
  CONSTRAINT [FK_favorites_users] FOREIGN KEY ([user_id]) REFERENCES [users]([id]),
  CONSTRAINT [FK_favorites_rooms] FOREIGN KEY ([room_id]) REFERENCES [rooms]([id])
);

IF OBJECT_ID('dbo.reports', 'U') IS NOT NULL DROP TABLE dbo.reports;
GO

CREATE TABLE reports (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Processing', 'Resolved'
    created_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Reports_Users FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- =========================================================================
-- HỆ THỐNG Z-HOME: QUẢN LÝ PHÒNG TRỌ & TÌM Ở GHÉP CHO SINH VIÊN
-- FILE SQL CẤU TRÚC VÀ DỮ LIỆU CÁC ĐƠN VỊ HÀNH CHÍNH HÀ NỘI (CẬP NHẬT MỚI NHẤT)
-- Tích hợp Nghị quyết số 1245/NQ-UBTVQH15 về việc sắp xếp đơn vị hành chính cấp xã của TP. Hà Nội
-- =========================================================================

USE ZHome;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Dọn dẹp bảng cũ nếu tồn tại
IF OBJECT_ID('dbo.wards', 'U') IS NOT NULL DROP TABLE dbo.wards;
IF OBJECT_ID('dbo.districts', 'U') IS NOT NULL DROP TABLE dbo.districts;
GO

-- 2. Tạo bảng Quận/Huyện (Districts)
CREATE TABLE districts (
    id INT PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    type NVARCHAR(50) NOT NULL -- N'Quận', N'Huyện', N'Thị xã'
);

-- 3. Tạo bảng Phường/Xã/Thị trấn (Wards)
CREATE TABLE wards (
    id INT PRIMARY KEY,
    district_id INT NOT NULL,
    name NVARCHAR(100) NOT NULL,
    type NVARCHAR(50) NOT NULL, -- N'Phường', N'Xã', N'Thị trấn'
    CONSTRAINT FK_Wards_Districts FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
);
GO

-- 4. Chèn dữ liệu Quận/Huyện của Hà Nội (30 đơn vị)
INSERT INTO districts (id, name, type) VALUES
(1, N'Ba Đình', N'Quận'),
(2, N'Hoàn Kiếm', N'Quận'),
(3, N'Tây Hồ', N'Quận'),
(4, N'Long Biên', N'Quận'),
(5, N'Cầu Giấy', N'Quận'),
(6, N'Đống Đa', N'Quận'),
(7, N'Hai Bà Trưng', N'Quận'),
(8, N'Thanh Xuân', N'Quận'),
(9, N'Hoàng Mai', N'Quận'),
(10, N'Nam Từ Liêm', N'Quận'),
(11, N'Bắc Từ Liêm', N'Quận'),
(12, N'Hà Đông', N'Quận'),
(13, N'Sơn Tây', N'Thị xã'),
(14, N'Ba Vì', N'Huyện'),
(15, N'Chương Mỹ', N'Huyện'),
(16, N'Đan Phượng', N'Huyện'),
(17, N'Đông Anh', N'Huyện'),
(18, N'Gia Lâm', N'Huyện'),
(19, N'Hoài Đức', N'Huyện'),
(20, N'Mê Linh', N'Huyện'),
(21, N'Mỹ Đức', N'Huyện'),
(22, N'Phú Xuyên', N'Huyện'),
(23, N'Phúc Thọ', N'Huyện'),
(24, N'Quốc Oai', N'Huyện'),
(25, N'Sóc Sơn', N'Huyện'),
(26, N'Thạch Thất', N'Huyện'),
(27, N'Thanh Oai', N'Huyện'),
(28, N'Thanh Trì', N'Huyện'),
(29, N'Thường Tín', N'Huyện'),
(30, N'Ứng Hòa', N'Huyện');
GO

-- 5. Chèn dữ liệu Phường/Xã của Hà Nội (Cập nhật sáp nhập đơn vị hành chính mới)
-- Quận Cầu Giấy (8 phường)
INSERT INTO wards (id, district_id, name, type) VALUES
(101, 5, N'Dịch Vọng', N'Phường'),
(102, 5, N'Dịch Vọng Hậu', N'Phường'),
(103, 5, N'Mai Dịch', N'Phường'),
(104, 5, N'Nghĩa Đô', N'Phường'),
(105, 5, N'Nghĩa Tân', N'Phường'),
(106, 5, N'Quan Hoa', N'Phường'),
(107, 5, N'Trung Hòa', N'Phường'),
(108, 5, N'Yên Hòa', N'Phường');

-- Quận Đống Đa (Sắp xếp mới còn 17 phường)
INSERT INTO wards (id, district_id, name, type) VALUES
(201, 6, N'Cát Linh', N'Phường'),
(202, 6, N'Hàng Bột', N'Phường'),
(203, 6, N'Khâm Thiên', N'Phường'), -- Sáp nhập Khâm Thiên & Trung Phụng
(204, 6, N'Khương Thượng', N'Phường'), -- Sáp nhập Ngã Tư Sở & Khương Thượng
(205, 6, N'Kim Liên', N'Phường'), -- Sáp nhập Phương Liên & Kim Liên
(206, 6, N'Láng Hạ', N'Phường'),
(207, 6, N'Láng Thượng', N'Phường'),
(208, 6, N'Nam Đồng', N'Phường'),
(209, 6, N'Ngã Tư Sở', N'Phường'),
(210, 6, N'Ô Chợ Dừa', N'Phường'),
(211, 6, N'Phương Mai', N'Phường'),
(212, 6, N'Quang Trung', N'Phường'),
(213, 6, N'Thịnh Quang', N'Phường'),
(214, 6, N'Thổ Quan', N'Phường'),
(215, 6, N'Trung Liệt', N'Phường'),
(216, 6, N'Trung Tự', N'Phường'),
(217, 6, N'Văn Miếu', N'Phường'); -- Sáp nhập Quốc Tử Giám & Văn Chương

-- Quận Thanh Xuân (Sắp xếp mới còn 10 phường)
INSERT INTO wards (id, district_id, name, type) VALUES
(301, 8, N'Hạ Đình', N'Phường'),
(302, 8, N'Khương Đình', N'Phường'),
(303, 8, N'Khương Mai', N'Phường'),
(304, 8, N'Khương Trung', N'Phường'),
(305, 8, N'Nhân Chính', N'Phường'),
(306, 8, N'Phương Liệt', N'Phường'),
(307, 8, N'Thanh Xuân Bắc', N'Phường'),
(308, 8, N'Thanh Xuân Nam', N'Phường'), -- Sáp nhập Thanh Xuân Trung & Thanh Xuân Nam
(309, 8, N'Thượng Đình', N'Phường'),
(310, 8, N'Kim Giang', N'Phường');

-- Quận Nam Từ Liêm (10 phường)
INSERT INTO wards (id, district_id, name, type) VALUES
(401, 10, N'Cầu Diễn', N'Phường'),
(402, 10, N'Đại Mỗ', N'Phường'),
(403, 10, N'Mễ Trì', N'Phường'),
(404, 10, N'Mỹ Đình 1', N'Phường'),
(405, 10, N'Mỹ Đình 2', N'Phường'),
(406, 10, N'Phú Đô', N'Phường'),
(407, 10, N'Phương Canh', N'Phường'),
(408, 10, N'Tây Mỗ', N'Phường'),
(409, 10, N'Trung Văn', N'Phường'),
(410, 10, N'Xuân Phương', N'Phường');

-- Quận Bắc Từ Liêm (13 phường)
INSERT INTO wards (id, district_id, name, type) VALUES
(501, 11, N'Cổ Nhuế 1', N'Phường'),
(502, 11, N'Cổ Nhuế 2', N'Phường'),
(503, 11, N'Đông Ngạc', N'Phường'),
(504, 11, N'Đức Thắng', N'Phường'),
(505, 11, N'Liên Mạc', N'Phường'),
(506, 11, N'Minh Khai', N'Phường'),
(507, 11, N'Phú Diễn', N'Phường'),
(508, 11, N'Phúc Diễn', N'Phường'),
(509, 11, N'Tây Tựu', N'Phường'),
(510, 11, N'Thượng Cát', N'Phường'),
(511, 11, N'Thụy Phương', N'Phường'),
(512, 11, N'Xuân Đỉnh', N'Phường'),
(513, 11, N'Xuân Tảo', N'Phường');

-- Quận Ba Đình (Sắp xếp mới còn 13 phường)
INSERT INTO wards (id, district_id, name, type) VALUES
(601, 1, N'Cống Vị', N'Phường'),
(602, 1, N'Điện Biên', N'Phường'),
(603, 1, N'Đội Cấn', N'Phường'),
(604, 1, N'Giảng Võ', N'Phường'),
(605, 1, N'Kim Mã', N'Phường'),
(606, 1, N'Liễu Giai', N'Phường'),
(607, 1, N'Ngọc Khánh', N'Phường'),
(608, 1, N'Ngọc Hà', N'Phường'),
(609, 1, N'Phúc Xá', N'Phường'),
(610, 1, N'Thành Công', N'Phường'),
(611, 1, N'Trúc Bạch', N'Phường'), -- Sáp nhập Nguyễn Trung Trực & Trúc Bạch
(612, 1, N'Vĩnh Phúc', N'Phường'),
(613, 1, N'Quán Thánh', N'Phường');

-- Quận Hoàn Kiếm (Sắp xếp mới còn 12 phường)
INSERT INTO wards (id, district_id, name, type) VALUES
(701, 2, N'Chương Dương', N'Phường'),
(702, 2, N'Cửa Đông', N'Phường'),
(703, 2, N'Cửa Nam', N'Phường'),
(704, 2, N'Đồng Xuân', N'Phường'),
(705, 2, N'Hàng Bạc', N'Phường'), -- Sáp nhập Hàng Đào & Hàng Bạc
(706, 2, N'Hàng Bài', N'Phường'),
(707, 2, N'Hàng Bông', N'Phường'),
(708, 2, N'Hàng Gai', N'Phường'), -- Sáp nhập Hàng Bồ & Hàng Gai
(709, 2, N'Hàng Mã', N'Phường'),
(710, 2, N'Lý Thái Tổ', N'Phường'),
(711, 2, N'Phan Chu Trinh', N'Phường'),
(712, 2, N'Tràng Tiền', N'Phường'); -- Sáp nhập Hàng Trống & Tràng Tiền

-- Quận Hai Bà Trưng (Sắp xếp mới còn 15 phường)
INSERT INTO wards (id, district_id, name, type) VALUES
(801, 7, N'Bạch Đằng', N'Phường'),
(802, 7, N'Bách Khoa', N'Phường'),
(803, 7, N'Bạch Mai', N'Phường'), -- Sáp nhập Quỳnh Lôi & Bạch Mai
(804, 7, N'Cầu Dền', N'Phường'),
(805, 7, N'Đồng Nhân', N'Phường'), -- Sáp nhập Đống Mác & Đồng Nhân
(806, 7, N'Đồng Tâm', N'Phường'),
(807, 7, N'Lê Đại Hành', N'Phường'),
(808, 7, N'Minh Khai', N'Phường'),
(809, 7, N'Nguyễn Du', N'Phường'),
(810, 7, N'Phạm Đình Hổ', N'Phường'),
(811, 7, N'Phố Huế', N'Phường'),
(812, 7, N'Quỳnh Mai', N'Phường'),
(813, 7, N'Thanh Lương', N'Phường'),
(814, 7, N'Thanh Nhàn', N'Phường'),
(815, 7, N'Trương Định', N'Phường'),
(816, 7, N'Vĩnh Tuy', N'Phường');

-- Quận Tây Hồ (8 phường)
INSERT INTO wards (id, district_id, name, type) VALUES
(901, 3, N'Bưởi', N'Phường'),
(902, 3, N'Quảng An', N'Phường'),
(903, 3, N'Thụy Khuê', N'Phường'),
(904, 3, N'Tứ Liên', N'Phường'),
(905, 3, N'Xuân La', N'Phường'),
(906, 3, N'Yên Phụ', N'Phường'),
(907, 3, N'Nhật Tân', N'Phường'),
(908, 3, N'Phú Thượng', N'Phường');

-- Quận Hà Đông (17 phường)
INSERT INTO wards (id, district_id, name, type) VALUES
(1001, 12, N'Biên Giang', N'Phường'),
(1002, 12, N'Đồng Mai', N'Phường'),
(1003, 12, N'Dương Nội', N'Phường'),
(1004, 12, N'Hà Cầu', N'Phường'),
(1005, 12, N'Kiến Hưng', N'Phường'),
(1006, 12, N'La Khê', N'Phường'),
(1007, 12, N'Mộ Lao', N'Phường'),
(1008, 12, N'Nguyễn Trãi', N'Phường'),
(1009, 12, N'Phú La', N'Phường'),
(1010, 12, N'Phú Lãm', N'Phường'),
(1011, 12, N'Phú Lương', N'Phường'),
(1012, 12, N'Phúc La', N'Phường'),
(1013, 12, N'Quang Trung', N'Phường'),
(1014, 12, N'Vạn Phúc', N'Phường'),
(1015, 12, N'Văn Quán', N'Phường'),
(1016, 12, N'Yên Nghĩa', N'Phường'),
(1017, 12, N'Yết Kiêu', N'Phường');

-- Huyện Gia Lâm (Sáp nhập & sắp xếp mới đơn vị hành chính xã)
INSERT INTO wards (id, district_id, name, type) VALUES
(1101, 18, N'Trâu Quỳ', N'Thị trấn'),
(1102, 18, N'Yên Viên', N'Thị trấn'), -- Sáp nhập xã Yên Viên & TT Yên Viên
(1103, 18, N'Phú Sơn', N'Xã'), -- Sáp nhập Kim Sơn & Phú Thị
(1104, 18, N'Bát Tràng', N'Xã'), -- Sáp nhập Bát Tràng & Đông Dư
(1105, 18, N'Thiên Đức', N'Xã'), -- Sáp nhập Đình Xuyên & Dương Hà
(1106, 18, N'Cổ Bi', N'Xã'),
(1107, 18, N'Đa Tốn', N'Xã'),
(1108, 18, N'Đặng Xá', N'Xã'),
(1109, 18, N'Dương Xá', N'Xã'),
(1110, 18, N'Kiêu Kỵ', N'Xã'),
(1111, 18, N'Lệ Chi', N'Xã'),
(1112, 18, N'Ninh Hiệp', N'Xã'),
(1113, 18, N'Phù Đổng', N'Xã'),
(1114, 18, N'Trung Mầu', N'Xã'),
(1115, 18, N'Dương Quang', N'Xã'),
(1116, 18, N'Kim Lan', N'Xã'),
(1117, 18, N'Văn Đức', N'Xã');

GO

UPDATE [subscription_packages] SET [name] = N'Gói Miễn Phí', [description] = N'Dành cho chủ trọ nhỏ lẻ (< 5 phòng)' WHERE [id] = 1;
UPDATE [subscription_packages] SET [name] = N'Gói Khởi Điểm', [description] = N'Dành cho quy mô từ 5 - 15 phòng' WHERE [id] = 2;
UPDATE [subscription_packages] SET [name] = N'Gói Nâng Cao', [description] = N'Dành cho chủ trọ chuyên nghiệp (15 - 50 phòng)' WHERE [id] = 3;
DELETE FROM [subscription_packages] WHERE [id] = 4;


UPDATE [subscription_packages] SET [name] = N'Gói Miễn Phí', [price] = 0, [description] = N'Dành cho chủ trọ nhỏ lẻ (tối đa 25 phòng)', [max_rooms] = 25 WHERE [id] = 1;
UPDATE [subscription_packages] SET [name] = N'Gói Cơ Bản', [price] = 99000, [description] = N'Quản lý quy mô tới 70 phòng', [max_rooms] = 70 WHERE [id] = 2;
UPDATE [subscription_packages] SET [name] = N'Gói Nâng Cao', [price] = 199000, [description] = N'Quản lý quy mô tới 150 phòng', [max_rooms] = 150 WHERE [id] = 3;

USE ZHome;
GO

-- Thêm các cột lưu thông tin CCCD vào bảng users
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'cccd_number')
BEGIN
    ALTER TABLE users ADD cccd_number VARCHAR(20) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'cccd_front_url')
BEGIN
    ALTER TABLE users ADD cccd_front_url VARCHAR(255) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'cccd_back_url')
BEGIN
    ALTER TABLE users ADD cccd_back_url VARCHAR(255) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'verification_status')
BEGIN
    ALTER TABLE users ADD verification_status VARCHAR(20) NULL;
END;
GO
