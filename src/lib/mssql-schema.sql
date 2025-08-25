-- 사양정보 테이블 생성
CREATE TABLE SpecInfo (
    id INT IDENTITY(1,1) PRIMARY KEY,
    carType NVARCHAR(10) NOT NULL,
    lineId NVARCHAR(10) NOT NULL,
    alcCode NVARCHAR(10) NOT NULL,
    type NVARCHAR(20) NOT NULL,
    itemCd NVARCHAR(20) NOT NULL,
    bodyType NVARCHAR(10) NOT NULL,
    etcText01 NVARCHAR(200) NULL,
    etcText02 NVARCHAR(200) NULL,
    etcText03 NVARCHAR(200) NULL,
    etcText04 NVARCHAR(200) NULL,
    etcText05 NVARCHAR(200) NULL,
    etcText06 NVARCHAR(200) NULL,
    etcText07 NVARCHAR(200) NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL
);

-- 인덱스 생성
CREATE INDEX IX_SpecInfo_carType ON SpecInfo(carType);
CREATE INDEX IX_SpecInfo_lineId ON SpecInfo(lineId);
CREATE INDEX IX_SpecInfo_type ON SpecInfo(type);
CREATE INDEX IX_SpecInfo_alcCode ON SpecInfo(alcCode);
CREATE INDEX IX_SpecInfo_itemCd ON SpecInfo(itemCd);

-- 샘플 데이터 삽입
INSERT INTO SpecInfo (
    carType, 
    lineId, 
    alcCode, 
    type, 
    itemCd, 
    bodyType, 
    etcText01, 
    etcText02, 
    etcText03, 
    etcText04, 
    etcText05, 
    etcText06, 
    etcText07, 
    createdAt, 
    updatedAt
) VALUES 
('JA', 'FR01', 'CB', 'JAPE2STD', '86500G6CB0', 'G6', '', '', '부식', '부식 AEB', 'X', '', '', GETDATE(), GETDATE()),
('JA', 'RR01', 'CA', 'JAPE2STD', '86600G6CA0', 'G6', '', '부식', 'O', '백업분리', '6070', '내수', '', GETDATE(), GETDATE()),
('KA', 'FR01', 'CD', 'KAPE1STD', '86500G6CD0', 'G6', '부식', '', 'X', '유광 AEB', 'O', '유럽', '', GETDATE(), GETDATE()),
('KA', 'RR01', 'CE', 'KAPE1STD', '86600G6CE0', 'G6', '유광', '부식', 'O', 'L.H분리', '6050', '', '', GETDATE(), GETDATE()),
('LA', 'FR01', 'CF', 'JAPE2GT', '86500G6CF0', 'G6', '', '유광', '부식', '유광', 'X', '내수', '', GETDATE(), GETDATE()),
('LA', 'RR01', 'CG', 'JAPE2GT', '86600G6CG0', 'G6', '부식', '', 'O', '부식 AEB', '6070', '유럽', '', GETDATE(), GETDATE()); 