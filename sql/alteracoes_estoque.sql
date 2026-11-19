USE almoxarifado;

ALTER TABLE estoque
    ADD COLUMN nf VARCHAR(60) NULL AFTER quantidade,
    ADD COLUMN data DATETIME NULL AFTER nf,
    ADD COLUMN uf ENUM('METRO', 'CONJUNTO', 'PACOTE', 'UNIDADE') NULL AFTER data,
    ADD COLUMN vlr_unit DECIMAL(14,4) NULL AFTER uf,
    ADD COLUMN vlr_total DECIMAL(14,4) AS (
        quantidade * COALESCE(vlr_unit, 0)
    ) STORED AFTER vlr_unit,
    ADD COLUMN prat VARCHAR(60) NULL AFTER vlr_total,
    ADD COLUMN max INT NULL AFTER prat,
    ADD COLUMN min INT NULL AFTER max;
