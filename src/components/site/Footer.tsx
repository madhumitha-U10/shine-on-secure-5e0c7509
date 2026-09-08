import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div>
          <p className="font-display text-lg font-extrabold text-primary">NammaSpot</p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
            © 2026 NammaSpot. Handcrafted in Chennai for the modern local.
          </p>
          <div className="mt-4 h-0.5 w-24 rule-maroon" />
        </div>
        <nav className="text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Explore
          </p>
          <ul className="space-y-2">
            <li>
              <Link to="/explore" className="hover:text-primary">
                Search sellers
              </Link>
            </li>
            <li>
              <Link to="/categories" className="hover:text-primary">
                Categories
              </Link>
            </li>
            <li>
              <Link to="/near-me" className="hover:text-primary">
                Near me
              </Link>
            </li>
            <li>
              <Link to="/stories" className="hover:text-primary">
                Stories
              </Link>
            </li>
          </ul>
        </nav>
        <nav className="text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            For sellers
          </p>
          <ul className="space-y-2">
            <li>
              <Link to="/seller/register" className="hover:text-primary">
                List your business
              </Link>
            </li>
            <li>
              <Link to="/seller/login" className="hover:text-primary">
                Seller login
              </Link>
            </li>
            <li>
              <Link to="/seller/dashboard" className="hover:text-primary">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin" className="hover:text-primary">
                Admin console
              </Link>
            </li>
          </ul>
        </nav>
        <div className="text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Community
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li>Instagram</li>
            <li>YouTube</li>
            <li>Facebook</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
