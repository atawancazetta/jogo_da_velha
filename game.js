// ======================================================
// ELEMENTOS DO DOM
// ======================================================



const casas = document.querySelectorAll('.casa')
const botaoIniciar = document.getElementById('btnIniciar')
const inputPlayer1 = document.getElementById('player1')
const inputPlayer2 = document.getElementById('player2')
const consoleGame = document.getElementById('console')



// ======================================================
// CLASSE PRINCIPAL
// ======================================================



class JogoDaVelha {

    constructor() {

        this.combinacoesVitoria = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ]

        this.turno = 'X'
        this.jogoAtivo = false
        this.jogador1 = ''
        this.jogador2 = ''

        this.iniciarEventos()
    }



    // ======================================================
    // EVENTOS
    // ======================================================



    iniciarEventos() {

        casas.forEach(casa => {
            casa.addEventListener('click', (evento) => {
                this.marcarCasa(evento.target)
            })
        })

        botaoIniciar.addEventListener('click', () => {
            this.controlarBotaoPrincipal()
        })
    }



    // ======================================================
    // BOTÃO INICIAR / REINICIAR
    // ======================================================



    controlarBotaoPrincipal() {

        if (this.jogoAtivo) {
            this.reiniciarPartida()
            return
        }

        this.iniciarPartida()
    }



    iniciarPartida() {

        this.jogador1 = inputPlayer1.value.trim()
        this.jogador2 = inputPlayer2.value.trim()

        if (this.jogador1 === '' || this.jogador2 === '') {
            this.escrever('Digite o nome dos dois jogadores.')
            return
        }

        this.limparTabuleiro()

        this.turno = 'X'
        this.jogoAtivo = true

        botaoIniciar.textContent = 'Reiniciar'

        this.escrever(`Vez de ${this.jogador1} (X)`)
    }



    reiniciarPartida() {

        this.limparTabuleiro()

        this.turno = 'X'
        this.jogoAtivo = true

        this.escrever(`Vez de ${this.jogador1} (X)`)
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
        this.mostrarTurnoAtual()
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

        const vencedor =
            this.turno === 'X'
                ? this.jogador1
                : this.jogador2

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

        const jogadorAtual =
            this.turno === 'X'
                ? this.jogador1
                : this.jogador2

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