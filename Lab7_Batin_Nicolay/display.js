const API_URL = 'api/products.json';

function displayProducts(products) {
    products.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });

    products.forEach(function (product) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.product = product.keyword;
        card.dataset.kind = product.kind;

        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="card_img">
            <p class="card_price">${product.price.toLocaleString('ru-RU')}₽</p>
            <h3 class="card_title">${product.name}</h3>
            <p class="card_count">${product.count}</p>
            <button type="button" class="card_btn">Добавить</button>
        `;

        card.querySelector('.card_btn').addEventListener('click', function () {
            selectProduct(product, card);
        });

        document.getElementById(product.category + '_catalog').append(card);
    });
}

function loadDishes() {
    fetch(API_URL)
        .then(function (response) {
            return response.json();
        })
        .then(function (products) {
            displayProducts(products);
        })
        .catch(function () {
            showNotification('Не удалось загрузить товары');
        });
}

loadDishes();
