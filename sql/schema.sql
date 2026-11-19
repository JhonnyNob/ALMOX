CREATE TABLE pastas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE bases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pn VARCHAR(60) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NULL,
    custo DECIMAL(12,2) NOT NULL DEFAULT 0,
    pasta_id INT NULL,
    FOREIGN KEY (pasta_id) REFERENCES pastas(id)
);

CREATE TABLE estoque (
    produto_id INT NOT NULL,
    base_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 0,
    PRIMARY KEY (produto_id, base_id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (base_id) REFERENCES bases(id)
);

CREATE TABLE movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    base_id INT NOT NULL,
    tipo ENUM('entrada','saida','ajuste') NOT NULL,
    quantidade INT NOT NULL,
    custo DECIMAL(12,2) NULL,
    nf VARCHAR(60) NULL,
    centro_consumo VARCHAR(150) NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (base_id) REFERENCES bases(id)
);

INSERT INTO bases (
    id,
    nome
) VALUES
(
    1,
    'Baia de Guanabara'
),
(
    2,
    'Baia de Sepetiba e Angra'
),
(
    3,
    'Porto do Forno'
),
(
    4,
    'Porto do Açu'
);