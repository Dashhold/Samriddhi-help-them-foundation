import { lazy, Suspense, useEffect } from "react"
import { CmsProvider } from "./cms/CmsProvider"
import PublicLayout from "./components/PublicLayout"
import { ButtonLink, Icon } from "./components/ui"
import { useAppLocation } from "./lib/router"
import HomePage from "./pages/HomePage"
import { NewsArticlePage, NewsPage } from "./pages/NewsPage"
import DocumentsPage from "./pages/DocumentsPage"
import DonatePage from "./pages/DonatePage"
import ReportsPage from "./pages/ReportsPage"

const AdminAccess = lazy(() => import("./admin/AdminAccess"))

function NotFoundPage() {
  return (
    <section className="not-found">
      <Icon name="pin" size={34} />
      <h1>404</h1>
      <h2>We could not find that page.</h2>
      <p>The link may be out of date or the page may have moved.</p>
      <ButtonLink to="/">Return home</ButtonLink>
    </section>
  )
}

function AppRoutes() {
  const location = useAppLocation()
  const path =
    location.pathname.length > 1
      ? location.pathname.replace(/\/$/, "")
      : location.pathname

  const isAdminRoute = path === "/admin" || path.startsWith("/admin/")

  useEffect(() => {
    if (isAdminRoute) return
    const title =
      path === "/"
        ? "Samriddhi Help Team Foundation"
        : path.startsWith("/news/")
          ? "News · Samriddhi Help Team Foundation"
          : `${path
              .slice(1)
              .replace(/-/g, " ")
              .replace(/\b\w/g, (letter) =>
                letter.toUpperCase(),
              )} · Samriddhi Help Team Foundation`
    document.title = title
    if (location.hash) {
      requestAnimationFrame(() =>
        document
          .querySelector(location.hash)
          ?.scrollIntoView({ behavior: "smooth" }),
      )
    } else {
      window.scrollTo({ top: 0, behavior: "auto" })
    }
  }, [path, location.hash, isAdminRoute])

  if (isAdminRoute) {
    return (
      <Suspense
        fallback={
          <div
            className="admin-root"
            style={{ display: "grid", placeItems: "center" }}
          >
            <p>Loading secure admin…</p>
          </div>
        }
      >
        <AdminAccess />
      </Suspense>
    )
  }

  let page
  if (path === "/") page = <HomePage />
  else if (path === "/news") page = <NewsPage />
  else if (path.startsWith("/news/"))
    page = (
      <NewsArticlePage slug={decodeURIComponent(path.slice("/news/".length))} />
    )
  else if (path === "/documents") page = <DocumentsPage />
  else if (path === "/donate") page = <DonatePage />
  else if (path === "/reports") page = <ReportsPage />
  else page = <NotFoundPage />

  return <PublicLayout>{page}</PublicLayout>
}

export default function App() {
  return (
    <CmsProvider>
      <AppRoutes />
    </CmsProvider>
  )
}
