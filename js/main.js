let eventBus = new Vue()

Vue.component('note-card', {
    props: ['card', 'columntype', 'iscompleted'],
    template: `
        <div class="card" :class="{ completed: iscompleted }">
            <h3>{{ card.title }}</h3>
            
            <ul class="items">
                <li v-for="(item, index) in card.items" :key="index">
                    <label>
                        <input 
                            type="checkbox" 
                            :checked="item.completed"
                            :disabled="iscompleted && columntype === 'column3'"
                            @change="$emit('toggle', {cardId: card.id, columntype, index})"
                        >
                        <span :class="{ completed: item.completed }">
                            {{ item.text }}
                        </span>
                    </label>
                </li>
            </ul>
            
            <div class="progress">
                Выполнено: {{ doneCount }}/{{ card.items.length }}
                ({{ Math.round((doneCount / card.items.length) * 100) }}%)
            </div>
            
            <div v-if="card.completedAt" class="date">
                Завершено: {{ new Date(card.completedAt).toLocaleString('ru-RU') }}
            </div>
        </div>
    `,
    computed: {
        doneCount() {
            return this.card.items.filter(item => item.completed).length
        }
    }
})

Vue.component('note-column', {
    props: ['cards', 'title', 'columntype', 'maxcards', 'islocked', 'iscompleted'],
    template: `
        <div class="column" :class="{ locked: islocked }">
            <h2>{{ title }}</h2>
            
            <div class="cards">
                <note-card
                    v-for="card in cards"
                    :key="card.id"
                    :card="card"
                    :columntype="columntype"
                    :iscompleted="iscompleted"
                    @toggle="$emit('toggle', $event)"
                />
            </div>
            
            <button 
                v-if="columntype === 'column1'"
                @click="$emit('add')"
                :disabled="cards.length >= maxcards || islocked"
                class="add-btn"
            >
                Добавить карточку
            </button>
            
            <div v-if="islocked" class="lock-msg">
                Столбец заблокирован!
            </div>
        </div>
    `
})

