// ========= CARROSSEL DO HEADER =========
let headerIndex = 0;
const headerImages = document.querySelectorAll('.carousel-background img');
const totalHeaderImages = headerImages.length;

function changeHeaderImage() {
  headerImages.forEach((img, i) => {
    img.style.opacity = (i === headerIndex) ? "1" : "0";
  });

  headerIndex = (headerIndex + 1) % totalHeaderImages;
}

// Troca a imagem a cada 3s
setInterval(changeHeaderImage, 3000);
changeHeaderImage();


// ========= CARROSSEL DE DESTINOS =========
const slides = document.querySelectorAll('.destino-slide');
const prevBtn = document.querySelector('.praia-carousel .prev');
const nextBtn = document.querySelector('.praia-carousel .next');
const dotsContainer = document.querySelector('.dots-container');

let currentIndex = 0;
let slideInterval;

// Cria os dots conforme o número de slides
slides.forEach((_, idx) => {
  const dot = document.createElement('button');
  dot.setAttribute('aria-label', `Slide ${idx + 1}`);
  if (idx === 0) dot.classList.add('active');
  dot.addEventListener('click', () => {
    showSlide(idx);
    resetInterval();
  });
  dotsContainer.appendChild(dot);
});

const dots = dotsContainer.querySelectorAll('button');

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
    dots[i].classList.toggle('active', i === index);
  });
  currentIndex = index;
}

function nextSlide() {
  let nextIndex = (currentIndex + 1) % slides.length;
  showSlide(nextIndex);
}

function prevSlide() {
  let prevIndex = (currentIndex - 1 + slides.length) % slides.length;
  showSlide(prevIndex);
}

function resetInterval() {
  clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 5000);
}

// Eventos dos botões
if (nextBtn && prevBtn) {
  nextBtn.addEventListener('click', () => {
    nextSlide();
    resetInterval();
  });

  prevBtn.addEventListener('click', () => {
    prevSlide();
    resetInterval();
  });
}

// Inicia o carrossel de destinos
if (slides.length > 0) {
  slideInterval = setInterval(nextSlide, 5000);
  showSlide(currentIndex);
}


// ========= CARROSSEL DE PASSEIOS & BEACH CLUBS =========
document.querySelectorAll(".carousel").forEach(carousel => {
  const slides = carousel.querySelector(".slides");
  const images = slides.querySelectorAll("img");
  const prev = carousel.querySelector(".prev");
  const next = carousel.querySelector(".next");

  let index = 0;

  function showSlide(i) {
    if (i < 0) index = images.length - 1;
    else if (i >= images.length) index = 0;
    else index = i;

    slides.style.transform = `translateX(${-index * 100}%)`;
  }

  prev.addEventListener("click", () => showSlide(index - 1));
  next.addEventListener("click", () => showSlide(index + 1));

  showSlide(index);
});
const modal = document.getElementById("modalReserva");
const btnAbrir = document.querySelector(".abrir-reserva");
const btnFechar = document.querySelector(".fechar");

// Abrir modal
btnAbrir.onclick = () => {
  modal.style.display = "flex";
}

// Fechar modal ao clicar no X
btnFechar.onclick = () => {
  modal.style.display = "none";
}

// Fechar modal ao clicar fora do conteúdo
window.onclick = (event) => {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
