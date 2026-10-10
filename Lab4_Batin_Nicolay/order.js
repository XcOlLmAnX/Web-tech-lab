let fork = null;
let wheels = null;
let brakes = null;

function showProduct(product, id) {
    const text = document.getElementById(id);

    if (product === null) {
        text.textContent = 'Товар не выбран';
    } else {
        text.textContent = product.name + ' ' + product.price + '₽';
    }
}

function updateOrder() {
    showProduct(fork, 'fork_selected');
    showProduct(wheels, 'wheels_selected');
    showProduct(brakes, 'brakes_selected');

    let total = 0;
    if (fork !== null) total += fork.price;
    if (wheels !== null) total += wheels.price;
    if (brakes !== null) total += brakes.price;
    document.getElementById('order_total').textContent = total + '₽';

    if (fork === null && wheels === null && brakes === null) {
        document.getElementById('nothing_selected').hidden = false;
        document.getElementById('order_items').hidden = true;
    } else {
        document.getElementById('nothing_selected').hidden = true;
        document.getElementById('order_items').hidden = false;
    }
}

const buttons = document.querySelectorAll('.card_btn');

buttons.forEach(function (button) {
    button.addEventListener('click', function () {
        const card = button.parentElement;

        const product = products.find(function (p) {
            return p.keyword === card.dataset.product;
        });

        if (product.category === 'fork') {
            fork = product;
        } else if (product.category === 'wheels') {
            wheels = product;
        } else if (product.category === 'brakes') {
            brakes = product;
        }

        document.getElementById(product.category + '_input').value = product.keyword;

        const cards = document.getElementById(product.category + '_catalog').children;
        for (let i = 0; i < cards.length; i++) {
            cards[i].classList.remove('selected');
        }
        card.classList.add('selected');

        updateOrder();
    });
});
