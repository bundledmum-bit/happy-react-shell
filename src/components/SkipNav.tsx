export default function SkipNav() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-forest focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-pill focus:text-sm focus:font-semibold"
    >
      Skip to main content
    </a>
  );
}
