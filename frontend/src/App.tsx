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
import JoinPage from "./pages/JoinPage"
import { MemberIdCardPage, TeamPage } from "./pages/TeamPage"
import AboutPage from "./pages/AboutPage"
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage"
import RefundCancellationPolicyPage from "./pages/RefundCancellationPolicyPage"
import TermsAndConditionsPage from "./pages/TermsAndConditionsPage"
import ShippingDeliveryPolicyPage from "./pages/ShippingDeliveryPolicyPage"
import DonationAcceptancePolicyPage from "./pages/DonationAcceptancePolicyPage"
import ChildProtectionPolicyPage from "./pages/ChildProtectionPolicyPage"
import GrievanceRedressalPolicyPage from "./pages/GrievanceRedressalPolicyPage"
import CookiePolicyPage from "./pages/CookiePolicyPage"
import WebsiteDisclaimerPage from "./pages/WebsiteDisclaimerPage"

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
          : path === "/join"
            ? "Join us · Samriddhi Help Team Foundation"
            : path === "/about"
              ? "About us · Samriddhi Help Team Foundation"
              : path === "/privacy-policy"
                ? "Privacy Policy · Samriddhi Help Team Foundation"
                : path === "/refund-cancellation-policy"
                  ? "Refund / Cancellation Policy · Samriddhi Help Team Foundation"
                  : path === "/terms-and-conditions"
                    ? "Terms & Conditions · Samriddhi Help Team Foundation"
                    : path === "/shipping-delivery-policy"
                      ? "Shipping and Delivery Policy · Samriddhi Help Team Foundation"
                      : path === "/donation-acceptance-policy"
                        ? "Donation Acceptance Policy · Samriddhi Help Team Foundation"
                        : path === "/child-protection-policy"
                          ? "Child Protection Policy · Samriddhi Help Team Foundation"
                          : path === "/grievance-redressal-policy"
                            ? "Grievance Redressal Policy · Samriddhi Help Team Foundation"
                            : path === "/cookie-policy"
                              ? "Cookie Policy · Samriddhi Help Team Foundation"
                              : path === "/website-disclaimer"
                                ? "Website Disclaimer · Samriddhi Help Team Foundation"
                                : path.startsWith("/team/")
                                  ? "Member ID card · Samriddhi Help Team Foundation"
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
  else if (path === "/about") page = <AboutPage />
  else if (path === "/privacy-policy") page = <PrivacyPolicyPage />
  else if (path === "/refund-cancellation-policy")
    page = <RefundCancellationPolicyPage />
  else if (path === "/terms-and-conditions") page = <TermsAndConditionsPage />
  else if (path === "/shipping-delivery-policy")
    page = <ShippingDeliveryPolicyPage />
  else if (path === "/donation-acceptance-policy")
    page = <DonationAcceptancePolicyPage />
  else if (path === "/child-protection-policy")
    page = <ChildProtectionPolicyPage />
  else if (path === "/grievance-redressal-policy")
    page = <GrievanceRedressalPolicyPage />
  else if (path === "/cookie-policy") page = <CookiePolicyPage />
  else if (path === "/website-disclaimer") page = <WebsiteDisclaimerPage />
  else if (path === "/join") page = <JoinPage />
  else if (path === "/team") page = <TeamPage />
  else if (path.startsWith("/team/"))
    page = (
      <MemberIdCardPage
        code={decodeURIComponent(path.slice("/team/".length))}
      />
    )
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
