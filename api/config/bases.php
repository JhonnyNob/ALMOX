<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$metodo = $_SERVER['REQUEST_METHOD'];

try {
    if ($metodo === 'GET') {
        $stmt = $pdo->query(
            'SELECT id, nome FROM bases ORDER BY nome ASC'
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
                'mensagem' => 'O nome da base é obrigatório.'
            ]);

            exit;
        }

        $stmt = $pdo->prepare(
            'SELECT id FROM bases WHERE nome = ?'
        );

        $stmt->execute([$nome]);

        if ($stmt->fetch()) {
            http_response_code(409);

            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Essa base já está cadastrada.'
            ]);

            exit;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO bases (nome) VALUES (?)'
        );

        $stmt->execute([$nome]);

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Base cadastrada com sucesso.',
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
                'mensagem' => 'Base inválida.'
            ]);

            exit;
        }

        $stmt = $pdo->prepare('
            SELECT COUNT(*)
            FROM estoque
            WHERE base_id = ?
        ');

        $stmt->execute([$id]);

        $usoEstoque = (int) $stmt->fetchColumn();

        $stmt = $pdo->prepare('
            SELECT COUNT(*)
            FROM movimentacoes
            WHERE base_id = ?
        ');

        $stmt->execute([$id]);

        $usoMovimentacoes = (int) $stmt->fetchColumn();

        if ($usoEstoque > 0 || $usoMovimentacoes > 0) {
            http_response_code(409);

            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Esta base não pode ser retirada porque já possui registros vinculados.'
            ]);

            exit;
        }

        $stmt = $pdo->prepare(
            'DELETE FROM bases WHERE id = ?'
        );

        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);

            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Base não encontrada.'
            ]);

            exit;
        }

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Base retirada com sucesso.'
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