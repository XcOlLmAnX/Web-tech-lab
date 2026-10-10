products.sort(function (a, b) {
    return a.name.localeCompare(b.name);
});

products.forEach(function (product) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.product = product.keyword;

    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="card_img">
        <p class="card_price">${product.price}₽</p>
        <h3 class="card_title">${product.name}</h3>
        <p class="card_count">${product.count}</p>
        <button type="button" class="card_btn">Добавить</button>
    `;

    const catalog = document.getElementById(product.category + '_catalog');
    catalog.append(card);
});
