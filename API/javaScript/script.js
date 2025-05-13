let score = 0;
let countries = [];
let currentCountry = null;
let correctFlags = []; // Armazenar as bandeiras corretas
let displayedFlags = []; // Armazenar as bandeiras já exibidas para não repetir
const nome_usuario = localStorage.getItem("nomeUsuario")
const nome_sala = localStorage.getItem("nomeSala")
document.addEventListener("DOMContentLoaded", () => {
  startGame();
});

function atualizarPontosNoServidor() {
  const nome_usuario = localStorage.getItem("nomeUsuario");
  const nome_sala = localStorage.getItem("nomeSala");
  const pontos = localStorage.getItem("pontos")
  return fetch(`http://10.106.208.17:3000/sala/${nome_sala}/usuario/${nome_usuario}/pontos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ pontos: localStorage.getItem("pontosUsuario") }) // envia os pontos salvos
  });
}

function Acertou() {
  var novaDiv = document.createElement("div");
  novaDiv.className = "Acertou";
  document.body.appendChild(novaDiv);
}

function Errou() {
  var novaDiv = document.createElement("div");
  novaDiv.className = "Errou";
  document.body.appendChild(novaDiv);
}

// Função para iniciar o jogo
function startGame() {
  score = 0;
  document.getElementById('score').textContent = `Pontuação: ${score}`;
  correctFlags = []; // Limpa as bandeiras corretas ao reiniciar
  displayedFlags = []; // Limpa as bandeiras já exibidas
  document.getElementById('BandeirasCertas').innerHTML = ''; // Limpa as bandeiras na tela
  fetchCountries();
}

// Função para buscar dados dos países
async function fetchCountries() {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all");
    countries = await response.json();
    nextQuestion();
  } catch (error) {
    console.error("Erro ao carregar os dados dos países:", error);
  }
}

// Função para mostrar a próxima bandeira
function nextQuestion() {
  // Escolher um país aleatório que ainda não foi exibido
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * countries.length);
  } while (displayedFlags.includes(countries[randomIndex].name.common));

  currentCountry = countries[randomIndex];

  // Obter o nome do país em português
  const countryNameInPortuguese = currentCountry.translations.por.common || currentCountry.name.common;

  // Exibir a bandeira
  document.getElementById("flag").src = currentCountry.flags.svg;

  // Adiciona o país à lista de bandeiras exibidas para evitar repetições
  displayedFlags.push(currentCountry.name.common);

  // Gerar opções
  const options = generateOptions(countryNameInPortuguese);

  // Embaralhar as opções antes de exibir
  const shuffledOptions = shuffleArray(options);

  // Definir as opções nos botões
  const buttons = document.querySelectorAll(".option");
  buttons.forEach((button, index) => {
    button.textContent = shuffledOptions[index];
  });
}

// Função para gerar opções de resposta
function generateOptions(correctAnswer) {
  const options = new Set();
  options.add(correctAnswer);

  // Adicionar opções incorretas aleatórias
  while (options.size < 4) {
    const randomIndex = Math.floor(Math.random() * countries.length);
    const countryNameInPortuguese = countries[randomIndex].translations.por.common || countries[randomIndex].name.common;
    options.add(countryNameInPortuguese);
  }

  return Array.from(options);
}

// Função para embaralhar as opções
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Troca de posições
  }
  return array;
}

// Função para verificar a resposta
function checkAnswer(button) {
  const selectedAnswer = button.textContent;

  // Obter o nome do país em português para comparação
  const countryNameInPortuguese = currentCountry.translations.por.common || currentCountry.name.common;

  if (selectedAnswer === countryNameInPortuguese) {
    score++;
    correctFlags.push(currentCountry); // Adiciona a bandeira acertada à lista
    Acertou();

    // Exibe a bandeira na parte inferior esquerda
    const flagImage = document.createElement("img");
    flagImage.src = currentCountry.flags.svg;
    flagImage.classList.add("correct-flag");
  } else {
    score--; // Perde 1 ponto se errar
    Errou();

    // Se errou, remove a última bandeira que foi acertada
    if (correctFlags.length > 0) {
      correctFlags.pop();
      const lastFlag = document.getElementById('BandeirasCertas').lastChild;
      if (lastFlag) {
        lastFlag.remove();
      }
    }
  }
  


  // Atualiza a pontuação
  document.getElementById('score').textContent = `Pontuação: ${score}`;
  localStorage.setItem("pontosUsuario", score);
  atualizarPontosNoServidor()

  // Exibe a próxima bandeira
  nextQuestion();

}



