function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer>
      <span className="footer-brand">HyperTube</span>
      <span className="footer-autor">By MJS </span>
      <span className="footer-copy">&copy; {year}</span>
    </footer>
  );
}

export default Footer;