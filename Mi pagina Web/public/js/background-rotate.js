const backgroundElement = document.querySelector('.background');
const backgroundImages = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1920&q=80'
];
const overlay = 'linear-gradient(rgba(15, 27, 45, 0.9), rgba(15, 27, 45, 0.9))';
let currentIndex = 0;

function updateBackground() {
  const imageUrl = backgroundImages[currentIndex];
  backgroundElement.style.backgroundImage = `${overlay}, url('${imageUrl}')`;
  currentIndex = (currentIndex + 1) % backgroundImages.length;
}

if (backgroundElement) {
  updateBackground();
  setInterval(updateBackground, 60000); // Cambia cada 60 segundos
}
