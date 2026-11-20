const STORAGE_KEY = 'bike_order';

const CATEGORIES = {
    fork: { title: 'Вилка', empty: 'Не выбрана', accusative: 'вилку' },
    wheels: { title: 'Колёса', empty: 'Не выбраны', accusative: 'колёса' },
    brakes: { title: 'Тормоза', empty: 'Не выбраны', accusative: 'тормоза' },
    tires: { title: 'Покрышки', empty: 'Не выбраны', accusative: 'покрышки' },
    saddles: { title: 'Седло', empty: 'Не выбрано', accusative: 'седло' }
};

const COMBOS = {
    fork_wheels: { name: 'Вилка + Колёса', items: ['fork', 'wheels'], discount: 10 },
    wheels_tires: { name: 'Колёса + Покрышки', items: ['wheels', 'tires'], discount: 10 }
};

function emptyOrder() {
    return { combo: null, fork: null, wheels: null, brakes: null, tires: null, saddles: null };
}

function loadOrder() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Object.assign(emptyOrder(), saved);
    } catch (error) {
        return emptyOrder();
    }
}

function saveOrder(order) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

function clearOrder() {
    localStorage.removeItem(STORAGE_KEY);
}

function formatPrice(price) {
    return price.toLocaleString('ru-RU') + '₽';
}

function hasProducts(order) {
    return Object.keys(CATEGORIES).some(function (category) {
        return order[category] !== null;
    });
}

function checkCombo(order) {
    if (!hasProducts(order)) {
        return 'Добавьте в заказ хотя бы один товар';
    }

    const combo = COMBOS[order.combo];
    if (!combo) {
        return '';
    }

    const missing = combo.items.find(function (category) {
        return order[category] === null;
    });
    if (missing) {
        return 'Выберите ' + CATEGORIES[missing].accusative;
    }

    return '';
}

function calcTotal(order, productsById) {
    const combo = COMBOS[order.combo];
    let total = 0;
    let discount = 0;

    Object.keys(CATEGORIES).forEach(function (category) {
        const product = productsById[order[category]];
        if (!product) return;

        total += product.price;
        if (combo && combo.items.includes(category)) {
            discount += Math.round(product.price * combo.discount / 100);
        }
    });

    return { total: total - discount, discount: discount };
}

function totalText(order, productsById) {
    const result = calcTotal(order, productsById);
    let text = formatPrice(result.total);
    if (result.discount > 0) {
        text += ' (скидка ' + formatPrice(result.discount) + ')';
    }
    return text;
}

function showNotification(message) {
    const box = document.createElement('div');
    box.className = 'notification';
    box.innerHTML = '<p></p><button type="button">Окей</button>';
    box.querySelector('p').textContent = message;

    box.querySelector('button').addEventListener('click', function () {
        box.remove();
    });

    const host = document.querySelector('dialog[open]') || document.body;
    host.append(box);
}

function request(method, path, body) {
    const options = { method: method, headers: {} };
    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const url = API_URL + path + '?api_key=' + encodeURIComponent(API_KEY);

    return fetch(url, options)
        .catch(function () {
            throw new Error('Не удалось связаться с сервером');
        })
        .then(function (response) {
            return response.json()
                .catch(function () {
                    return {};
                })
                .then(function (data) {
                    if (!response.ok || data.error) {
                        throw new Error(data.error || 'Ошибка сервера: ' + response.status);
                    }
                    return data;
                });
        });
}

function loadProducts() {
    return request('GET', '/products').then(function (products) {
        const productsById = {};
        products.forEach(function (product) {
            productsById[product.id] = product;
        });
        return productsById;
    });
}

function createCard(product, buttonText, onClick) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = product.id;
    card.dataset.kind = product.kind;

    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="card_img">
        <p class="card_price">${formatPrice(product.price)}</p>
        <h3 class="card_title">${product.name}</h3>
        <p class="card_count">${product.count}</p>
        <button type="button" class="card_btn">${buttonText}</button>
    `;

    card.querySelector('.card_btn').addEventListener('click', function () {
        onClick(card);
    });

    return card;
}
