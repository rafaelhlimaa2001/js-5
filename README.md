# Consumo de APIs e manipulação dinâmica do DOM

Mini projeto em JavaScript puro que pratica objetos, arrays, assincronismo (`Promise`, `async/await`), a Fetch API e os **quatro estados de uma tela**: Carregando, Erro, Vazio e Sucesso. São apenas dois arquivos: `index.html` e `app.js`.

## Como executar

1. Mantenha `index.html` e `app.js` na mesma pasta.
2. Abra o `index.html` no navegador (é preciso internet para as APIs).
3. Abra o Console com **F12** para ver as saídas da Parte 1 e os erros de rede.

## O que o projeto faz

### Parte 1 – Validação e faturamento de pedidos
A partir do array `pedidos`, o código:
1. valida cada pedido com `filter` (cliente não vazio, depois de `trim()`, e valor numérico maior que 0);
2. filtra os pedidos válidos com status `"pago"`;
3. soma o faturamento com `reduce`;
4. gera textos como `Bia — R$ 120.00` com `toFixed(2)`.

### Parte 2 – Buscador de CEP ([ViaCEP](https://viacep.com.br/))
- O CEP passa por `.trim()` e por uma expressão regular (`/^\d{8}$/`): só dígitos e exatamente 8 caracteres. O hífen (`01001-000`) é aceito e removido.
- A consulta usa `fetch` com `async/await` em `https://viacep.com.br/ws/{cep}/json/`.
- **Bônus:** o histórico de buscas fica em um array de objetos (`{ cep, rua, cidade, uf }`) e é listado na tela, com o mais recente no topo e sem repetir CEPs.

### Parte 3 – Mini Pokédex ([PokéAPI](https://pokeapi.co/))
- O nome é validado (não pode ser vazio), passa por `trim()` e é convertido para minúsculas.


### Os quatro estados da tela

| Estado | Quando acontece | O que a tela mostra |
|---|---|---|
| **Carregando** | Durante o `fetch` | "Buscando..." e o botão desabilitado (reabilitado no `finally`) |
| **Erro** | Falha de rede (sem internet) ou erro HTTP (`!response.ok`) | "Falha na conexão..." |
| **Vazio** | ViaCEP devolve a chave `erro`; PokéAPI devolve 404 | "CEP não encontrado" / "Pokémon não encontrado" |
| **Sucesso** | Dados recebidos | Resultado montado com `createElement` e `textContent`; o resultado anterior é limpo com `replaceChildren()` e o aviso de status é apagado |

**Detalhe importante:** o `fetch` só rejeita a Promise em falhas de rede. Respostas como 404 ou 500 **não** lançam erro sozinhas, por isso o código verifica `response.ok` (e, na Pokédex, trata o 404 separadamente).

Os textos vindos das APIs são inseridos com `textContent` (e não `innerHTML`), o que evita injetar HTML indesejado na página.

## Parte 4 – Reflexão: por que `Promise.all` pode ser mais rápido que vários `await` seguidos?

Porque o `await` **sequencial** espera uma Promise resolver antes de **iniciar** a próxima requisição, enquanto o `Promise.all` **dispara todas as requisições em paralelo** e espera todas terminarem juntas, aproveitando melhor o tempo de rede.

```js
// Sequencial: cada requisição só começa quando a anterior termina
const a = await fetch(urlA);   // espera ~1 s
const b = await fetch(urlB);   // espera mais ~1 s
const c = await fetch(urlC);   // espera mais ~1 s
// total ≈ 3 s (soma dos tempos)

// Paralelo: as três começam ao mesmo tempo
const [a, b, c] = await Promise.all([fetch(urlA), fetch(urlB), fetch(urlC)]);
// total ≈ 1 s (tempo da mais lenta)
```

Em resumo, o tempo total do sequencial é a **soma** dos tempos e o do `Promise.all` é aproximadamente o da requisição **mais lenta**. Duas ressalvas:

- Só vale quando as requisições são **independentes**. Se uma precisa do resultado da outra (por exemplo, usar o CEP para buscar outro dado), a ordem sequencial é necessária.
- O `Promise.all` rejeita assim que **uma** das Promises falhar. Quando você quer o resultado de todas, mesmo que algumas falhem, use `Promise.allSettled`.
