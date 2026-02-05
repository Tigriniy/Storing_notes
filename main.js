const app = new Vue({
    el: '#app',
    data: {
         column1: [],
         column2: [],
         column3: []
     }
});

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}