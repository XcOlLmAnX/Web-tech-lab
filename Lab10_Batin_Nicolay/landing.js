const feedbackForm = document.getElementById('feedback_form');
const feedbackSuccess = document.getElementById('feedback_success');

feedbackForm.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!feedbackForm.checkValidity()) {
        feedbackForm.classList.add('was-validated');
        feedbackSuccess.hidden = true;
        return;
    }

    feedbackForm.reset();
    feedbackForm.classList.remove('was-validated');
    feedbackSuccess.hidden = false;
});
