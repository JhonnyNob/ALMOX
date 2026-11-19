<?php

require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json; charset=utf-8');

$metodo = $_SERVER['REQUEST_METHOD'];

try {
    if ($metodo === 'GET') {
        $stmt = $pdo->query(
            'SELECT id, nome FROM pastas ORDER BY nome ASC'
        );

        echo json_encode([
            'sucesso' => true,
            'dados' => $stmt->fetchAll()
        ]);

        exit;
    }

    if ($metodo === 'POST') {
        $dados = json_decode(file_get_contents('php://input'), true);

        $nome = trim($dados['nome'] ?? '');

        if ($nome === '') {
            http_response_code(400);

            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'O nome da pasta é obrigatório.'
            ]);

            exit;
        }

        $stmt = $pdo->prepare(
            'SELECT id FROM pastas WHERE nome = ?'
        );

        $stmt->execute([$nome]);

        if ($stmt->fetch()) {
            http_response_code(409);

            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Essa pasta já está cadastrada.'
            ]);

            exit;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO pastas (nome) VALUES (?)'
        );

        $stmt->execute([$nome]);

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Pasta cadastrada com sucesso.',
            'id' => $pdo->lastInsertId()
        ]);

        exit;
    }

    if ($metodo === 'DELETE') {
        $id = (int) ($_GET['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);

            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Pasta inválida.'
            ]);

            exit;
        }

        $stmt = $pdo->prepare('
            SELECT COUNT(*)
            FROM produtos
            WHERE pasta_id = ?
        ');

        $stmt->execute([$id]);

        $usoProdutos = (int) $stmt->fetchColumn();

        if ($usoProdutos > 0) {
            http_response_code(409);

            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Esta pasta não pode ser retirada porque possui produtos vinculados.'
            ]);

            exit;
        }

        $stmt = $pdo->prepare(
            'DELETE FROM pastas WHERE id = ?'
        );

        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);

            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Pasta não encontrada.'
            ]);

            exit;
        }

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Pasta retirada com sucesso.'
        ]);

        exit;
    }

    http_response_code(405);

    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Método não permitido.'
    ]);
} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao processar a operação.'
    ]);
}