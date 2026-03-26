class SharedFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div>
            <div class="footer__logo">
              <a href="index.html" aria-label="Pro Hands — return to homepage">
                <img src="images/Pro-hands-communication-kit-02.png" alt="Pro Hands">
              </a>
            </div>
            <p>Pro Hands for Training, Safety, and Health — empowering communities through education and environmental stewardship.</p>
            <div class="footer__social">
              <a href="https://www.facebook.com/profile.php?id=61563909684861" target="_blank" rel="noopener" aria-label="Facebook">
                <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://www.instagram.com/prohands.jo/" target="_blank" rel="noopener" aria-label="Instagram">
                <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 0 1 1.47.957c.45.45.77.898.957 1.47.163.46.349 1.26.404 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.055 1.17-.241 1.97-.404 2.43a4.088 4.088 0 0 1-.957 1.47 4.088 4.088 0 0 1-1.47.957c-.46.163-1.26.349-2.43.404-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.055-1.97-.241-2.43-.404a4.088 4.088 0 0 1-1.47-.957 4.088 4.088 0 0 1-.957-1.47c-.163-.46-.349-1.26-.404-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.055-1.17.241-1.97.404-2.43a4.088 4.088 0 0 1 .957-1.47A4.088 4.088 0 0 1 5.064 2.3c.46-.163 1.26-.349 2.43-.404C8.76 1.838 9.14 1.826 12 1.826V2.163zM12 0C8.741 0 8.333.014 7.053.072 5.775.131 4.903.333 4.14.63a5.882 5.882 0 0 0-2.126 1.384A5.882 5.882 0 0 0 .63 4.14C.333 4.903.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.059 1.278.261 2.15.558 2.913a5.882 5.882 0 0 0 1.384 2.126A5.882 5.882 0 0 0 4.14 23.37c.763.297 1.635.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.059 2.15-.261 2.913-.558a6.138 6.138 0 0 0 3.51-3.51c.297-.763.499-1.635.558-2.913C23.986 15.667 24 15.259 24 12s-.014-3.667-.072-4.947c-.059-1.278-.261-2.15-.558-2.913a5.882 5.882 0 0 0-1.384-2.126A5.882 5.882 0 0 0 19.86.63C19.097.333 18.225.131 16.947.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              
            </div>
            <div class="footer__hashtags">
              <span>#ProHands</span><span>#SustainableJordan</span><span>#EnvironmentalAwareness</span><span>#YouthEmpowerment</span><span>#Jordan</span>
            </div>
          </div>
          <div>
            <h5>Follow Us to Stay &amp; Learn</h5>
            <div class="footer__links">
              <a href="index.html">Home</a>
              <a href="about.html">About Us</a>
              <a href="projects.html">Projects</a>
              <a href="volunteer.html">Volunteer with us</a>
            </div>
          </div>
          <div>
            <h5>Contact Us</h5>
            <ul class="footer__contact">
              <li>
                <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                King Abdullah II Street (Medical City Street), Complex No. 17, Amman, Jordan
              </li>
              <li>
                <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <a href="tel:+962795106049">+962 7 9510 6049</a>
              </li>
              <li>
                <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <a href="mailto:Professionalhandsfortraining@gmail.com">Professionalhandsfortraining@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>
        <div class="footer__bottom">Copyright &copy; 2024 Pro Hands | All Rights Reserved | Design by Pro Hands</div>
      </div>
    </footer>
    `;
  }
}
customElements.define('shared-footer', SharedFooter);
