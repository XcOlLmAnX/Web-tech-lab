let order = loadOrder();
let productsById = {};

const form = document.getElementById('order_form');
const timeInput = document.getElementById('delivery_time');

function updateSummary() {
    Object.keys(CATEGORIES).forEach(function (category) {
        const product = productsById[order[category]];
        const text = document.getElementById(category + '_selected');

        text.textContent = product
            ? product.name + ' — ' + formatPrice(product.price)
            : CATEGORIES[category].empty;
    });

    const combo = COMBOS[order.combo];
    document.getElementById('combo_selected').textContent = combo
        ? combo.name + ' (скидка ' + combo.discount + '%)'
        : 'Не выбран';

    document.getElementById('order_total').textContent = totalText(order, productsById);
    document.getElementById('empty_message').hidden = hasProducts(order);
}

function removeProduct(category, card) {
    order[category] = null;
    saveOrder(order);
    card.remove();
    updateSummary();
}

function renderCards() {
    const catalog = document.getElementById('order_catalog');
    catalog.innerHTML = '';

    Object.keys(CATEGORIES).forEach(function (category) {
        const product = productsById[order[category]];

        if (!product) {
            order[category] = null;
            return;
        }

        const card = createCard(product, 'Удалить', function () {
            removeProduct(category, card);
        });
        catalog.append(card);
    });

    updateSummary();
}

function collectFormData() {
    const data = {
        full_name: form.full_name.value.trim(),
        email: form.email.value.trim(),
        subscribe: form.subscribe.checked ? 1 : 0,
        phone: form.phone.value.trim(),
        delivery_address: form.delivery_address.value.trim(),
        delivery_type: form.delivery_type.value,
        delivery_time: form.delivery_type.value === 'by_time' ? timeInput.value : '',
        comment: form.comment.value.trim(),
        combo: order.combo
    };

    Object.keys(CATEGORIES).forEach(function (category) {
        data[category + '_id'] = order[category];
    });

    return data;
}

form.querySelectorAll('input[name="delivery_type"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
        timeInput.required = form.delivery_type.value === 'by_time';
    });
});

form.addEventListener('submit', function (event) {
    event.preventDefault();

    const error = checkCombo(order);
    if (error !== '') {
        showNotification(error);
        return;
    }

    const submitButton = document.getElementById('submit_btn');
    submitButton.disabled = true;

    request('POST', '/orders', collectFormData())
        .then(function () {
            clearOrder();
            order = loadOrder();
            form.reset();
            timeInput.required = false;
            renderCards();
            showNotification('Заказ успешно оформлен!');
        })
        .catch(function (requestError) {
            showNotification('Не удалось оформить заказ: ' + requestError.message);
        })
        .finally(function () {
            submitButton.disabled = false;
        });
});

form.addEventListener('reset', function () {
    timeInput.required = false;
});

loadProducts()
    .then(function (result) {
        productsById = result;
        renderCards();
    })
    .catch(function (error) {
        updateSummary();
        showNotification('Не удалось загрузить товары: ' + error.message);
    });
