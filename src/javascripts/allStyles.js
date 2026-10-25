import '../stylesheets/style.css';

//словарь
// фильтрация карточек

const filterButtons = document.querySelectorAll('.filters__button');
const cards = document.querySelectorAll('.card');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    // подсвечиваем только нажатый фильтр
    filterButtons.forEach((item) => {
      item.classList.remove('filters__button--active');
    });
    button.classList.add('filters__button--active');

    // показываем карточки выбранной категории, остальные прячем
    cards.forEach((card) => {
      if (filter === 'all' || card.dataset.filter === filter) {
        card.hidden = false;
      } else {
        card.hidden = true;
      }
    });
  });
});
