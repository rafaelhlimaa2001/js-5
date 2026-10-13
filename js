'use strict';

/* ==========================================================
   Consumo de APIs e manipulação dinâmica do DOM
   Abra o index.html no navegador (Console com F12).
   ========================================================== */

// Atualiza a mensagem de status. "tipo" vira classe CSS: carregando | erro | vazio
function definirStatus(elemento, texto = '', tipo = '') {
  elemento.textContent = texto;
  elemento.className = tipo ? `status ${tipo}` : 'status';
}

/* ==========================================================
   PARTE 1 – Manipulação e validação de dados
   ========================================================== */
const pedidos = [
  { cliente: 'Bia', valor: 120, status: 'pago' },
  { cliente: 'Caio', valor: 80.5, status: 'pendente' },
  { cliente: '', valor: 50, status: 'pago' },          // inválido: cliente vazio
  { cliente: 'Dani', valor: 0, status: 'pago' },       // inválido: valor não é > 0
  { cliente: 'Eva', valor: 'abc', status: 'pago' },    // inválido: valor não numérico
  { cliente: 'Fábio', valor: 200, status: 'pago' },
  { cliente: '   ', valor: 30, status: 'pago' },       // inválido: só espaços
  { cliente: 'Gui', valor: 45.9, status: 'cancelado' },
  { cliente: 'Hugo', valor: 75.25, status: 'pago' },
];

const pedidoValido = (pedido) =>
  typeof pedido.cliente === 'string' &&
  pedido.cliente.trim() !== '' &&
  typeof pedido.valor === 'number' &&
  Number.isFinite(pedido.valor) &&
  pedido.valor > 0;

const pedidosValidos = pedidos.filter(pedidoValido);
const pedidosPagos = pedidosValidos.filter((pedido) => pedido.status === 'pago');
const totalFaturado = pedidosPagos.reduce((soma, pedido) => soma + pedido.valor, 0);
const textosPedidos = pedidosPagos.map(
  (pedido) => `${pedido.cliente.trim()} — R$ ${pedido.valor.toFixed(2)}`
);

console.log('Pedidos válidos:', pedidosValidos.length, 'de', pedidos.length);
console.log('Pedidos pagos:', pedidosPagos);
console.log('Total faturado:', `R$ ${totalFaturado.toFixed(2)}`);
textosPedidos.forEach((texto) => console.log(texto));

// Mostra o resultado também na página
const listaPedidos = document.querySelector('#pedidos-lista');
textosPedidos.forEach((texto) => {
  const item = document.createElement('li');
  item.textContent = texto;
  listaPedidos.append(item);
});
document.querySelector('#pedidos-total').textContent =
  `Total faturado: R$ ${totalFaturado.toFixed(2)}`;

/* ==========================================================
   PARTE 2 – Buscador de CEP (ViaCEP)
   ========================================================== */
const formCep = document.querySelector('#form-cep');
const campoCep = document.querySelector('#cep');
const botaoCep = document.querySelector('#btn-cep');
const statusCep = document.querySelector('#status-cep');
const resultadoCep = document.querySelector('#resultado-cep');
const listaHistorico = document.querySelector('#historico-cep');

const historicoCep = []; // array de objetos: { cep, rua, cidade, uf }

// Limpa (trim + hífen opcional) e valida com regex: exatamente 8 dígitos
function validarCep(texto) {
  const cep = texto.trim().replace(/-/g, '');
  return /^\d{8}$/.test(cep) ? cep : null;
}

function exibirEnderecoCep(dados) {
  const campos = [
    ['Rua', dados.logradouro],
    ['Bairro', dados.bairro],
    ['Cidade', dados.localidade],
    ['UF', dados.uf],
  ];

  resultadoCep.replaceChildren(); // limpa o resultado anterior
  campos.forEach(([rotulo, valor]) => {
    const dt = document.createElement('dt');
    dt.textContent = rotulo;
    const dd = document.createElement('dd');
    dd.textContent = valor || '—';
    resultadoCep.append(dt, dd);
  });
}

