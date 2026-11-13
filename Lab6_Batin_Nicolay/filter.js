const filterButtons = document.querySelectorAll('.filter_btn');

filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        const filters = button.closest('.filters');
        const category = filters.dataset.category;
        const kind = button.dataset.kind;
        const wasActive = button.classList.contains('active');

        filters.querySelectorAll('.filter_btn').forEach(function (otherButton) {
            otherButton.classList.remove('active');
        });

        const cards = document.querySelectorAll('#' + category + '_catalog .card');

        if (wasActive) {
            cards.forEach(function (card) {
                card.hidden = false;
            });
            return;
        }

        button.classList.add('active');

        cards.forEach(function (card) {
            card.hidden = card.dataset.kind !== kind;
        });
    });
});