const selectedProducts = {
    fork: null,
    wheels: null,
    brakes: null,
    tires: null,
    saddles: null
};

let selectedCombo = null;

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

    let discount = 0;
    if (selectedCombo !== null) {
        selectedCombo.items.forEach(function (category) {
            const product = selectedProducts[category];
            if (product !== null) {
                discount += Math.round(product.price * selectedCombo.discount / 100);
            }
        });
    }

    let totalText = formatPrice(total - discount);
    if (discount > 0) {
        totalText += ' (скидка ' + formatPrice(discount) + ')';
    }
    document.getElementById('order_total').textContent = totalText;

    if (selectedCombo === null) {
        document.getElementById('combo_selected').textContent = 'Комплект не выбран';
    } else {
        document.getElementById('combo_selected').textContent =
            selectedCombo.name + ' (скидка ' + selectedCombo.discount + '%)';
    }

    const hasProducts = Object.values(selectedProducts).some(function (product) {
        return product !== null;
    });

    if (hasProducts || selectedCombo !== null) {
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

    selectedCombo = null;
    document.getElementById('combo_input').value = '';

    document.querySelectorAll('.card.selected, .combo.selected').forEach(function (card) {
        card.classList.remove('selected');
    });

    updateOrder();
});
