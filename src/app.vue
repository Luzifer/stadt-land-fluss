<template>
  <div class="container my-3">
    <div class="row mb-4">
      <div class="col text-center">
        <h1>Stadt-Land-Fluss</h1>
      </div>
    </div>

    <div class="row mb-4 d-flex justify-content-center">
      <div class="col-6 text-center">
        <div class="input-group input-group-sm">
          <span class="input-group-text">
            <i class="fas fa-user fa-fw" />
          </span>
          <input
            v-model="name"
            type="text"
            class="form-control"
            @keypress.enter="broadcastName"
          >
          <button
            class="btn btn-success"
            @click="broadcastName"
          >
            <i class="fas fa-pencil fa-fw me-1" />
            Name ändern
          </button>
          <button
            class="btn btn-warning"
            @click="newGame"
          >
            <i class="fas fa-broom fa-fw me-1" />
            Neues Spiel
          </button>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <table class="table">
          <thead>
            <tr>
              <th class="text-center">
                <button
                  class="btn btn-sm btn-success"
                  @click="addLetter"
                >
                  <i class="fas fa-plus fa-fw" />
                </button>
              </th>
              <th
                v-for="cat in gameState.categories"
                :key="cat"
                class="text-center align-content-center"
              >
                {{ cat }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="letter in [...gameState.letters].reverse()"
              :key="`letter_${letter}`"
            >
              <th class="text-center align-content-center">
                {{ letter }}
              </th>
              <td
                v-for="cat in gameState.categories"
                :key="cat"
              >
                <template v-if="!hasOwnAnswer(cat, letter)">
                  <div class="input-group input-group-sm mt-2">
                    <input
                      v-model="localAnswers[generateKey(cat, letter)]"
                      type="text"
                      class="form-control"
                      @keypress.enter="answerFieldSubmit(cat, letter)"
                    >
                    <button
                      v-if="!localAnswers[generateKey(cat, letter)]"
                      class="btn btn-warning"
                      @click="answerFieldSubmit(cat, letter)"
                    >
                      <i class="fas fa-forward fa-fw" />
                    </button>
                    <button
                      v-else
                      class="btn btn-success"
                      @click="answerFieldSubmit(cat, letter)"
                    >
                      <i class="fas fa-play fa-fw" />
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div
                    v-for="answer in answersGiven[generateKey(cat, letter)]"
                    :key="answer.name"
                    class="card mb-2 mt-2"
                  >
                    <div class="card-body">
                      <small class="answer-name">{{ answer.name }}</small>
                      <p
                        v-if="answer.answer"
                        class="my-0"
                      >
                        {{ answer.answer }}
                      </p>
                      <p
                        v-else-if="answer.answer === undefined"
                        class="my-0 text-center"
                      >
                        <i class="fa-solid fa-circle-notch fa-spin" />
                      </p>
                      <p
                        v-else
                        class="my-0 text-center"
                      >
                        <i class="fas fa-forward fa-fw" />
                      </p>
                    </div>
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { categories, gameSocketTemplate, instanceTimeout } from './config'
import { defineComponent } from 'vue'

const baseBackoff = 100 // ms
const maxBackoff = 10000 // ms

export default defineComponent({
  computed: {
    activeInstances(): any {
      return Object.fromEntries(Object.entries(this.knownInstances)
        .filter((e: any[]) => this.now.getTime() - e[1].lastActive < instanceTimeout))
    },

    answersGiven(): Object {
      const keys: string[] = []
      for (const cat of this.gameState.categories) {
        for (const letter of this.gameState.letters) {
          keys.push(this.generateKey(cat, letter))
        }
      }

      return Object.fromEntries(keys.map(key => [
        key, Object.keys(this.activeInstances).map(instId => ({
          answer: this.activeInstances[instId].answers[key],
          name: this.activeInstances[instId].name,
        })),
      ]))
    },
  },

  created(): void {
    let instance = window.localStorage.getItem('io.luzifer.stadt-land-fluss.instance')
    if (!instance) {
      instance = window.crypto.randomUUID()
      window.localStorage.setItem('io.luzifer.stadt-land-fluss.instance', instance)
    }
    this.instance = instance
    this.name = window.localStorage.getItem('io.luzifer.stadt-land-fluss.name') || instance

    this.knownInstances[this.instance] = {
      answers: {},
      lastActive: new Date().getTime(),
      name: this.name,
    }
  },

  data(): any {
    return {
      backoffCurrent: baseBackoff,
      gameId: '',
      gameSocket: null as WebSocket | null,
      gameState: {
        categories: [],
        gameId: '',
        letters: [],
        version: 0,
      },

      instance: '',
      knownInstances: {} as any,
      localAnswers: {} as any,
      name: '',
      now: new Date(),
    }
  },

  methods: {
    addLetter(): void {
      this.gameState = {
        ...this.gameState,
        letters: [...this.gameState.letters, this.generateLetter()],
        version: new Date().getTime(),
      }
      this.broadcastGameState()
    },

    answerFieldSubmit(category: string, letter: string): void {
      this.sendAnswer(category, letter, this.localAnswers[this.generateKey(category, letter)] || '')
    },

    broadcastGameState(): void {
      this.sendMessage({ state: this.gameState, type: 'state' })
    },

    broadcastName(): void {
      window.localStorage.setItem('io.luzifer.stadt-land-fluss.name', this.name)
      this.knownInstances[this.instance].name = this.name
      this.sendPing()
    },

    connectToGame(): void {
      if (this.gameSocket) {
        this.gameSocket.close()
        this.gameSocket = null
      }

      this.gameSocket = new WebSocket(gameSocketTemplate.replace('{gameId}', this.gameId))

      this.gameSocket.addEventListener('close', () => {
        this.backoffCurrent = Math.min(maxBackoff, this.backoffCurrent * 1.5)
        window.setTimeout(() => this.connectToGame(), this.backoffCurrent)
      })

      this.gameSocket.addEventListener('open', () => {
        this.sendMessage({ type: 'ohai' })
      })

      this.gameSocket.addEventListener('message', (evt: MessageEvent) => this.handleMessage(evt))
    },

    generateKey(category: string, letter: string): string {
      return [
        category.toLocaleLowerCase().replace(/[^a-z0-9]/g, '-'),
        letter.toLocaleLowerCase(),
      ].join('::')
    },

    generateLetter(): string {
      const letterSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
        .filter(l => !this.gameState.letters.includes(l))

      if (letterSet.length === 0) {
        throw new Error('no more letter available')
      }

      return this.shuffle(letterSet)[0]
    },

    handleMessage(evt: MessageEvent): void {
      const data: any = JSON.parse(evt.data)

      switch (data.type) {
      case 'answer':
        this.knownInstances[data.instance].answers[data.key] = data.answer
        break

      case 'ohai':
        this.sendPing()
        this.broadcastGameState()
        break

      case 'ping':
        this.backoffCurrent = baseBackoff
        this.knownInstances[data.instance] = data.instanceState
        break

      case 'state':
        if (data.state.version < this.gameState.version) {
          return
        }

        this.gameState = data.state
        window.localStorage.setItem('io.luzifer.stadt-land-fluss.state', JSON.stringify(this.gameState))
        break

      default:
        console.error(`received unhandled message: ${data.type}`)
      }
    },

    hasOwnAnswer(category: string, letter: string): boolean {
      return this.knownInstances[this.instance]
        ?.answers[this.generateKey(category, letter)] !== undefined
    },

    newGame(): void {
      window.location.href = window.location.href.split('#')[0]
    },

    sendAnswer(category: string, letter: string, answer: string): void {
      this.knownInstances[this.instance].answers[this.generateKey(category, letter)] = answer
      this.sendPing()
    },

    sendMessage(data: any): void {
      if (!this.gameSocket) {
        return
      }

      this.gameSocket.send(JSON.stringify({
        ...data,
        instance: this.instance,
      }))
    },

    sendPing(): void {
      this.sendMessage({ instanceState: {
        ...this.knownInstances[this.instance],
        lastActive: new Date().getTime(),
      }, type: 'ping' })
    },

    shuffle(list: Array<any>): Array<any> {
      let currentIndex = list.length

      // While there remain elements to shuffle...
      while (currentIndex !== 0) {
        // Pick a remaining element...
        const randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--;

        // And swap it with the current element.
        [list[currentIndex], list[randomIndex]] = [list[randomIndex], list[currentIndex]]
      }

      return list
    },
  },

  mounted() {
    const gameInfo: string = window.location.hash.substring(1)

    // No game-id found, redirect to new game
    if (gameInfo === '') {
      const appBase: string = window.location.href.split('#')[0]
      window.location.href = `${appBase}#${window.crypto.randomUUID()}:${this.instance}`
      window.location.reload()
      return
    }

    const gameId: string = gameInfo.split(':')[0]
    const creator: string = gameInfo.split(':')[1]

    const state: any = JSON.parse(window.localStorage.getItem('io.luzifer.stadt-land-fluss.state') || '{}')

    if (state.gameId === gameId) {
      this.gameState = state
    } else if (this.instance === creator) {
      this.gameState = {
        categories: this.shuffle([...categories]).slice(0, 5),
        gameId,
        letters: [this.generateLetter()],
        version: new Date().getTime(),
      }
    }

    // Game-ID found, register on socket
    this.gameId = gameId
    this.connectToGame()

    window.setInterval(() => this.sendPing(), 10000)
    window.setInterval(() => {
      this.now = new Date()
    }, 1000)
  },

  name: 'StadtLandFlussApp',
})
</script>

<style scoped>
  .answer-name {
    position: absolute;
    top: -0.6rem;
    right: 10px;
  }
</style>
