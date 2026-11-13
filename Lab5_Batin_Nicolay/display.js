const imageFolders = {
    fork: 'forks',
    wheels: 'wheels',
    brakes: 'brakes',
    tires: 'tires',
    saddles: 'saddles'
};

function getImagePath(product) {
    if (product.image && product.image.startsWith('images/')) {
        return product.image;
    }

    if (product.image && /^(https?:)?\/\//.test(product.image)) {
        return product.image;
    }

    return 'images/' + imageFolders[product.category] + '/' + product.keyword + '.png';
}

products.sort(function (a, b) {
    return a.name.localeCompare(b.name);
});

products.forEach(function (product) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.product = product.keyword;
    card.dataset.kind = product.kind;

    const imagePath = getImagePath(product);
    const imageHtml = imagePath
        ? `<img src="${imagePath}" alt="${product.name}" class="card_img">`
        : '';

    card.innerHTML = `
        ${imageHtml}
        <p class="card_price">${product.price.toLocaleString('ru-RU')}₽</p>
        <h3 class="card_title">${product.name}</h3>
        <p class="card_count">${product.count}</p>
        <button type="button" class="card_btn">Добавить</button>
    `;

    const catalog = document.getElementById(product.category + '_catalog');
    catalog.append(card);
});
