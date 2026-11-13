(() => {
"use strict";
// Практическая №13. Доступность формы и модального окна.
// Скрипт безопасно подключать на все страницы: отсутствующие блоки пропускаются.

function errorText(field) {
    if (field.validity.valueMissing) {
        return field.type === 'checkbox'
            ? 'Подтвердите согласие на обработку данных.'
            : field.tagName === 'SELECT'
                ? 'Выберите значение из списка.'
                : 'Заполните обязательное поле.';
    }
    if (field.validity.typeMismatch) return 'Введите корректный адрес электронной почты.';
    if (field.validity.patternMismatch) return 'Используйте указанный формат телефона.';
    if (field.validity.tooShort) return 'Введите не менее двух символов.';
    return 'Исправьте значение в этом поле.';
}

function setError(field, message) {
    const error = document.getElementById(`${field.id}-error`);
    if (!error) return;
    const hasError = Boolean(message);
    error.hidden = !hasError;
    const descriptions = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    if (hasError) descriptions.add(error.id);
    else descriptions.delete(error.id);
    if (descriptions.size) field.setAttribute('aria-describedby', [...descriptions].join(' '));
    else field.removeAttribute('aria-describedby');
    if (hasError) {
        error.textContent = message;
        field.setAttribute('aria-invalid', 'true');
    } else {
        field.removeAttribute('aria-invalid');
    }
}

function setupValidation(form, onValid) {
    if (!form) return;
    const controls = Array.from(form.querySelectorAll('input, select, textarea'))
        .filter((field) => field.type !== 'hidden');

    for (const field of controls) {
        const clear = () => {
            if (field.validity.valid) setError(field, '');
        };
        field.addEventListener('input', clear);
        field.addEventListener('change', clear);
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Учебная демонстрация без сервера.
        let firstInvalid = null;
        for (const field of controls) {
            if (!field.validity.valid) {
                setError(field, errorText(field));
                firstInvalid ??= field;
            } else {
                setError(field, '');
            }
        }
        if (firstInvalid) {
            firstInvalid.focus();
            firstInvalid.reportValidity();
            return;
        }
        form.reset();
        controls.forEach((field) => setError(field, ''));
        onValid();
    });
}

const dialog = document.getElementById('order-dialog');
const modalForm = document.getElementById('order-form');
const modalStatus = document.getElementById('success-message');
let modalTrigger = null;
let modalSubmitted = false;

if (dialog && modalForm) {
    const selectedProduct = document.getElementById('selected-product');
    document.querySelectorAll('[data-product]').forEach((button) => {
        button.addEventListener('click', () => {
            modalTrigger = button;
            modalSubmitted = false;
            if (selectedProduct) selectedProduct.value = button.dataset.product;
            if (modalStatus) modalStatus.hidden = true;
            dialog.showModal(); // Native dialog: focus trap and Escape key.
            modalForm.querySelector('input:not([type="hidden"])')?.focus();
        });
    });

    document.getElementById('close-order-dialog')?.addEventListener('click', () => {
        dialog.close();
    });

    dialog.addEventListener('close', () => {
        if (!modalSubmitted) modalTrigger?.focus();
    });

    setupValidation(modalForm, () => {
        modalSubmitted = true;
        dialog.close();
        if (modalStatus) {
            modalStatus.hidden = false;
            modalStatus.focus();
        }
    });
}

const pageForm = document.getElementById('page-order-form');
if (pageForm) {
    const productSelect = document.getElementById('page-order-product');
    const productParam = new URLSearchParams(window.location.search).get('product');
    const status = document.getElementById('page-success-message');

    if (productSelect && ['1', '2', '3'].includes(productParam)) {
        productSelect.value = productParam;
    }

    setupValidation(pageForm, () => {
        if (status) {
            status.hidden = false;
            status.focus();
        }
    });

    pageForm.addEventListener('input', () => {
        if (status) status.hidden = true;
    });
    pageForm.addEventListener('reset', () => {
        if (status) status.hidden = true;
    });
}

})();
