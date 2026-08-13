export const GA_MEASUREMENT_ID = 'G-CXW4C2GWS2'

export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}

export function trackPageView({ path, title } = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', 'page_view', {
    page_path: path || window.location.pathname,
    page_title: title || document.title,
    page_location: window.location.href,
  })
}
