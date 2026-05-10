// ======================================================
// ELEMENTOS DO DOM
// ======================================================



const casas = document.querySelectorAll('.casa');
const consoleGame = document.getElementById('console');
const inputPlayer1 = document.getElementById('player1');
const inputPlayer2 = document.getElementById('player2');

// Elementos de Navegação e Telas
const telaLogin = document.getElementById('tela-login');
const telaMenu = document.getElementById('tela-menu');
const telaJogo = document.getElementById('tela-jogo');

// Botões e Seletores
const btnLogar = document.getElementById('btnLogar');
const btnIrParaJogo = document.getElementById('btnIrParaJogo');
const btnReiniciar = document.getElementById('btnReiniciar');
const btnVoltarMenu = document.getElementById('btnVoltarMenu');
const selectModo = document.getElementById('select-modo');
const selectDificuldade = document.getElementById('select-dificuldade');
const selectSimbolo = document.getElementById('select-simbolo');
const configIA = document.getElementById('config-ia');
const containerNomes = document.getElementById('nomes-jogadores');

// ======================================================
// CLASSE PRINCIPAL
// ======================================================



class JogoDaVelha {

    constructor() {
        this.combinacoesVitoria = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        this.turno = 'X';
        this.jogoAtivo = false;
        this.jogador1 = '';
        this.jogador2 = '';
        this.modo = 'pvp'; // pvp ou pve
        this.dificuldade = 'facil';
        this.simboloHumano = 'X';

        this.iniciarEventos()
    }



    // ======================================================
    // EVENTOS
    // ======================================================



    iniciarEventos() {
        // Evento para cliques nas casas do tabuleiro
        casas.forEach(casa => {
            casa.addEventListener('click', (evento) => {
                this.marcarCasa(evento.target)
            })
        })

        // Login Simples (Qualquer user/pass com mais de 3 letras)
        btnLogar.addEventListener('click', () => this.validarLogin());

        // Troca de Modo no Menu (Esconde campos de nome se for contra IA)
        selectModo.addEventListener('change', (e) => {
            this.modo = e.target.value;
            configIA.classList.toggle('hidden', this.modo === 'pvp');
            containerNomes.classList.toggle('hidden', this.modo === 'pve');
        });

        // Iniciar Partida do Menu
        btnIrParaJogo.addEventListener('click', () => this.iniciarPartida());

        // Controles de tela de jogo
        btnReiniciar.addEventListener('click', () => this.reiniciarPartida());
        btnVoltarMenu.addEventListener('click', () => this.mudarTela(telaMenu));
    }

    mudarTela(telaAlvo) {
        [telaLogin, telaMenu, telaJogo].forEach(t => t.classList.add('hidden'));
        telaAlvo.classList.remove('hidden');
    }

    validarLogin() {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        
        if (user.length > 3 && pass.length > 3) {
            this.jogador1 = user;
            this.mudarTela(telaMenu);
        } else {
            document.getElementById('console-login').textContent = "Usuário/Senha muito curtos.";
        }
    }



    // ======================================================
    // BOTÃO INICIAR / REINICIAR
    // ======================================================



    iniciarPartida() {
        if (this.modo === 'pvp') {
            this.jogador1 = inputPlayer1.value.trim() || "Jogador 1";
            this.jogador2 = inputPlayer2.value.trim() || "Jogador 2";
        } else {
            this.dificuldade = selectDificuldade.value;
            this.simboloHumano = selectSimbolo.value;
            this.jogador2 = `IA (${this.dificuldade})`;
        }

        // Atualiza legenda de quem é quem
        document.getElementById('info-p1').textContent = `X: ${this.simboloHumano === 'X' ? this.jogador1 : this.jogador2}`;
        document.getElementById('info-p2').textContent = `O: ${this.simboloHumano === 'O' ? this.jogador1 : this.jogador2}`;

        this.limparTabuleiro()
        this.turno = 'X';
        this.jogoAtivo = true;
        this.mudarTela(telaJogo);
        this.mostrarTurnoAtual();

        // Se a IA for X, ela faz a primeira jogada
        if (this.modo === 'pve' && this.simboloHumano === 'O') {
            this.fazerJogadaIA();
        }
    }

    // ======================================================
    // LÓGICA DA IA
    // ======================================================

    fazerJogadaIA() {
        if (!this.jogoAtivo) return;
        
        let index;
        const casasLivres = [...casas].filter(c => c.textContent === '').map(c => parseInt(c.dataset.index));

        if (this.dificuldade === 'facil') {
            // Aleatório
            index = casasLivres[Math.floor(Math.random() * casasLivres.length)];
        } else if (this.dificuldade === 'medio') {
            // Tenta vencer ou bloquear, senão aleatório
            index = this.buscarMelhorLance() ?? casasLivres[Math.floor(Math.random() * casasLivres.length)];
        } else {
            // Difícil: Minimax
            index = this.minimax(this.getEstadoTabuleiro(), this.turno).index;
        }

        // Simula um pequeno delay para parecer que a IA está "pensando"
        setTimeout(() => this.marcarCasa(casas[index]), 500);
    }

    buscarMelhorLance() {
        const simbolos = [this.turno, this.turno === 'X' ? 'O' : 'X']; // Eu primeiro, depois oponente
        
        for (let s of simbolos) {
            for (let comb of this.combinacoesVitoria) {
                const valores = comb.map(i => casas[i].textContent);
                if (valores.filter(v => v === s).length === 2 && valores.includes('')) {
                    return comb[valores.indexOf('')];
                }
            }
        }
        return null;
    }



