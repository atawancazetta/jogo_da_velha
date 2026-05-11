// Lógica central da campanha contra IA

const boardCells = document.querySelectorAll('.casa');
const statusDisplay = document.getElementById('console');
const playerNameInput = document.getElementById('player1');

const telaLogin = document.getElementById('tela-login');
const telaJogo = document.getElementById('tela-jogo');

const btnLogar = document.getElementById('btnLogar');
const btnStartGame = document.getElementById('btnIrParaJogo');
const btnVoltarMenu = document.getElementById('btnVoltarMenu');
const selectSimbolo = document.getElementById('select-simbolo');

const modalFase = document.getElementById('modal-fase');
const btnAcaoModal = document.getElementById('btnAcaoModal');
const btnResetarCarreira = document.getElementById('btnResetarCarreira');
const modalTitle = document.getElementById('modal-titulo');
const modalMessage = document.getElementById('modal-mensagem');
const modalAttempts = document.getElementById('modal-tentativas');

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
        this.tipoDesafio = 'progressao';
        this.simboloHumano = 'X';

        this.vitoriasP1 = 0;
        this.vitoriasP2 = 0;
        this.empates = 0;

        this.nivelCarreira = 0;
        this.vitoriasIA = 0;
        this.tentativas = 3;

        this.carregarProgresso();
        this.iniciarEventos()
    }

    /* Listeners de clique e botões do sistema */
    iniciarEventos() {
        boardCells.forEach(casa => {
            casa.addEventListener('click', (evento) => {
                this.marcarCasa(evento.target)
            })
        })

        btnLogar.addEventListener('click', () => this.validarLogin());
        btnStartGame.addEventListener('click', () => this.iniciarPartida());
        btnVoltarMenu.addEventListener('click', () => location.reload());
        btnAcaoModal.addEventListener('click', () => this.processarAcaoModal());
        btnResetarCarreira.addEventListener('click', () => this.reiniciarCarreiraDoZero());
    }

    mudarTela(telaAlvo) {
        [telaLogin, telaJogo].forEach(t => t.classList.add('hidden'));
        telaAlvo.classList.remove('hidden');
        if(telaAlvo === telaJogo) telaAlvo.style.display = 'flex';
    }

    /* Recupera os dados salvos do jogador */
    carregarProgresso() {
        const salvo = localStorage.getItem('jogodavelha_progresso');
        if (salvo) {
            const dados = JSON.parse(salvo);
            this.nivelCarreira = dados.nivel || 0;
            this.vitoriasIA = dados.vitorias || 0;
            this.tentativas = dados.tentativas !== undefined ? dados.tentativas : 3;
        }
        this.atualizarInterfaceCarreira();
    }

    /* Grava o progresso atual no localStorage */
    salvarProgresso() {
        const dados = {
            nivel: this.nivelCarreira,
            vitorias: this.vitoriasIA,
            tentativas: this.tentativas
        };
        localStorage.setItem('jogodavelha_progresso', JSON.stringify(dados));
    }

    /* Verifica se os dados de acesso são válidos */
    validarLogin() {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        
        if (user.length > 3 && pass.length > 3) {
            this.jogador1 = user;
            this.mudarTela(telaJogo);
        } else {
            document.getElementById('console-login').textContent = "Usuário/Senha muito curtos.";
        }
    }

    /* Prepara o tabuleiro para uma nova partida */
    iniciarPartida() {
        this.jogador1 = playerNameInput.value.trim() || this.jogador1 || "Jogador";
        this.simboloHumano = selectSimbolo.value;

        const niveis = ['facil', 'medio', 'dificil'];
        this.dificuldade = niveis[this.nivelCarreira];

        this.atualizarInterfaceCarreira();
        this.jogador2 = `IA (${this.dificuldade.toUpperCase()})`;

        this.atualizarLabelsPlacar();
        this.limparTabuleiro();
        
        this.turno = 'X';
        this.jogoAtivo = true;
        this.mudarTela(telaJogo);
        this.mostrarTurnoAtual();

        if (this.simboloHumano === 'O') {
            this.fazerJogadaIA();
        }
    }

    atualizarLabelsPlacar() {
        document.getElementById('label-p1').textContent = this.jogador1;
        document.getElementById('label-p2').textContent = this.jogador2;
        document.getElementById('score-p1').textContent = this.vitoriasP1;
        document.getElementById('score-p2').textContent = this.vitoriasP2;
        document.getElementById('score-empate').textContent = this.empates;
    }

    /* Sincroniza visualmente os níveis e as vidas */
    atualizarInterfaceCarreira() {
        const badges = ['badge-facil', 'badge-medio', 'badge-dificil'];
        badges.forEach((id, index) => {
            const el = document.getElementById(id);
            el.classList.remove('bloqueado', 'atual');
            if (index > this.nivelCarreira) el.classList.add('bloqueado');
            if (index === this.nivelCarreira) el.classList.add('atual');
        });

        const vidasIndicator = document.getElementById('vidas-indicator');
        vidasIndicator.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const span = document.createElement('span');
            span.className = i < this.tentativas ? 'coracao' : 'coracao perdido';
            span.textContent = '❤️';
            vidasIndicator.appendChild(span);
        }

        const stats = document.getElementById('stats-carreira');
        const descNivel = ['Fácil', 'Médio', 'Difícil'][this.nivelCarreira];
        stats.textContent = `Fase ${this.nivelCarreira + 1}: ${descNivel} | Vitórias IA: ${this.vitoriasIA}`;
    }

    /* Controla o modal de fim de jogo */
    mostrarModal(tipo) {
        const niveis = ['Fácil', 'Médio', 'Difícil'];
        const progressoContainer = document.getElementById('modal-progresso-container');
        const modalContent = document.querySelector('.modal-content');
        
        modalFase.classList.remove('hidden');
        modalContent.classList.remove('derrota');
        btnResetarCarreira.classList.add('hidden');
        modalAttempts.textContent = '';
        
        if (tipo === 'vitoria') {
            document.getElementById('modal-icon').textContent = '🏆';
            modalTitle.textContent = 'Fase Concluída!';
            modalMessage.textContent = `Você superou o nível ${niveis[this.nivelCarreira]}.`;
            
            if (this.nivelCarreira < 2) {
                progressoContainer.style.display = 'flex';
                document.getElementById('fase-anterior').textContent = `Fase ${this.nivelCarreira + 1}`;
                document.getElementById('fase-proxima').textContent = `Fase ${this.nivelCarreira + 2}`;
                btnAcaoModal.textContent = 'Próxima Fase';
            } else {
                progressoContainer.style.display = 'none';
                modalTitle.textContent = 'Campanha Concluída!';
                modalMessage.textContent = 'Parabéns! Você zerou o modo IA e se tornou um mestre!';
                btnAcaoModal.textContent = 'Reiniciar Campanha';
            }
        } else if (tipo === 'derrota' || tipo === 'empate') {
            modalContent.classList.add('derrota');
            progressoContainer.style.display = 'none';
            
            if (this.tentativas > 0) {
                document.getElementById('modal-icon').textContent = tipo === 'derrota' ? '💀' : '🤝';
                modalTitle.textContent = tipo === 'derrota' ? 'Você Perdeu!' : 'Empate!';
                modalMessage.textContent = tipo === 'derrota' ? 'A IA foi melhor nesta rodada.' : 'Foi por pouco!';
                modalAttempts.textContent = `Tentativas restantes: ${this.tentativas}/3`;
                btnAcaoModal.textContent = 'Tentar Novamente';
                btnResetarCarreira.classList.remove('hidden');
            } else {
                document.getElementById('modal-icon').textContent = '👻';
                modalTitle.textContent = 'GAME OVER';
                modalMessage.textContent = 'Suas tentativas acabaram! Seu progresso foi resetado.';
                btnAcaoModal.textContent = 'Reiniciar Campanha';
            }
        }
    }

    /* Reseta toda a campanha após confirmação */
    reiniciarCarreiraDoZero() {
        if (confirm("Isso apagará seu progresso e voltará para a Fase 1. Tem certeza?")) {
            modalFase.classList.add('hidden');
            this.nivelCarreira = 0;
            this.vitoriasIA = 0;
            this.vitoriasP1 = 0;
            this.vitoriasP2 = 0;
            this.empates = 0;
            this.tentativas = 3;
            this.salvarProgresso();
            this.iniciarPartida();
        }
    }

    /* Lógica dos botões dentro do modal */
    processarAcaoModal() {
        modalFase.classList.add('hidden');
        
        if (btnAcaoModal.textContent === 'Próxima Fase') {
            this.nivelCarreira++;
            this.tentativas = 3;
            this.salvarProgresso();
            this.iniciarPartida();
        } else if (btnAcaoModal.textContent === 'Reiniciar Campanha') {
            this.nivelCarreira = 0; this.vitoriasIA = 0; this.tentativas = 3;
            this.salvarProgresso();
            this.iniciarPartida();
        } else {
            this.iniciarPartida();
        }
    }

    /* Lógica de jogada da máquina conforme o nível */
    fazerJogadaIA() {
        if (!this.jogoAtivo) return;
        
        let index;
        const casasLivres = [...boardCells].filter(c => c.textContent === '').map(c => parseInt(c.dataset.index));

        if (this.dificuldade === 'facil') {
            index = casasLivres[Math.floor(Math.random() * casasLivres.length)];
        } else if (this.dificuldade === 'medio') {
            index = this.buscarMelhorLance() ?? casasLivres[Math.floor(Math.random() * casasLivres.length)];
        } else {
            index = this.minimax(this.getEstadoTabuleiro(), this.turno).index;
        }

        setTimeout(() => this.marcarCasa(boardCells[index]), 500);
    }

    /* Procura lances imediatos de vitória ou bloqueio */
    buscarMelhorLance() {
        const simbolos = [this.turno, this.turno === 'X' ? 'O' : 'X'];
        for (let s of simbolos) {
            for (let comb of this.combinacoesVitoria) {
                const valores = comb.map(i => boardCells[i].textContent);
                if (valores.filter(v => v === s).length === 2 && valores.includes('')) {
                    return comb[valores.indexOf('')];
                }
            }
        }
        return null;
    }

    reiniciarPartida() {
        this.iniciarPartida();
    }

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

        if (this.jogoAtivo && this.turno !== this.simboloHumano) {
            this.fazerJogadaIA();
        }
    }

    // Algoritmo Minimax para dificuldade Imbatível
    getEstadoTabuleiro() {
        return [...boardCells].map(c => c.textContent);
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

    /* Validações de fim de jogo */
    existeVencedor() {
        for (let combinacao of this.combinacoesVitoria) {
            const [a, b, c] = combinacao
            const valorA = boardCells[a].textContent
            const valorB = boardCells[b].textContent
            const valorC = boardCells[c].textContent

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
        for (let casa of boardCells) {
            if (casa.textContent === '') {
                return false
            }
        }
        return true
    }

    finalizarComVitoria() {
        this.jogoAtivo = false
        const venceuP1 = this.turno === this.simboloHumano;
        
        if (venceuP1) {
            this.vitoriasP1++;
            this.escrever(`🏆 Vitória de ${this.jogador1}!`);
            this.vitoriasIA++;
            this.mostrarModal('vitoria');
        } else {
            this.vitoriasP2++;
            this.escrever(`🏆 Vitória de ${this.jogador2}!`);
            this.tentativas--;
            this.atualizarInterfaceCarreira();
            this.mostrarModal('derrota');
        }
        this.atualizarLabelsPlacar();
        this.salvarProgresso();
    }

    finalizarComEmpate() {
        this.jogoAtivo = false
        this.empates++;
        this.atualizarLabelsPlacar();
        this.escrever('🤝 Deu empate!')
        this.tentativas--;
        this.atualizarInterfaceCarreira();
        this.mostrarModal('empate');
        this.salvarProgresso();
    }
    alternarTurno() {
        this.turno = this.turno === 'X' ? 'O' : 'X'
    }
    mostrarTurnoAtual() {
        const nomeAtual = this.turno === this.simboloHumano ? this.jogador1 : this.jogador2;
        this.escrever(`Vez de: ${nomeAtual} (${this.turno})`);
    }
    destacarCasasVencedoras(a, b, c) {
        [a, b, c].forEach(idx => {
            boardCells[idx].classList.add('vencedora')
        })
    }
    limparTabuleiro() {
        boardCells.forEach(casa => {
            casa.textContent = ''
            casa.classList.remove('vencedora')
        })
    }
    escrever(mensagem) {
        statusDisplay.textContent = mensagem
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new JogoDaVelha();
});