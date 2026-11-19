<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

function responder($status, $dados)
{
    http_response_code($status);

    echo json_encode(
        $dados,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->query("
            SELECT
                m.id,
                m.tipo,
                m.quantidade,
                m.data_hora,
                m.custo,
                m.nf,
                m.centro_consumo,
                p.pn,
                p.nome,
                p.tipo AS tipo_motor,
                m.base_id,
                b.nome AS base
            FROM movimentacoes m
            INNER JOIN produtos p
                ON p.id = m.produto_id
            INNER JOIN bases b
                ON b.id = m.base_id
            ORDER BY
                m.data_hora DESC,
                m.id DESC
        ");

        responder(200, [
            'sucesso' => true,
            'dados' => $stmt->fetchAll()
        ]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        responder(405, [
            'sucesso' => false,
            'mensagem' => 'Método não permitido.'
        ]);
    }

    $dados = json_decode(
        file_get_contents('php://input'),
        true
    );

    if (!is_array($dados)) {
        responder(400, [
            'sucesso' => false,
            'mensagem' => 'Dados inválidos.'
        ]);
    }

    $acao = trim($dados['acao'] ?? '');
    $tipoMovimentacao = trim($dados['tipo'] ?? '');
    $pn = trim($dados['pn'] ?? '');
    $nome = trim($dados['nome'] ?? '');

    if ($acao === 'remocao') {
        if ($pn === '' || $nome === '') {
            responder(400, [
                'sucesso' => false,
                'mensagem' => 'Informe o ITEM e o PN para remover o material.'
            ]);
        }

        $pdo->beginTransaction();

        $stmtProduto = $pdo->prepare("
            SELECT
                id,
                nome
            FROM produtos
            WHERE pn = ?
            FOR UPDATE
        ");

        $stmtProduto->execute([$pn]);

        $produto = $stmtProduto->fetch();

        if (!$produto) {
            $pdo->rollBack();

            responder(404, [
                'sucesso' => false,
                'mensagem' => 'Produto não encontrado.'
            ]);
        }

        $stmtMovimentacoes = $pdo->prepare("
            DELETE FROM movimentacoes
            WHERE produto_id = ?
        ");

        $stmtMovimentacoes->execute([
            (int) $produto['id']
        ]);

        $stmtEstoque = $pdo->prepare("
            DELETE FROM estoque
            WHERE produto_id = ?
        ");

        $stmtEstoque->execute([
            (int) $produto['id']
        ]);

        $stmtProdutoDelete = $pdo->prepare("
            DELETE FROM produtos
            WHERE id = ?
        ");

        $stmtProdutoDelete->execute([
            (int) $produto['id']
        ]);

        $pdo->commit();

        responder(200, [
            'sucesso' => true,
            'mensagem' => 'Material removido com sucesso.'
        ]);
    }

    if (!in_array(
        $tipoMovimentacao,
        ['entrada', 'saida'],
        true
    )) {
        responder(400, [
            'sucesso' => false,
            'mensagem' => 'Tipo de movimentação inválido.'
        ]);
    }

    $quantidade = (int) (
        $dados['quantidade'] ?? 0
    );

    if ($pn === '') {
        responder(400, [
            'sucesso' => false,
            'mensagem' => 'Informe o PN.'
        ]);
    }

    if ($quantidade <= 0) {
        responder(400, [
            'sucesso' => false,
            'mensagem' => 'A quantidade deve ser maior que zero.'
        ]);
    }

    $pdo->beginTransaction();

    if ($tipoMovimentacao === 'entrada') {
        $nf = trim($dados['nf'] ?? '');
        $uf = trim($dados['uf'] ?? '');
        $prat = trim($dados['prat'] ?? '');
        $tipoMotor = trim($dados['tipo_motor'] ?? '');

        $baseId = (int) (
            $dados['base_id'] ?? 0
        );

        if ($baseId <= 0) {
            $baseId = 1;
        }

        $stmtBase = $pdo->prepare("
            SELECT
                id,
                nome
            FROM bases
            WHERE id = ?
        ");

        $stmtBase->execute([
            $baseId
        ]);

        $base = $stmtBase->fetch();

        if (!$base) {
            $pdo->rollBack();

            responder(400, [
                'sucesso' => false,
                'mensagem' => 'Base inválida.'
            ]);
        }

        if (
            strcasecmp(
                $base['nome'],
                'Transferência'
            ) === 0
        ) {
            $pdo->rollBack();

            responder(400, [
                'sucesso' => false,
                'mensagem' =>
                    'Transferência está disponível apenas para configuração futura.'
            ]);
        }

        $tiposMotorValidos = [
            'MWM',
            'Yanmar 66X',
            'Yanmar 6LY',
            'Dong',
            'Mercedes',
            'ZF 85IV',
            'ZF 325IV'
        ];

        if (
            $tipoMotor !== '' &&
            !in_array(
                $tipoMotor,
                $tiposMotorValidos,
                true
            )
        ) {
            $pdo->rollBack();

            responder(400, [
                'sucesso' => false,
                'mensagem' => 'Tipo de motor inválido.'
            ]);
        }

        $valorUnitarioTexto = trim(
            (string) (
                $dados['vlr_unit'] ?? ''
            )
        );

        $valorUnitarioInformado =
            $valorUnitarioTexto !== '';

        $valorUnitario = null;

        if ($valorUnitarioInformado) {
            $valorUnitarioTexto =
                str_replace(
                    ',',
                    '.',
                    $valorUnitarioTexto
                );

            if (
                !is_numeric(
                    $valorUnitarioTexto
                ) ||
                (float) $valorUnitarioTexto < 0
            ) {
                $pdo->rollBack();

                responder(400, [
                    'sucesso' => false,
                    'mensagem' =>
                        'O valor unitário informado é inválido.'
                ]);
            }

            $valorUnitario =
                (float) $valorUnitarioTexto;
        }

        $ufsValidas = [
            'METRO',
            'CONJUNTO',
            'PACOTE',
            'UNIDADE'
        ];

        if (
            $uf !== '' &&
            !in_array(
                $uf,
                $ufsValidas,
                true
            )
        ) {
            $pdo->rollBack();

            responder(400, [
                'sucesso' => false,
                'mensagem' => 'UF inválida.'
            ]);
        }

        $maxTexto = trim(
            (string) (
                $dados['max'] ?? ''
            )
        );

        $minTexto = trim(
            (string) (
                $dados['min'] ?? ''
            )
        );

        $max = null;
        $min = null;

        if ($maxTexto !== '') {
            if (
                !is_numeric($maxTexto) ||
                (int) $maxTexto < 0
            ) {
                $pdo->rollBack();

                responder(400, [
                    'sucesso' => false,
                    'mensagem' =>
                        'O valor máximo é inválido.'
                ]);
            }

            $max = (int) $maxTexto;
        }

        if ($minTexto !== '') {
            if (
                !is_numeric($minTexto) ||
                (int) $minTexto < 0
            ) {
                $pdo->rollBack();

                responder(400, [
                    'sucesso' => false,
                    'mensagem' =>
                        'O valor mínimo é inválido.'
                ]);
            }

            $min = (int) $minTexto;
        }

        $stmtProduto = $pdo->prepare("
            SELECT
                id,
                nome,
                tipo
            FROM produtos
            WHERE pn = ?
            FOR UPDATE
        ");

        $stmtProduto->execute([
            $pn
        ]);

        $produto = $stmtProduto->fetch();

        if ($produto) {
            $produtoId =
                (int) $produto['id'];

            $novoNome =
                $nome !== ''
                    ? $nome
                    : $produto['nome'];

            $novoTipo =
                $tipoMotor !== ''
                    ? $tipoMotor
                    : $produto['tipo'];

            $stmtAtualizarProduto =
                $pdo->prepare("
                    UPDATE produtos
                    SET
                        nome = ?,
                        tipo = ?
                    WHERE id = ?
                ");

            $stmtAtualizarProduto->execute([
                $novoNome,
                $novoTipo !== ''
                    ? $novoTipo
                    : null,
                $produtoId
            ]);
        } else {
            if ($nome === '') {
                $pdo->rollBack();

                responder(400, [
                    'sucesso' => false,
                    'mensagem' =>
                        'Informe o nome do material.'
                ]);
            }

            $stmtNovoProduto =
                $pdo->prepare("
                    INSERT INTO produtos (
                        pn,
                        nome,
                        tipo,
                        custo,
                        pasta_id
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        0,
                        NULL
                    )
                ");

            $stmtNovoProduto->execute([
                $pn,
                $nome,
                $tipoMotor !== ''
                    ? $tipoMotor
                    : null
            ]);

            $produtoId =
                (int) $pdo->lastInsertId();
        }

        $stmtEstoque = $pdo->prepare("
            SELECT
                quantidade,
                vlr_unit,
                nf,
                uf,
                prat,
                max,
                min
            FROM estoque
            WHERE produto_id = ?
              AND base_id = ?
            FOR UPDATE
        ");

        $stmtEstoque->execute([
            $produtoId,
            $baseId
        ]);

        $estoqueAtual =
            $stmtEstoque->fetch();

        if ($estoqueAtual) {
            $quantidadeAtual =
                (int) $estoqueAtual['quantidade'];

            $valorUnitarioAtual =
                (float) (
                    $estoqueAtual['vlr_unit']
                    ?? 0
                );

            $novaQuantidade =
                $quantidadeAtual +
                $quantidade;

            if ($valorUnitarioInformado) {
                if ($quantidadeAtual > 0) {
                    $valorTotalAtual =
                        $quantidadeAtual *
                        $valorUnitarioAtual;

                    $valorTotalEntrada =
                        $quantidade *
                        $valorUnitario;

                    $novoValorUnitario =
                        (
                            $valorTotalAtual +
                            $valorTotalEntrada
                        ) / $novaQuantidade;
                } else {
                    $novoValorUnitario =
                        $valorUnitario;
                }
            } else {
                $novoValorUnitario =
                    $valorUnitarioAtual;
            }

            $novoValorUnitario =
                round(
                    $novoValorUnitario,
                    4
                );

            $stmtAtualizarEstoque =
                $pdo->prepare("
                    UPDATE estoque
                    SET
                        quantidade = ?,
                        nf = COALESCE(
                            NULLIF(?, ''),
                            nf
                        ),
                        data = NOW(),
                        uf = COALESCE(
                            NULLIF(?, ''),
                            uf
                        ),
                        vlr_unit = ?,
                        prat = COALESCE(
                            NULLIF(?, ''),
                            prat
                        ),
                        max = COALESCE(
                            ?,
                            max
                        ),
                        min = COALESCE(
                            ?,
                            min
                        )
                    WHERE produto_id = ?
                      AND base_id = ?
                ");

            $stmtAtualizarEstoque->execute([
                $novaQuantidade,
                $nf,
                $uf,
                $novoValorUnitario,
                $prat,
                $max,
                $min,
                $produtoId,
                $baseId
            ]);
        } else {
            $novoValorUnitario =
                $valorUnitarioInformado
                    ? round(
                        $valorUnitario,
                        4
                    )
                    : 0;

            $stmtNovoEstoque =
                $pdo->prepare("
                    INSERT INTO estoque (
                        produto_id,
                        base_id,
                        quantidade,
                        nf,
                        data,
                        uf,
                        vlr_unit,
                        prat,
                        max,
                        min
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        NOW(),
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                ");

            $stmtNovoEstoque->execute([
                $produtoId,
                $baseId,
                $quantidade,
                $nf !== ''
                    ? $nf
                    : null,
                $uf !== ''
                    ? $uf
                    : null,
                $novoValorUnitario,
                $prat !== ''
                    ? $prat
                    : null,
                $max,
                $min
            ]);
        }

        $stmtMovimentacao =
            $pdo->prepare("
                INSERT INTO movimentacoes (
                    produto_id,
                    base_id,
                    tipo,
                    quantidade,
                    custo,
                    nf,
                    centro_consumo
                )
                VALUES (
                    ?,
                    ?,
                    'entrada',
                    ?,
                    ?,
                    ?,
                    NULL
                )
            ");

        $stmtMovimentacao->execute([
            $produtoId,
            $baseId,
            $quantidade,
            $valorUnitarioInformado
                ? $valorUnitario
                : null,
            $nf !== ''
                ? $nf
                : null
        ]);

        $pdo->commit();

        responder(200, [
            'sucesso' => true,
            'mensagem' =>
                'Entrada registrada com sucesso.'
        ]);
    }

    $centroConsumo =
        trim(
            $dados['centro_consumo'] ?? ''
        );

    $baseId =
        (int) (
            $dados['base_id'] ?? 0
        );

    if ($centroConsumo === '') {
        $pdo->rollBack();

        responder(400, [
            'sucesso' => false,
            'mensagem' =>
                'Informe o centro de consumo.'
        ]);
    }

    if ($baseId <= 0) {
        $pdo->rollBack();

        responder(400, [
            'sucesso' => false,
            'mensagem' =>
                'Selecione a base da saída.'
        ]);
    }

    $stmtBase = $pdo->prepare("
        SELECT
            id,
            nome
        FROM bases
        WHERE id = ?
    ");

    $stmtBase->execute([
        $baseId
    ]);

    $base = $stmtBase->fetch();

    if (!$base) {
        $pdo->rollBack();

        responder(400, [
            'sucesso' => false,
            'mensagem' => 'Base inválida.'
        ]);
    }

    if (
        strcasecmp(
            $base['nome'],
            'Transferência'
        ) === 0
    ) {
        $pdo->rollBack();

        responder(400, [
            'sucesso' => false,
            'mensagem' =>
                'Transferência está disponível apenas para configuração futura.'
        ]);
    }

    $stmtProduto = $pdo->prepare("
        SELECT id
        FROM produtos
        WHERE pn = ?
        FOR UPDATE
    ");

    $stmtProduto->execute([
        $pn
    ]);

    $produto = $stmtProduto->fetch();

    if (!$produto) {
        $pdo->rollBack();

        responder(404, [
            'sucesso' => false,
            'mensagem' =>
                'Produto não encontrado.'
        ]);
    }

    $produtoId =
        (int) $produto['id'];

    $stmtEstoque = $pdo->prepare("
        SELECT
            quantidade,
            vlr_unit
        FROM estoque
        WHERE produto_id = ?
          AND base_id = ?
        FOR UPDATE
    ");

    $stmtEstoque->execute([
        $produtoId,
        $baseId
    ]);

    $estoqueAtual =
        $stmtEstoque->fetch();

    if ($estoqueAtual) {
        $custoAtual =
            (float) (
                $estoqueAtual['vlr_unit']
                ?? 0
            );

        $stmtAtualizarEstoque =
            $pdo->prepare("
                UPDATE estoque
                SET quantidade =
                    quantidade - ?
                WHERE produto_id = ?
                  AND base_id = ?
            ");

        $stmtAtualizarEstoque->execute([
            $quantidade,
            $produtoId,
            $baseId
        ]);
    } else {
        $custoAtual = 0;

        $stmtNovoEstoque =
            $pdo->prepare("
                INSERT INTO estoque (
                    produto_id,
                    base_id,
                    quantidade,
                    vlr_unit
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    0
                )
            ");

        $stmtNovoEstoque->execute([
            $produtoId,
            $baseId,
            -$quantidade
        ]);
    }

    $stmtMovimentacao =
        $pdo->prepare("
            INSERT INTO movimentacoes (
                produto_id,
                base_id,
                tipo,
                quantidade,
                custo,
                nf,
                centro_consumo
            )
            VALUES (
                ?,
                ?,
                'saida',
                ?,
                ?,
                NULL,
                ?
            )
        ");

    $stmtMovimentacao->execute([
        $produtoId,
        $baseId,
        $quantidade,
        $custoAtual,
        $centroConsumo
    ]);

    $pdo->commit();

    responder(200, [
        'sucesso' => true,
        'mensagem' =>
            'Saída registrada com sucesso.'
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    responder(500, [
        'sucesso' => false,
        'mensagem' =>
            'Erro ao processar a movimentação.'
    ]);
}