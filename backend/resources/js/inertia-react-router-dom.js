import React from 'react';
import { Link as InertiaLink, router, usePage } from '@inertiajs/react';

const currentUrl = (url) => new URL(url || '/', window.location.origin);

export function Link({ to, href, children, ...props }) {
  return (
    <InertiaLink href={href ?? to ?? '#'} {...props}>
      {children}
    </InertiaLink>
  );
}

export function NavLink({ to, href, end = false, className, children, ...props }) {
  const page = usePage();
  const pathname = currentUrl(page.url).pathname;
  const target = href ?? to ?? '#';
  const targetPath = currentUrl(target).pathname;
  const isActive = end ? pathname === targetPath : pathname === targetPath || pathname.startsWith(`${targetPath}/`);
  const computedClassName = typeof className === 'function' ? className({ isActive }) : className;

  return (
    <Link to={target} className={computedClassName} {...props}>
      {children}
    </Link>
  );
}

export function useNavigate() {
  return (to, options = {}) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }

    router.visit(to, {
      replace: options.replace ?? false,
      preserveScroll: options.preserveScroll ?? false,
      preserveState: options.preserveState ?? false,
    });
  };
}

export function useParams() {
  return usePage().props.routeParams ?? {};
}

export function useSearchParams() {
  const page = usePage();
  const url = currentUrl(page.url);
  const params = new URLSearchParams(url.search);

  const setSearchParams = (nextValue) => {
    const nextParams = nextValue instanceof URLSearchParams
      ? new URLSearchParams(nextValue.toString())
      : new URLSearchParams(nextValue);

    const query = nextParams.toString();
    router.get(
      `${url.pathname}${query ? `?${query}` : ''}`,
      {},
      {
        replace: true,
        preserveScroll: true,
        preserveState: false,
      },
    );
  };

  return [params, setSearchParams];
}
