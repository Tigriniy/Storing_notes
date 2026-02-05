const app = new Vue({
    el: '#app',
    data: {
        column1: [],
        column2: [],
        column3: [],
        showModal: false,
        currentColumn: null,
        newCardTitle: '',
        newCardItems: ['', '', ''],  // Минимум 3 пункта
        editingCard: null
    },
    methods: {
        openModal(column) {
            this.currentColumn = column;
            this.showModal = true;
            this.newCardTitle = '';
            this.newCardItems = ['', '', ''];  // Сразу 3 пустых поля
            this.editingCard = null;
        },

        closeModal() {
            this.showModal = false;
            this.currentColumn = null;
            this.editingCard = null;
        },

        addItem() {
            if (this.newCardItems.length < 5) {
                this.newCardItems.push('');
            }
        },

        removeItem(index) {
            if (this.newCardItems.length > 3) {
                this.newCardItems.splice(index, 1);
            }
        },

        saveCard() {
            // Валидация
            if (this.newCardItems.length < 3 || this.newCardItems.length > 5) {
                alert('Количество пунктов должно быть от 3 до 5');
                return;
            }

            if (this.newCardItems.some(item => !item.trim())) {
                alert('Все пункты списка должны быть заполнены');
                return;
            }

            if (this.newCardTitle.trim() && this.currentColumn) {
                const items = this.newCardItems.map(text => ({
                    text: text.trim(),
                    completed: false
                }));

                const card = {
                    id: Date.now(),
                    title: this.newCardTitle.trim(),
                    items: items
                };

                // Проверяем ограничения
                if (this.currentColumn === 'column1' && this.column1.length >= 3) {
                    alert('Первый столбец заполнен! Максимум 3 карточки.');
                    return;
                }

                if (this.currentColumn === 'column2' && this.column2.length >= 5) {
                    alert('Второй столбец заполнен! Максимум 5 карточек.');
                    return;
                }

                this[this.currentColumn].push(card);
                this.closeModal();
            }
        }
    }
});