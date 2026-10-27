# Albuquerque Ads — dashboard de tráfego

Dashboard do Meta Ads das contas gerenciadas: investimento, conversas, leads,
compras, comissão, faturamento pelo ticket, ROAS e custos, com comparação com o
período anterior (verde = melhorou, vermelho = piorou), tabelas por conta,
campanha e conjunto de anúncios.

## Como funciona

Esta versão é **estática**: os números ficam nos arquivos de `data/` e são
atualizados quando alguém envia uma nova coleta para o repositório. Ela não
consulta o Meta sozinha.

- `data/diario.csv` — uma linha por dia e conta (cards, gráficos, tabela por
  conta e comparação com o período anterior).
- `data/conjuntos.csv` — uma linha por conjunto de anúncios dos últimos 30 dias
  (tabelas de campanhas e conjuntos; não muda com o filtro de período).
- `data/dados.js` — gerado a partir dos CSVs; não edite à mão.
- `scripts/build.py` — gera `data/dados.js`.
- `scripts/shim.js` — faz a página ler os arquivos de `data/`.

## Atualizar os dados

1. Substitua `data/diario.csv` (desde o primeiro dia que o filtro precisa) e
   `data/conjuntos.csv` com uma nova coleta da Supermetrics (Meta Ads, fuso
   America/Fortaleza), mantendo os mesmos cabeçalhos.
2. Rode `python3 scripts/build.py --atualizado "AAAA-MM-DDTHH:MM-03:00"`.
3. Faça commit e push. O GitHub Pages publica em cerca de 1 minuto.

## Atenção

Em repositório público, qualquer pessoa com o link vê os números das contas
(investimento, vendas, nomes de campanhas).