function renderizarHistorico() {
  listaHistorico.replaceChildren();
  if (historicoCep.length === 0) {
    const vazio = document.createElement('li');
    vazio.className = 'vazio-lista';
    vazio.textContent = 'Nenhuma busca ainda.';
    listaHistorico.append(vazio);
    return;
  }
  historicoCep.forEach(({ cep, rua, cidade, uf }) => {
    const item = document.createElement('li');
    item.textContent = `${cep} — ${rua ? `${rua}, ` : ''}${cidade}/${uf}`;
    listaHistorico.append(item);
  });
}

async function buscarCep(cep) {
  // Estado: carregando
  resultadoCep.replaceChildren();
  definirStatus(statusCep, 'Buscando...', 'carregando');
  botaoCep.disabled = true;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`); // fetch não rejeita sozinho em erro HTTP
    }
    const dados = await response.json();

    // Estado: vazio / não encontrado
    if (dados.erro) {
      definirStatus(statusCep, 'CEP não encontrado', 'vazio');
      return;
    }

    // Estado: sucesso
    exibirEnderecoCep(dados);
    definirStatus(statusCep); // limpa o aviso

    // Bônus: histórico (sem repetir o mesmo CEP; o mais recente fica no topo)
    const indice = historicoCep.findIndex((item) => item.cep === cep);
    if (indice !== -1) historicoCep.splice(indice, 1);
    historicoCep.unshift({
      cep,
      rua: dados.logradouro,
      cidade: dados.localidade,
      uf: dados.uf,
    });
    renderizarHistorico();
  } catch (erro) {
    // Estado: erro (rede ou HTTP)
    console.error('Falha ao buscar CEP:', erro);
    definirStatus(statusCep, 'Falha na conexão. Verifique sua internet e tente novamente.', 'erro');
  } finally {
    botaoCep.disabled = false;
  }
}

formCep.addEventListener('submit', (e) => {
  e.preventDefault();
  const cep = validarCep(campoCep.value);
  if (cep === null) {
    resultadoCep.replaceChildren();
    definirStatus(statusCep, 'CEP inválido: digite exatamente 8 números.', 'erro');
    return;
  }
  buscarCep(cep);
});

renderizarHistorico();

/* ==========================================================
   PARTE 3 – Mini Pokédex (PokéAPI)
   ========================================================== */
const formPokemon = document.querySelector('#form-pokemon');
const campoPokemon = document.querySelector('#pokemon-nome');
const botaoPokemon = document.querySelector('#btn-pokemon');
const statusPokemon = document.querySelector('#status-pokemon');
const resultadoPokemon = document.querySelector('#pokemon-resultado');

function exibirPokemon(dados) {
  const nome = document.createElement('h3');
  nome.textContent = dados.name.charAt(0).toUpperCase() + dados.name.slice(1);

  const elementos = [nome];

  const imagemUrl = dados.sprites?.front_default;
  if (imagemUrl) {
    const imagem = document.createElement('img');
    imagem.src = imagemUrl;
    imagem.alt = `Imagem de ${dados.name}`;
    elementos.push(imagem);
  }

  const tipos = document.createElement('p');
  tipos.textContent = `Tipos: ${dados.types.map((item) => item.type.name).join(', ')}`;
  elementos.push(tipos);

  resultadoPokemon.replaceChildren(...elementos);
}

async function buscarPokemon(nome) {
  // Estado: carregando
  resultadoPokemon.replaceChildren();
  definirStatus(statusPokemon, 'Buscando...', 'carregando');
  botaoPokemon.disabled = true;

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(nome)}`);

    if (!response.ok) {
      // Estado: vazio (404 = não existe) ou erro (outros códigos HTTP)
      if (response.status === 404) {
        definirStatus(statusPokemon, 'Pokémon não encontrado', 'vazio');
        return;
      }
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const dados = await response.json();

    // Estado: sucesso
    exibirPokemon(dados);
    definirStatus(statusPokemon);
  } catch (erro) {
    // Estado: erro (rede ou HTTP)
    console.error('Falha ao buscar Pokémon:', erro);
    definirStatus(statusPokemon, 'Falha na conexão. Verifique sua internet e tente novamente.', 'erro');
  } finally {
    botaoPokemon.disabled = false;
  }
}

formPokemon.addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = campoPokemon.value.trim().toLowerCase();
  if (nome === '') {
    resultadoPokemon.replaceChildren();
    definirStatus(statusPokemon, 'Digite o nome de um Pokémon.', 'erro');
    return;
  }
  buscarPokemon(nome);
});
