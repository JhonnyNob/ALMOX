USE almoxarifado;

ALTER TABLE produtos
    ADD COLUMN tipo VARCHAR(50) NULL AFTER nome;