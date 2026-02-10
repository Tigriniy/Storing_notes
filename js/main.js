const app = new Vue({
    el: '#app',
    data() {
        return {
            column1: [],
            column2: [],
            column3: [],
            showModal: false,
            newCard: {
                title: '',
                items: ['', '', '']
            }
        }
    },
    computed: {
        isColumn1Locked() {

            if (this.column2.length >= 5) {
                return this.column1.some(card => {
                    const completed = card.items.filter(item => item.completed).length;
                    return completed / card.items.length > 0.5;
                });
            }
            return false;
        }
    },
    methods: {
        loadCards() {
            const saved = localStorage.getItem('notesApp');
            if (saved) {
                const data = JSON.parse(saved);
                this.column1 = data.column1 || [];
                this.column2 = data.column2 || [];
                this.column3 = data.column3 || [];
            }
        },
        saveCards() {
            const data = {
                column1: this.column1,
                column2: this.column2,
                column3: this.column3
            };
            localStorage.setItem('notesApp', JSON.stringify(data));
        },
        openAddModal() {
            if (this.isColumn1Locked) {
                alert('Столбец 1 заблокирован! Дождитесь освобождения места в столбце 2.');
                return;
            }

            if (this.column1.length >= 3) {
                alert('Первый столбец заполнен (максимум 3 карточки)');
                return;
            }

            this.showModal = true;
            this.newCard = {
                title: '',
                items: ['', '', '']
            };
        },
        closeModal() {
            this.showModal = false;
        },
        addItem() {
            if (this.newCard.items.length < 5) {
                this.newCard.items.push('');
            }
        },
        removeItem(index) {
            if (this.newCard.items.length > 3) {
                this.newCard.items.splice(index, 1);
            }
        },
        saveCard() {
            if (!this.newCard.title.trim()) {
                alert('Введите заголовок');
                return;
            }

            const validItems = this.newCard.items.filter(item => item.trim());
            if (validItems.length < 3) {
                alert('Должно быть минимум 3 пункта');
                return;
            }

            if (this.column1.length >= 3) {
                alert('Первый столбец заполнен (максимум 3 карточки)');
                return;
            }

            if (this.isColumn1Locked) {
                alert('Столбец 1 заблокирован! Дождитесь освобождения места в столбце 2.');
                return;
            }

            const card = {
                id: Date.now(),
                title: this.newCard.title.trim(),
                items: validItems.map(text => ({
                    text: text.trim(),
                    completed: false
                })),
                completedAt: null
            };

            this.column1.push(card);
            this.saveCards();
            this.closeModal();
        },
        toggleItem(card, index) {
            card.items[index].completed = !card.items[index].completed;
            this.checkCardProgress(card);
        },
        checkCardProgress(card) {
            const total = card.items.length;
            const completed = card.items.filter(item => item.completed).length;
            const percentage = (completed / total) * 100;

            if (this.column1.includes(card) && percentage > 50) {
                if (this.column2.length < 5) {
                    this.moveCard(card, 'column1', 'column2');
                }
            }

            if (this.column2.includes(card) && percentage === 100) {
                card.completedAt = new Date();
                this.moveCard(card, 'column2', 'column3');
            }

            this.saveCards();
        },
        moveCard(card, from, to) {
            const index = this[from].findIndex(c => c.id === card.id);
            if (index !== -1) {
                const [movedCard] = this[from].splice(index, 1);
                this[to].push(movedCard);
            }
        },
        formatDate(date) {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleString('ru-RU');
        }
    },
    mounted() {
        this.loadCards();
    },
    template: `
        <div class="app">
            <h1>Система заметок</h1>
            
            <div class="columns">
                <div class="column" :class="{ locked: isColumn1Locked }">
                    <h2>Столбец 1 (макс. 3)</h2>
                    <div class="cards">
                        <div v-for="card in column1" :key="card.id" class="card">
                            <h3>{{ card.title }}</h3>
                            <ul class="items">
                                <li v-for="(item, index) in card.items" :key="index">
                                    <label>
                                        <input type="checkbox" 
                                               :checked="item.completed"
                                               @change="toggleItem(card, index)">
                                        <span :class="{ completed: item.completed }">{{ item.text }}</span>
                                    </label>
                                </li>
                            </ul>
                            <div class="progress">
                                Выполнено: {{ card.items.filter(i => i.completed).length }}/{{ card.items.length }}
                                ({{ Math.round((card.items.filter(i => i.completed).length / card.items.length) * 100) }}%)
                            </div>
                        </div>
                    </div>
                    <button @click="openAddModal" 
                            :disabled="column1.length >= 3 || isColumn1Locked">
                        Добавить карточку
                    </button>
                    <div v-if="isColumn1Locked" class="lock-msg">
                        Столбец заблокирован! В столбце 2 максимальное количество карточек.
                    </div>
                </div>
                
                <div class="column">
                    <h2>Столбец 2 (макс. 5)</h2>
                    <div class="cards">
                        <div v-for="card in column2" :key="card.id" class="card">
                            <h3>{{ card.title }}</h3>
                            <ul class="items">
                                <li v-for="(item, index) in card.items" :key="index">
                                    <label>
                                        <input type="checkbox" 
                                               :checked="item.completed"
                                               @change="toggleItem(card, index)">
                                        <span :class="{ completed: item.completed }">{{ item.text }}</span>
                                    </label>
                                </li>
                            </ul>
                            <div class="progress">
                                Выполнено: {{ card.items.filter(i => i.completed).length }}/{{ card.items.length }}
                                ({{ Math.round((card.items.filter(i => i.completed).length / card.items.length) * 100) }}%)
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="column">
                    <h2>Столбец 3 (завершенные)</h2>
                    <div class="cards">
                        <div v-for="card in column3" :key="card.id" class="card completed">
                            <h3>{{ card.title }}</h3>
                            <ul class="items">
                                <li v-for="(item, index) in card.items" :key="index" class="completed">
                                    <input type="checkbox" checked disabled>
                                    <span>{{ item.text }}</span>
                                </li>
                            </ul>
                            <div class="progress">Выполнено: 100%</div>
                            <div class="date">Завершено: {{ formatDate(card.completedAt) }}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Новая карточка (добавляется в Столбец 1)</h3>
                        <button @click="closeModal" class="close" aria-label="Закрыть">
                            Закрыть
                        </button>
                    </div>
                    <div class="modal-body">
                        <div>
                            <label>Заголовок:</label>
                            <input v-model="newCard.title" placeholder="Введите заголовок">
                        </div>
                        <div>
                            <label>Пункты (3-5):</label>
                            <div v-for="(item, index) in newCard.items" :key="index" class="item-input">
                                <input v-model="newCard.items[index]" :placeholder="'Пункт ' + (index + 1)">
                                <button @click="removeItem(index)" 
                                        :disabled="newCard.items.length <= 3">-</button>
                            </div>
                            <button @click="addItem" 
                                    :disabled="newCard.items.length >= 5">+ Добавить пункт</button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="saveCard" class="save">Сохранить в Столбец 1</button>
                        <button @click="closeModal" class="cancel">Отмена</button>
                    </div>
                </div>
            </div>
        </div>
    `
});
