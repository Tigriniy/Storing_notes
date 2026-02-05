const app = new Vue({
    el: '#app',
    data: {
        column1: [],
        column2: [],
        column3: [],
        showModal: false,
        currentColumn: null,
        newCardTitle: ''
    },
    methods: {
        openModal(column) {
            this.currentColumn = column;
            this.showModal = true;
            this.newCardTitle = '';
        },

        closeModal() {
            this.showModal = false;
            this.currentColumn = null;
        },

        addCard() {
            if (this.newCardTitle.trim() && this.currentColumn) {
                const card = {
                    id: Date.now(),
                    title: this.newCardTitle.trim(),
                    items: []
                };

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