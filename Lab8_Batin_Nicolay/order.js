const order = loadOrder();
let productsById = {};

function updatePanel() {
    const panel = document.getElementById('checkout_panel');
    const link = document.getElementById('checkout_link');

    panel.hidden = !hasProducts(order);
    document.getElementById('panel_total').textContent = totalText(order, productsById);

    const comboText = COMBOS[order.combo]
        ? 'Комплект: ' + COMBOS[order.combo].name
        : 'Без комплекта — выберите комплект, чтобы получить скидку';
    const error = checkCombo(order);
    document.getElementById('panel_hint').textContent = error || comboText;

    link.classList.toggle('disabled', error !== '');
    link.setAttribute('aria-disabled', error !== '');
    link.tabIndex = error !== '' ? -1 : 0;
}

function selectProduct(product, card) {
    order[product.category] = product.id;
    saveOrder(order);

    const cards = document.getElementById(product.category + '_catalog').children;
    for (let i = 0; i < cards.length; i++) {
        cards[i].classList.remove('selected');
    }
    card.classList.add('selected');

    updatePanel();
}

function markSelectedCombo() {
    document.querySelectorAll('.combo').forEach(function (block) {
        block.classList.toggle('selected', block.dataset.combo === order.combo);
    });
}

document.querySelectorAll('.combo_btn').forEach(function (button) {
    button.addEventListener('click', function () {
        order.combo = button.parentElement.dataset.combo;
        saveOrder(order);

        markSelectedCombo();
        updatePanel();
        showNotification('Комплект «' + COMBOS[order.combo].name + '» добавлен');
    });
});

document.getElementById('checkout_link').addEventListener('click', function (event) {
    const error = checkCombo(order);
    if (error !== '') {
        event.preventDefault();
        showNotification(error);
    }
});

markSelectedCombo();
