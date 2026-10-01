import { AnchorHTMLAttributes, MouseEvent, ReactNode, useEffect, useState } from "react";

const base = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(pathname: string) {
  if (base && pathname.startsWith(base)) return pathname.slice(base.length) || "/";
  return pathname || "/";
}

export type AppLocation = {
  pathname: string;
  search: string;
  hash: string;
};

export function getAppLocation(): AppLocation {
  return {
    pathname: stripBase(window.location.pathname),
    search: window.location.search,
    hash: window.location.hash,
  };
}

export function withBase(path: string) {
  if (/^(https?:|mailto:|tel:|data:|blob:)/i.test(path)) return path;
  if (path.startsWith("#")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}` || "/";
}

export function navigate(to: string, replace = false) {
  const href = withBase(to);
  if (/^(https?:|mailto:|tel:|data:|blob:)/i.test(href)) {
    window.location.assign(href);
    return;
  }
  window.history[replace ? "replaceState" : "pushState"]({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useAppLocation() {
  const [location, setLocation] = useState(getAppLocation);
  useEffect(() => {
    const update = () => setLocation(getAppLocation());
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return location;
}

type AppLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  children: ReactNode;
};

export function AppLink({ to, children, onClick, target, ...props }: AppLinkProps) {
  const href = withBase(to);
  const click = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      target === "_blank" ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      /^(https?:|mailto:|tel:|data:|blob:)/i.test(to)
    ) return;
    event.preventDefault();
    navigate(to);
  };
  return <a {...props} href={href} target={target} onClick={click}>{children}</a>;
}

export function resolvePublicAsset(value: string) {
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return withBase(value.startsWith("/") ? value : `/${value}`);
}
