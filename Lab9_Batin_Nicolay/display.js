function displayProducts(productsById) {
    const products = Object.values(productsById);

    products.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });

    products.forEach(function (product) {
        const card = createCard(product, 'Добавить', function () {
            selectProduct(product, card);
        });

        if (order[product.category] === product.id) {
            card.classList.add('selected');
        }

        document.getElementById(product.category + '_catalog').append(card);
    });
}

loadProducts()
    .then(function (result) {
        productsById = result;
        displayProducts(productsById);
        updatePanel();
    })
    .catch(function (error) {
        showNotification('Не удалось загрузить товары: ' + error.message);
    });
