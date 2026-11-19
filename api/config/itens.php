<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $stmt = $pdo->query("
        SELECT
            p.id,
            p.pn,
            p.nome,
            p.tipo,
            COALESCE(e.quantidade, 0) AS quantidade,
            e.nf,
            e.data,
            e.uf,
            e.vlr_unit,
            e.vlr_total,
            e.prat,
            e.max,
            e.min,
            e.base_id,
            b.nome AS base
        FROM produtos p
        LEFT JOIN estoque e
            ON e.produto_id = p.id
        LEFT JOIN bases b
            ON b.id = e.base_id
        ORDER BY
            p.nome ASC,
            b.nome ASC
    ");

    $dados = $stmt->fetchAll();

    echo json_encode([
        'sucesso' => true,
        'dados' => $dados
    ]);
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao carregar os itens.'
    ]);
}