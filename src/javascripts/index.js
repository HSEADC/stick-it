// бургер-меню на телефоне
const burger = document.querySelector('#burger');

if (burger) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
  });
}
