// Handle navbar active states during scrolling on homepage
const updateNavbarActiveStates = () => {
  if (!document.body.classList.contains('homepage')) {
    return; // Only run on homepage
  }

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link[href^="#"]');
  
  let currentSection = '';
  const scrollPosition = window.scrollY + 100; // Offset for better UX

  // Find the current section based on scroll position
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      currentSection = section.getAttribute('id');
    }
  });

  // Update navbar link active states
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      const targetId = href.substring(1); // Remove the # character
      
      // Remove active class from all links first
      link.classList.remove('active');
      
      // Add active class to the current section's link
      if (targetId === currentSection) {
        link.classList.add('active');
      }
    }
  });
};

// Initialize navbar active state handling
document.addEventListener('DOMContentLoaded', function() {
  if (document.body.classList.contains('homepage')) {
    // Set initial state
    updateNavbarActiveStates();
    
    // Update on scroll
    document.addEventListener('scroll', updateNavbarActiveStates);
    
    // Also update when hash changes (for direct navigation)
    window.addEventListener('hashchange', updateNavbarActiveStates);
  }
});