    reiniciarPartida() {

        this.limparTabuleiro()

        this.turno = 'X'
        this.jogoAtivo = true

        this.mostrarTurnoAtual();
        
        if (this.modo === 'pve' && this.simboloHumano === 'O') {
            this.fazerJogadaIA();
        }
    }



    // ======================================================
    // JOGADA
    // ======================================================



    marcarCasa(casa) {
        if (!this.jogoAtivo) return
        if (casa.textContent !== '') return

        casa.textContent = this.turno

        if (this.existeVencedor()) {
            this.finalizarComVitoria()
            return
        }

        if (this.existeEmpate()) {
            this.finalizarComEmpate()
            return
        }

        this.alternarTurno()
        this.mostrarTurnoAtual();

        // Se for a vez da IA
        if (this.jogoAtivo && this.modo === 'pve' && this.turno !== this.simboloHumano) {
            this.fazerJogadaIA();
        }
    }

    // ======================================================
    // MINIMAX
    // ======================================================

    getEstadoTabuleiro() {
        return [...casas].map(c => c.textContent);
    }

    minimax(novoTabuleiro, player) {
        const casasLivres = novoTabuleiro.map((v, i) => v === '' ? i : null).filter(v => v !== null);

        if (this.checarVitoriaMinimax(novoTabuleiro, 'X')) return { score: this.simboloHumano === 'X' ? -10 : 10 };
        if (this.checarVitoriaMinimax(novoTabuleiro, 'O')) return { score: this.simboloHumano === 'O' ? -10 : 10 };
        if (casasLivres.length === 0) return { score: 0 };

        const movimentos = [];
        for (let i = 0; i < casasLivres.length; i++) {
            const movimento = {};
            movimento.index = casasLivres[i];
            novoTabuleiro[casasLivres[i]] = player;

            if (player === (this.simboloHumano === 'X' ? 'O' : 'X')) {
                movimento.score = this.minimax(novoTabuleiro, this.simboloHumano).score;
            } else {
                movimento.score = this.minimax(novoTabuleiro, this.simboloHumano === 'X' ? 'O' : 'X').score;
            }

            novoTabuleiro[casasLivres[i]] = '';
            movimentos.push(movimento);
        }

        let melhorMovimento;
        if (player !== this.simboloHumano) {
            let melhorScore = -10000;
            movimentos.forEach((m, i) => { if (m.score > melhorScore) { melhorScore = m.score; melhorMovimento = i; } });
        } else {
            let melhorScore = 10000;
            movimentos.forEach((m, i) => { if (m.score < melhorScore) { melhorScore = m.score; melhorMovimento = i; } });
        }
        return movimentos[melhorMovimento];
    }

    checarVitoriaMinimax(tab, p) {
        return this.combinacoesVitoria.some(c => c.every(i => tab[i] === p));
    }

    // ======================================================
    // REGRAS
    // ======================================================

    existeVencedor() {

        for (let combinacao of this.combinacoesVitoria) {

            const [a, b, c] = combinacao

            const valorA = casas[a].textContent
            const valorB = casas[b].textContent
            const valorC = casas[c].textContent

            const venceu =
                valorA !== '' &&
                valorA === valorB &&
                valorB === valorC

            if (venceu) {

                this.destacarCasasVencedoras(a, b, c)

                return true
            }
        }

        return false
    }



    existeEmpate() {

        for (let casa of casas) {
            if (casa.textContent === '') {
                return false
            }
        }

        return true
    }



    // ======================================================
    // FINALIZAÇÃO
    // ======================================================



    finalizarComVitoria() {
        this.jogoAtivo = false
        
        let vencedor;
        if (this.modo === 'pvp') {
            vencedor = this.turno === 'X' ? this.jogador1 : this.jogador2;
        } else {
            vencedor = this.turno === this.simboloHumano ? this.jogador1 : "IA";
        }

        this.escrever(`🏆 Vencedor: ${vencedor}`)
    }



    finalizarComEmpate() {

        this.jogoAtivo = false

        this.escrever('🤝 Deu empate!')
    }



    // ======================================================
    // AUXILIARES
    // ======================================================



    alternarTurno() {

        this.turno = this.turno === 'X' ? 'O' : 'X'
    }



    mostrarTurnoAtual() {
        let jogadorAtual;
        if (this.modo === 'pvp') {
            jogadorAtual = this.turno === 'X' ? this.jogador1 : this.jogador2;
        } else {
            jogadorAtual = this.turno === this.simboloHumano ? this.jogador1 : "IA";
        }

        this.escrever(`Vez de ${jogadorAtual} (${this.turno})`)
    }



    destacarCasasVencedoras(a, b, c) {

        const indices = [a, b, c]

        indices.forEach(indice => {
            casas[indice].classList.add('vencedora')
        })
    }



    limparTabuleiro() {

        casas.forEach(casa => {

            casa.textContent = ''

            casa.classList.remove('vencedora')
        })
    }



    escrever(mensagem) {

        consoleGame.textContent = mensagem
    }
}



// ======================================================
// INICIALIZAÇÃO
// ======================================================



new JogoDaVelha()