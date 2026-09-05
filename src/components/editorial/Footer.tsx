import { editorial } from "@/lib/content";

export function Footer() {
  return (
    <footer className="ed-footer">
      <span>{editorial.footer.left}</span>
      <span className="ed-footer-note">{editorial.footer.right}</span>
    </footer>
  );
}
