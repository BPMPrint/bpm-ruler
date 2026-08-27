import type { ReactNode } from 'react'
import Navbar, { NAV_HEIGHT } from './Navbar'
import Footer from './Footer'

/**
 * Landing layout: fixed overlay Navbar + Footer.
 * Owns the nav-height offset on the content slot; full-bleed hero
 * sections opt out inside the page (e.g. -mt-16 pt-16 on the hero).
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-ink text-paper">
      <Navbar />
      <main style={{ paddingTop: NAV_HEIGHT }}>{children}</main>
      <Footer />
    </div>
  )
}
