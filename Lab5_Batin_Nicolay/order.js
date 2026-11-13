const selectedProducts = {
    fork: null,
    wheels: null,
    brakes: null,
    tires: null,
    saddles: null
};

function formatPrice(price) {
    return price.toLocaleString('ru-RU') + '₽';
}

function showProduct(product, id) {
    const text = document.getElementById(id);

    if (product === null) {
        text.textContent = 'Товар не выбран';
    } else {
        text.textContent = product.name + ' — ' + formatPrice(product.price);
    }
}

function updateOrder() {
    Object.keys(selectedProducts).forEach(function (category) {
        showProduct(selectedProducts[category], category + '_selected');
    });

    let total = 0;
    Object.values(selectedProducts).forEach(function (product) {
        if (product !== null) total += product.price;
    });
    document.getElementById('order_total').textContent = formatPrice(total);

    const hasProducts = Object.values(selectedProducts).some(function (product) {
        return product !== null;
    });

    if (hasProducts) {
        document.getElementById('nothing_selected').hidden = true;
        document.getElementById('order_items').hidden = false;
    } else {
        document.getElementById('nothing_selected').hidden = false;
        document.getElementById('order_items').hidden = true;
    }
}

const buttons = document.querySelectorAll('.card_btn');

buttons.forEach(function (button) {
    button.addEventListener('click', function () {
        const card = button.parentElement;

        const product = products.find(function (p) {
            return p.keyword === card.dataset.product;
        });

        selectedProducts[product.category] = product;
        document.getElementById(product.category + '_input').value = product.keyword;

        const cards = document.getElementById(product.category + '_catalog').children;
        for (let i = 0; i < cards.length; i++) {
            cards[i].classList.remove('selected');
        }
        card.classList.add('selected');

        updateOrder();
    });
});

document.getElementById('order_form').addEventListener('reset', function () {
    Object.keys(selectedProducts).forEach(function (category) {
        selectedProducts[category] = null;
        document.getElementById(category + '_input').value = '';
    });

    document.querySelectorAll('.card.selected').forEach(function (card) {
        card.classList.remove('selected');
    });

    updateOrder();
});
