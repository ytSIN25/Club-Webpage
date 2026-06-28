// =============================================
// CSSC - Shared JavaScript Utilities
// =============================================

// ── Auth State ──
const Auth = {
  getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('cssc_user')); } catch { return null; }
  },
  setUser(user) {
    localStorage.setItem('cssc_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('cssc_user');
    window.location.href = 'index.html';
  },
  isLoggedIn() {
    return !!this.getCurrentUser();
  },
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }
};

// ── Users Storage ──
const Users = {
  getAll() {
    try { return JSON.parse(localStorage.getItem('cssc_users')) || []; } catch { return []; }
  },
  save(users) {
    localStorage.setItem('cssc_users', JSON.stringify(users));
  },
  find(email) {
    return this.getAll().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  add(user) {
    const users = this.getAll();
    users.push(user);
    this.save(users);
  },
  update(email, updates) {
    const users = this.getAll();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this.save(users);
      if (Auth.getCurrentUser()?.email?.toLowerCase() === email.toLowerCase()) {
        Auth.setUser(users[idx]);
      }
    }
  }
};

// ── Events Storage ──
const Events = {
  getAll() {
    try { return JSON.parse(localStorage.getItem('cssc_events')) || getDefaultEvents(); } catch { return getDefaultEvents(); }
  },
  save(events) {
    localStorage.setItem('cssc_events', JSON.stringify(events));
  },
  get(id) {
    return this.getAll().find(e => e.id === id);
  },
  add(event) {
    const events = this.getAll();
    events.push(event);
    this.save(events);
  },
  delete(id) {
    const events = this.getAll().filter(e => e.id !== id);
    this.save(events);
  },
  update(id, updates) {
    const events = this.getAll();
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) { events[idx] = { ...events[idx], ...updates }; this.save(events); }
  },
  joinEvent(eventId, userEmail) {
    const events = this.getAll();
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      if (!ev.attendees) ev.attendees = [];
      if (!ev.attendees.includes(userEmail)) ev.attendees.push(userEmail);
      this.save(events);
      // Update user joined activities
      const user = Users.find(userEmail);
      if (user) {
        if (!user.joinedActivities) user.joinedActivities = [];
        if (!user.joinedActivities.includes(eventId)) {
          user.joinedActivities.push(eventId);
          Users.update(userEmail, { joinedActivities: user.joinedActivities });
        }
      }
    }
  },
  leaveEvent(eventId, userEmail) {
    const events = this.getAll();
    const ev = events.find(e => e.id === eventId);
    if (ev && ev.attendees) {
      ev.attendees = ev.attendees.filter(e => e !== userEmail);
      this.save(events);
      const user = Users.find(userEmail);
      if (user && user.joinedActivities) {
        user.joinedActivities = user.joinedActivities.filter(id => id !== eventId);
        Users.update(userEmail, { joinedActivities: user.joinedActivities });
      }
    }
  }
};

function getDefaultEvents() {
  return [
    {
      id: 'evt-001',
      title: 'Hackathon 2025: Build the Future',
      description: 'Join us for our annual 24-hour hackathon! Build innovative solutions to real-world problems. Teams of 2–5 members. Prizes worth over $3,000 up for grabs. Mentors from top tech companies will be on-site to guide you.',
      date: '2025-09-15',
      time: '09:00',
      endTime: '2025-09-16 09:00',
      location: 'Engineering Building, Room 301',
      category: 'Competition',
      image: null,
      tags: ['hackathon', 'competition', 'coding'],
      capacity: 100,
      attendees: [],
      status: 'upcoming',
      isPast: false
    },
    {
      id: 'evt-002',
      title: 'Intro to Machine Learning Workshop',
      description: 'A hands-on beginner-friendly workshop on machine learning fundamentals. We\'ll cover supervised learning, neural networks, and build a simple model using Python and scikit-learn. Bring your laptop!',
      date: '2025-08-20',
      time: '14:00',
      endTime: '',
      location: 'CS Lab B, Block C',
      category: 'Workshop',
      image: null,
      tags: ['machine learning', 'python', 'AI'],
      capacity: 40,
      attendees: [],
      status: 'upcoming',
      isPast: false
    },
    {
      id: 'evt-003',
      title: 'Tech Talk: Careers in Cybersecurity',
      description: 'Industry professionals from top cybersecurity firms will share insights about career paths, skills in demand, and how to break into the field. Q&A session and networking opportunity included.',
      date: '2025-07-10',
      time: '18:00',
      endTime: '',
      location: 'Auditorium A, Main Block',
      category: 'Talk',
      image: null,
      tags: ['cybersecurity', 'careers', 'networking'],
      capacity: 150,
      attendees: [],
      status: 'upcoming',
      isPast: false
    },
    {
      id: 'evt-004',
      title: 'Algorithm Study Group — Kick-Off',
      description: 'Start your competitive programming journey with us! Weekly sessions covering data structures and algorithms. Perfect for LeetCode practice and technical interview prep.',
      date: '2025-07-05',
      time: '16:00',
      endTime: '',
      location: 'Discussion Room 2, Library',
      category: 'Study Group',
      image: null,
      tags: ['algorithms', 'competitive programming', 'DSA'],
      capacity: 25,
      attendees: [],
      status: 'upcoming',
      isPast: false
    },
    {
      id: 'past-001',
      title: 'Web Dev Bootcamp',
      description: 'A 2-day intensive bootcamp covering HTML, CSS, JavaScript, and React fundamentals. Over 80 students participated and built their first portfolio websites.',
      date: '2025-04-10',
      time: '09:00',
      endTime: '',
      location: 'CS Lab A, Block B',
      category: 'Workshop',
      image: null,
      tags: ['web development', 'bootcamp', 'react'],
      capacity: 80,
      attendees: ['user@example.com'],
      status: 'completed',
      isPast: true,
      gallery: []
    },
    {
      id: 'past-002',
      title: 'CSSC Annual Dinner & Awards Night',
      description: 'Celebrating another year of innovation and achievement! Our top contributors, hackathon winners, and outstanding members were recognized. Over 120 members attended.',
      date: '2025-05-28',
      time: '19:00',
      endTime: '',
      location: 'Grand Ballroom, Student Union',
      category: 'Social',
      image: null,
      tags: ['awards', 'social', 'annual dinner'],
      capacity: 150,
      attendees: [],
      status: 'completed',
      isPast: true,
      gallery: []
    }
  ];
}

