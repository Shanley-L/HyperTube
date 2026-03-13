import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer>
      <span className="footer-brand">HyperTube</span>
      <span className="footer-autor">{t('footer.by')} </span>
      <span className="footer-copy">&copy; {year}</span>
    </footer>
  );
}

export default Footer;