Vue.component('add-modal', {
    template: `
        <div class="modal-overlay" @click.self="$emit('close')">
            <div class="modal">
                <div class="modal-header">
                    <h3>Новая карточка</h3>
                    <button @click="$emit('close')" class="close">Закрыть</button>
                </div>
                
                <div class="modal-body">
                    <div>
                        <label>Заголовок:</label>
                        <input type="text" v-model="title" placeholder="Введите заголовок">
                    </div>
                    
                    <div>
                        <label>Пункты (3-5):</label>
                        <div v-for="(item, index) in items" :key="index" class="item-input">
                            <input type="text" v-model="items[index]" :placeholder="'Пункт ' + (index + 1)">
                            <button @click="removeItem(index)" :disabled="items.length <= 3">-</button>
                        </div>
                        
                        <button @click="addItem" :disabled="items.length >= 5">+ Добавить пункт</button>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button @click="save" class="save">Сохранить</button>
                    <button @click="$emit('close')" class="cancel">Отмена</button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            title: '',
            items: ['', '', '']
        }
    },
    methods: {
        addItem() {
            if (this.items.length <5) this.items.push('')
        },
        removeItem(index) {
            if (this.items.length > 3) this.items.splice(index, 1)
        },
        save() {
            if (!this.title.trim()) {
                alert('Введите заголовок')
                return
            }

            const validItems = this.items.filter(item => item.trim())
            if (validItems.length < 3) {
                alert('Должно быть минимум 3 пункта')
                return
            }

            eventBus.$emit('save-card', {
                title: this.title,
                items: this.items
            })

            this.title = ''
            this.items = ['', '', '']
            this.$emit('close')
        }
    }
})

const app = new Vue({
    el: '#app',
    data() {
        return {
            column1: [],
            column2: [],
            column3: [],
            showModal: false,
            waitingQueue: []
        }
    },
        computed: {
            isColumn1Locked() {
                if (this.column2.length >= 5) {
                    return this.column1.some(card => {
                        const done = card.items.filter(item => item.completed).length
                        return done / card.items.length >= 0.5
                    })
                }
                return false
            }
        },

        methods: {
            loadCards() {
                const saved = localStorage.getItem('notesApp')
                if (saved) {
                    try {
                        const data = JSON.parse(saved)
                        this.column1 = Array.isArray(data.column1) ? data.column1 : []
                        this.column2 = Array.isArray(data.column2) ? data.column2 : []
                        this.column3 = Array.isArray(data.column3) ? data.column3 : []
                        this.waitingQueue = Array.isArray(data.waitingQueue) ? data.waitingQueue : []
                    } catch {
                        this.column1 = []
                        this.column2 = []
                        this.column3 = []
                        this.waitingQueue = []
                    }
                }
            },

            saveCards() {
                const data = {
                    column1: this.column1,
                    column2: this.column2,
                    column3: this.column3,
                    waitingQueue: this.waitingQueue
                }
                localStorage.setItem('notesApp', JSON.stringify(data))
            },

            openAddModal() {
                if (this.isColumn1Locked) {
                    alert('Столбец 1 заблокирован!')
                    return
                }
                if (this.column1.length >= 3) {
                    alert('Первый столбец заполнен')
                    return
                }
                this.showModal = true
            },

            closeModal() {
                this.showModal = false
            },

            saveNewCard(cardData) {
                const card = {
                    id: Date.now(),
                    title: cardData.title.trim(),
                    items: cardData.items
                        .filter(item => item.trim())
                        .map(text => ({
                            text: text.trim(),
                            completed: false
                        })),
                    completedAt: null
                }

                this.column1.push(card)
                this.saveCards()
            },

            toggleItem(event) {
                const {cardId, columntype, index} = event

                const column = this[columntype]
                const card = column.find(c => c.id === cardId)

                if (card && card.items[index]) {
                    card.items[index].completed = !card.items[index].completed

                    this.checkProgress(card, columntype)
                    this.saveCards()
                }
            },

            checkProgress(card, fromColumn) {
                const total = card.items.length
                const done = card.items.filter(item => item.completed).length
                const percent = (done / total) * 100


                if (fromColumn === 'column2' && percent < 50) {

                    if (this.column1.length < 3) {
                        this.moveCard(card, 'column2', 'column1')
                    } else {
                        alert('Первый столбец заполнен! Карточка остаётся во втором столбце.')
                    }
                    return
                }

                if (fromColumn === 'column1' && percent >= 50) {
                    if (this.column2.length < 5) {
                        this.moveCard(card, 'column1', 'column2')
                    } else {

                        if (!this.waitingQueue.some(c => c.id === card.id)) {
                            this.waitingQueue.push({...card})
                        }
                    }
                    return
                }

                if (fromColumn === 'column2' && percent === 100) {
                    card.completedAt = new Date()
                    this.moveCard(card, 'column2', 'column3')
                }
            },

            moveCard(card, from, to) {
                const fromIndex = this[from].findIndex(c => c.id === card.id)
                if (fromIndex > -1) {
                    const moved = this[from].splice(fromIndex, 1)[0]

                    if (to === 'column2' && this.waitingQueue.length > 0) {
                        const nextCard = this.waitingQueue.shift()
                        const existingCard = this.column1.find(c => c.id === nextCard.id)
                        if (existingCard) {
                            this.moveCard(existingCard, 'column1', 'column2')
                        }
                    }

                    this[to].push(moved)
                }
            },

            checkWaitingQueue() {
                while (this.column2.length < 5 && this.waitingQueue.length > 0) {
                    const nextCard = this.waitingQueue.shift()
                    const existingCard = this.column1.find(c => c.id === nextCard.id)
                    if (existingCard) {
                        const done = existingCard.items.filter(item => item.completed).length
                        const percent = (done / existingCard.items.length) * 100

                        if (percent >= 50) {

                            if (this.column1.length > 1) {
                                this.moveCard(existingCard, 'column1', 'column2')
                            }
                        }
                    }
                }
            }
        },

        watch: {
            'column2.length': function (newVal, oldVal) {
                if (newVal < oldVal) {

                    this.checkWaitingQueue()
                }
            }
        },

        mounted() {
            this.loadCards()

            eventBus.$on('save-card', this.saveNewCard)
        },

        template: `
        <div class="app">
            <h1>Система заметок</h1>
            
            <div class="columns">
                <note-column
                    :cards="column1"
                    title="Столбец 1 (макс. 3)"
                    columntype="column1"
                    :maxcards="3"
                    :islocked="isColumn1Locked"
                    @add="openAddModal"
                    @toggle="toggleItem"
                />

                <note-column
                    :cards="column2"
                    title="Столбец 2 (макс. 5)"
                    columntype="column2"
                    :maxcards="5"
                    @toggle="toggleItem"
                />
                
                <note-column
                    :cards="column3"
                    title="Столбец 3 (завершенные)"
                    columntype="column3"
                    :iscompleted="true"
                />
            </div>
            
            <add-modal
                v-if="showModal"
                @close="closeModal"
            />
            
            <div v-if="waitingQueue.length > 0" class="queue-indicator">
                В очереди: {{ waitingQueue.length }} карточек
            </div>
        </div>
    `
})