// Seed admin if not exists
function seedAdmin() {
  if (!Users.find('admin@cssc.edu')) {
    Users.add({
      id: 'admin-001',
      name: 'CSSC Admin',
      email: 'admin@cssc.edu',
      password: 'admin123',
      role: 'admin',
      joinedDate: new Date().toISOString(),
      joinedActivities: [],
      bio: 'System Administrator'
    });
  }
}
seedAdmin();

// ── Toast Notifications ──
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 3500) {
    this.init();
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span style="font-size:1.1rem;opacity:0.8">${icons[type]||'ℹ'}</span><span>${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// ── Navigation Builder ──
function buildNav(activePage = '') {
  const user = Auth.getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const navLinks = [
    { href: 'home.html', label: 'Home', id: 'home' },
    { href: 'events.html', label: 'Event Hub', id: 'events' },
    { href: 'committee.html', label: 'Committee', id: 'committee' },
    { href: 'about.html', label: 'About', id: 'about' },
    { href: 'contact.html', label: 'Contact', id: 'contact' },
  ];

  if (isAdmin) navLinks.push({ href: 'admin.html', label: '⚙ Admin', id: 'admin' });

  const linksHTML = navLinks.map(link => `
    <a href="${link.href}" class="nav-link ${activePage === link.id ? 'active' : ''}">${link.label}</a>
  `).join('');

  const navHTML = `
    <nav class="navbar" id="mainNav">
      <a href="home.html" class="navbar-brand">
        <div class="logo-icon">💻</div>
        CSSC<span>.</span>
      </a>
      <div class="navbar-links" id="navLinks">${linksHTML}</div>
      <div class="navbar-actions">
        ${user ? `
          <a href="account.html" class="btn btn-secondary btn-sm">${user.name.split(' ')[0]}</a>
          <button onclick="Auth.logout()" class="btn btn-outline btn-sm">Logout</button>
        ` : `
          <a href="login.html" class="btn btn-secondary btn-sm">Login</a>
          <a href="register.html" class="btn btn-primary btn-sm">Join Us</a>
        `}
        <div class="navbar-hamburger" id="hamburger" onclick="toggleMobileNav()">
          <span></span><span></span><span></span>
        </div>
      </div>
    </nav>
  `;

  document.body.insertAdjacentHTML('afterbegin', navHTML);

  window.addEventListener('scroll', () => {
    const nav = document.getElementById('mainNav');
    if (nav) nav.style.background = window.scrollY > 50
      ? 'rgba(8,8,16,0.98)' : 'rgba(8,8,16,0.85)';
  });
}

function toggleMobileNav() {
  document.getElementById('navLinks').classList.toggle('mobile-open');
}

// ── Footer Builder ──
function buildFooter() {
  const footer = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="navbar-brand" style="margin-bottom:12px;">
              <div class="logo-icon">💻</div>
              CSSC<span style="color:var(--purple-light)">.</span>
            </div>
            <p class="footer-desc">Computer Science Student Club — empowering the next generation of tech innovators through learning, collaboration, and community.</p>
          </div>
          <div>
            <h4 class="footer-heading">Navigate</h4>
            <div class="footer-links">
              <a href="home.html">Home</a>
              <a href="events.html">Event Hub</a>
              <a href="committee.html">Committee</a>
              <a href="about.html">About Us</a>
            </div>
          </div>
          <div>
            <h4 class="footer-heading">Resources</h4>
            <div class="footer-links">
              <a href="past-events.html">Past Events</a>
              <a href="contact.html">Contact</a>
              <a href="account.html">My Account</a>
            </div>
          </div>
          <div>
            <h4 class="footer-heading">Connect</h4>
            <div class="footer-links">
              <a href="#">GitHub</a>
              <a href="#">Discord</a>
              <a href="#">Instagram</a>
              <a href="#">LinkedIn</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2025 Computer Science Student Club. All rights reserved.</span>
          <span class="font-mono text-muted" style="font-size:0.75rem;">&lt;/ built with passion &gt;</span>
        </div>
      </div>
    </footer>
  `;
  document.body.insertAdjacentHTML('beforeend', footer);
}

// ── Category Colors ──
function getCategoryBadgeClass(cat) {
  const map = {
    'Competition': 'badge-orange',
    'Workshop': 'badge-purple',
    'Talk': 'badge-cyan',
    'Study Group': 'badge-green',
    'Social': 'badge-pink',
    'default': 'badge-cyan'
  };
  return map[cat] || map.default;
}

// ── Date Formatting ──
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function daysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Past event';
  if (diff === 0) return 'Today!';
  if (diff === 1) return 'Tomorrow!';
  return `In ${diff} days`;
}

// ── Generate unique ID ──
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ── Intersection Observer for animations ──
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.scroll-reveal').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', initScrollAnimations);
