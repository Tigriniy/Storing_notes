const app = new Vue({
    el: '#app',
    template: `
    <div>
        <h1>Система заметок</h1>

        <div class="columns">
            <!-- Столбец 1 -->
            <div class="column" :class="{ locked: isColumn1Locked }">
                <h2>Столбец 1 (макс. 3)</h2>
                <div class="cards">
                    <div v-for="card in column1" :key="card.id" class="card">
                        <h3>{{ card.title }}</h3>
                        <ul class="card-list">
                            <li v-for="(item, index) in card.items" :key="index"
                                :class="{ completed: item.completed }">
                                <input type="checkbox" v-model="item.completed"
                                       @change="checkCardProgress(card)">
                                <span>{{ item.text }}</span>
                            </li>
                        </ul>
                        <div class="progress">
                            Выполнено: {{ getCompleted(card) }}/{{ card.items.length }}
                            ({{ getPercentage(card) }}%)
                        </div>
                    </div>
                </div>
                <button 
                    class="add-btn" 
                    @click="openAddModal('column1')"
                    :disabled="column1.length >= 3 || isColumn1Locked"
                >
                    Добавить карточку
                </button>
                <div v-if="isColumn1Locked" class="lock-warning">
                    Столбец заблокирован! Дождитесь завершения карточки из столбца 2.
                </div>
            </div>

            <!-- Столбец 2 -->
            <div class="column">
                <h2>Столбец 2 (макс. 5)</h2>
                <div class="cards">
                    <div v-for="card in column2" :key="card.id" class="card">
                        <h3>{{ card.title }}</h3>
                        <ul class="card-list">
                            <li v-for="(item, index) in card.items" :key="index"
                                :class="{ completed: item.completed }">
                                <input type="checkbox" v-model="item.completed"
                                       @change="checkCardProgress(card)">
                                <span>{{ item.text }}</span>
                            </li>
                        </ul>
                        <div class="progress">
                            Выполнено: {{ getCompleted(card) }}/{{ card.items.length }}
                            ({{ getPercentage(card) }}%)
                        </div>
                    </div>
                </div>
                <button 
                    class="add-btn" 
                    @click="openAddModal('column2')"
                    :disabled="column2.length >= 5"
                >
                    Добавить карточку
                </button>
            </div>

            <!-- Столбец 3 -->
            <div class="column">
                <h2>Столбец 3 (завершенные)</h2>
                <div class="cards">
                    <div v-for="card in column3" :key="card.id" class="card completed-card">
                        <h3>{{ card.title }}</h3>
                        <ul class="card-list">
                            <li v-for="(item, index) in card.items" :key="index" class="completed">
                                <input type="checkbox" checked disabled>
                                <span>{{ item.text }}</span>
                            </li>
                        </ul>
                        <div class="progress">
                            Выполнено: {{ card.items.length }}/{{ card.items.length }} (100%)
                        </div>
                        <div v-if="card.completedAt" class="completed-date">
                            Завершено: {{ formatDate(card.completedAt) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Модальное окно для добавления карточки -->
        <div="modal" v-if="showModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Новая карточка</h3>
                    <button class="close-btn" @click="closeModal">x</button>
                </div>
                
                <div class="modal-body">
                    <div class="form-group">
                        <label>Заголовок карточки:</label>
                        <input type="text" v-model="newCard.title" placeholder="Введите заголовок" required>
                    </div>

                    <div class="form-group">
                        <label>Пункты списка (3-5 пунктов):</label>
                        <div v-for="(item, index) in newCard.items" :key="index" class="item-row">
                            <input 
                                type="text" 
                                v-model="newCard.items[index]" 
                                :placeholder="'Пункт ' + (index + 1)"
                                required
                            >
                            <button 
                                type="button" 
                                class="btn-remove" 
                                @click="removeItem(index)"
                                :disabled="newCard.items.length <= 3"
                            >
                                Удалить
                            </button>
                        </div>
                        
                        <button 
                            type="button" 
                            class="btn-add-item" 
                            @click="addItem"
                            :disabled="newCard.items.length >= 5"
                        >
                            Добавить пункт
                        </button>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button @click="saveCard" class="btn-save">Сохранить</button>
                    <button @click="closeModal" class="btn-cancel">Отмена</button>
                </div>
            </div>
        </div>
    </div>
`,
    data() {
        return {
            column1: [],
            column2: [],
            column3: [],
            showModal: false,
            currentColumn: null,
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
                    const completed = this.getCompleted(card);
                    return (completed / card.items.length) > 0.5;
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
        openAddModal(column) {
            if (column === 'column1' && this.isColumn1Locked) {
                alert('Первый столбец заблокирован! Дождитесь завершения карточки из второго столбца.');
                return;
            }

            this.currentColumn = column;
            this.newCard = {
                title: '',
                items: ['', '', '']
            };
            this.showModal = true;
        },
        closeModal() {
            this.showModal = false;
            this.currentColumn = null;
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
                alert('Заголовок не может быть пустым!');
                return;
            }

            if (this.newCard.items.length < 3 || this.newCard.items.length > 5) {
                alert('Количество пунктов должно быть от 3 до 5!');
                return;
            }

            if (this.newCard.items.some(item => !item.trim())) {
                alert('Все пункты списка должны быть заполнены!');
                return;
            }

            if (this.currentColumn === 'column1' && this.column1.length >= 3) {
                alert('Первый столбец заполнен! Максимум 3 карточки.');
                return;
            }

            if (this.currentColumn === 'column2' && this.column2.length >= 5) {
                alert('Второй столбец заполнен! Максимум 5 карточек.');
                return;
            }

            const card = {
                id: Date.now(),
                title: this.newCard.title.trim(),
                items: this.newCard.items.map(text => ({
                    text: text.trim(),
                    completed: false
                })),
                completedAt: null
            };

            this[this.currentColumn].push(card);
            this.closeModal();
            this.saveCards();
        },
        getCompleted(card) {
            return card.items.filter(item => item.completed).length;
        },
        getPercentage(card) {
            const total = card.items.length;
            const completed = this.getCompleted(card);
            return ((completed / total) * 100).toFixed(1);
        },
        checkCardProgress(card) {
            const percentage = parseFloat(this.getPercentage(card));

            if (this.column1.includes(card) && percentage > 50) {
                if (this.column2.length < 5) {
                    this.moveCard(card, 'column1', 'column2');
                }
            }

            if (percentage === 100) {
                if (this.column1.includes(card)) {
                    if (this.column2.length < 5) {
                        this.moveCard(card, 'column1', 'column2');
                    }
                }
                else if (this.column2.includes(card)) {
                    this.moveCard(card, 'column2', 'column3');

                    const completedCard = this.column3.find(c => c.id === card.id);
                    if (completedCard) {
                        completedCard.completedAt = new Date();
                    }
                }
            }

            this.saveCards();
        },
        moveCard(card, fromColumn, toColumn) {
            const index = this[fromColumn].findIndex(c => c.id === card.id);
            if (index === -1) return;

            const movedCard = this[fromColumn].splice(index, 1)[0];
            this[toColumn].push(movedCard);
        },
        formatDate(date) {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    },
    mounted() {
        this.loadCards();
    }
}); clas