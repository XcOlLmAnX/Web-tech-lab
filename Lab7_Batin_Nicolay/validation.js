const combos = {
    fork_wheels: { name: 'Вилка + Колёса', items: ['fork', 'wheels'], discount: 10 },
    wheels_tires: { name: 'Колёса + Покрышки', items: ['wheels', 'tires'], discount: 10 }
};

const categoryNames = {
    fork: 'вилку',
    wheels: 'колёса',
    tires: 'покрышки'
};

function showNotification(message) {
    const box = document.createElement('div');
    box.className = 'notification';
    box.innerHTML = '<p>' + message + '</p><button type="button">Окей</button>';

    box.querySelector('button').addEventListener('click', function () {
        box.remove();
    });

    document.body.append(box);
}

document.querySelectorAll('.combo_btn').forEach(function (button) {
    button.addEventListener('click', function () {
        const comboBlock = button.parentElement;
        const key = comboBlock.dataset.combo;

        selectedCombo = combos[key];
        document.getElementById('combo_input').value = key;

        document.querySelectorAll('.combo').forEach(function (block) {
            block.classList.remove('selected');
        });
        comboBlock.classList.add('selected');

        updateOrder();
        showNotification('Комплект «' + selectedCombo.name + '» добавлен');
    });
});

document.getElementById('order_form').addEventListener('reset', function () {
    showNotification('Заказ сброшен');
});

document.getElementById('order_form').addEventListener('submit', function (event) {
    let message = '';

    if (selectedCombo === null) {
        message = 'Выберите комплект';
    } else {
        const missing = selectedCombo.items.find(function (category) {
            return selectedProducts[category] === null;
        });

        if (missing) {
            message = 'Выберите ' + categoryNames[missing];
        }
    }

    if (message !== '') {
        event.preventDefault();
        showNotification(message);
    }
});
