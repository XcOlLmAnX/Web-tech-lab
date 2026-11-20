let orders = [];
let productsById = {};
let currentOrder = null;

const ASAP_TEXT = 'Как можно скорее (с 7:00 до 23:00)';

function formatDate(isoString) {
    return new Date(isoString).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function orderSelection(order) {
    const selection = { combo: order.combo };
    Object.keys(CATEGORIES).forEach(function (category) {
        selection[category] = order[category + '_id'];
    });
    return selection;
}

function orderProducts(order) {
    const result = [];
    Object.keys(CATEGORIES).forEach(function (category) {
        const product = productsById[order[category + '_id']];
        if (product) {
            result.push({ category: category, product: product });
        }
    });
    return result;
}

function deliveryText(order) {
    return order.delivery_type === 'by_time' ? order.delivery_time : ASAP_TEXT;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text === null || text === undefined ? '' : String(text);
    return div.innerHTML;
}

function itemsHtml(order) {
    const rows = orderProducts(order).map(function (item) {
        return '<div class="modal_row"><span class="modal_label">' + CATEGORIES[item.category].title +
            '</span><span>' + escapeHtml(item.product.name) + ' (' + formatPrice(item.product.price) + ')</span></div>';
    });

    const combo = COMBOS[order.combo];
    if (combo) {
        rows.unshift('<div class="modal_row"><span class="modal_label">Комплект</span><span>' +
            combo.name + ' (скидка ' + combo.discount + '%)</span></div>');
    }

    rows.push('<p class="modal_total">Стоимость: ' + totalText(orderSelection(order), productsById) + '</p>');
    return rows.join('');
}

function renderOrders() {
    const list = document.getElementById('orders_list');
    list.innerHTML = '';

    orders.sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
    });

    orders.forEach(function (order, index) {
        const names = orderProducts(order).map(function (item) {
            return item.product.name;
        });

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="№">${index + 1}</td>
            <td data-label="Дата">${formatDate(order.created_at)}</td>
            <td data-label="Состав">${escapeHtml(names.join(', '))}</td>
            <td data-label="Стоимость">${formatPrice(calcTotal(orderSelection(order), productsById).total)}</td>
            <td data-label="Доставка">${escapeHtml(deliveryText(order))}</td>
            <td class="orders_actions">
                <button type="button" class="icon_btn" data-action="view" title="Подробнее" aria-label="Подробнее">
                    <i class="bi bi-eye"></i>
                </button>
                <button type="button" class="icon_btn" data-action="edit" title="Редактирование" aria-label="Редактирование">
                    <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="icon_btn icon_btn_danger" data-action="delete" title="Удаление" aria-label="Удаление">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        row.querySelector('[data-action="view"]').addEventListener('click', function () {
            openView(order);
        });
        row.querySelector('[data-action="edit"]').addEventListener('click', function () {
            openEdit(order);
        });
        row.querySelector('[data-action="delete"]').addEventListener('click', function () {
            openDelete(order);
        });

        list.append(row);
    });

    document.getElementById('orders_empty').hidden = orders.length > 0;
    document.getElementById('orders_wrapper').hidden = orders.length === 0;
}

function replaceOrder(updated) {
    orders = orders.map(function (order) {
        return order.id === updated.id ? updated : order;
    });
    renderOrders();
}

document.querySelectorAll('[data-close]').forEach(function (button) {
    button.addEventListener('click', function () {
        button.closest('dialog').close();
    });
});

function openView(order) {
    const delivery = [
        ['Имя получателя', order.full_name],
        ['Адрес доставки', order.delivery_address],
        ['Время доставки', deliveryText(order)],
        ['Телефон', order.phone],
        ['Email', order.email]
    ].map(function (pair) {
        return '<div class="modal_row"><span class="modal_label">' + pair[0] +
            '</span><span>' + escapeHtml(pair[1]) + '</span></div>';
    }).join('');

    document.getElementById('view_body').innerHTML =
        '<div class="modal_row"><span class="modal_label">Дата оформления</span><span>' +
        formatDate(order.created_at) + '</span></div>' +
        '<h4 class="modal_section">Доставка</h4>' + delivery +
        '<h4 class="modal_section">Комментарий</h4><p>' + (escapeHtml(order.comment) || '—') + '</p>' +
        '<h4 class="modal_section">Состав заказа</h4>' + itemsHtml(order);

    document.getElementById('view_modal').showModal();
}

const editForm = document.getElementById('edit_form');
const editTime = document.getElementById('edit_time');

function updateTimeRequired() {
    editTime.required = editForm.delivery_type.value === 'by_time';
}

editForm.querySelectorAll('input[name="delivery_type"]').forEach(function (radio) {
    radio.addEventListener('change', updateTimeRequired);
});

function openEdit(order) {
    currentOrder = order;

    document.getElementById('edit_date').textContent = formatDate(order.created_at);
    editForm.full_name.value = order.full_name;
    editForm.delivery_address.value = order.delivery_address;
    editForm.delivery_type.value = order.delivery_type;
    editTime.value = order.delivery_time || '';
    editForm.phone.value = order.phone;
    editForm.email.value = order.email;
    editForm.comment.value = order.comment || '';
    document.getElementById('edit_items').innerHTML = itemsHtml(order);
    updateTimeRequired();

    document.getElementById('edit_modal').showModal();
}

editForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const data = {
        full_name: editForm.full_name.value.trim(),
        email: editForm.email.value.trim(),
        phone: editForm.phone.value.trim(),
        delivery_address: editForm.delivery_address.value.trim(),
        delivery_type: editForm.delivery_type.value,
        delivery_time: editForm.delivery_type.value === 'by_time' ? editTime.value : '',
        comment: editForm.comment.value.trim()
    };

    request('PUT', '/orders/' + currentOrder.id, data)
        .then(function (updated) {
            document.getElementById('edit_modal').close();
            replaceOrder(updated);
            showNotification('Заказ успешно изменён');
        })
        .catch(function (error) {
            showNotification('Не удалось изменить заказ: ' + error.message);
        });
});

function openDelete(order) {
    currentOrder = order;
    document.getElementById('delete_modal').showModal();
}

document.getElementById('delete_confirm').addEventListener('click', function () {
    request('DELETE', '/orders/' + currentOrder.id)
        .then(function () {
            const deletedId = currentOrder.id;
            document.getElementById('delete_modal').close();
            orders = orders.filter(function (order) {
                return order.id !== deletedId;
            });
            renderOrders();
            showNotification('Заказ успешно удалён');
        })
        .catch(function (error) {
            showNotification('Не удалось удалить заказ: ' + error.message);
        });
});

Promise.all([loadProducts(), request('GET', '/orders')])
    .then(function (results) {
        productsById = results[0];
        orders = results[1];
        renderOrders();
    })
    .catch(function (error) {
        showNotification('Не удалось загрузить заказы: ' + error.message);
    });
