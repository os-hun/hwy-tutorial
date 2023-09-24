import {
  hwyInit,
  CssImports,
  rootOutlet,
  hwyDev,
  ClientEntryScript,
  HeadElements,
  getDefaultBodyProps,
  renderRoot,
} from 'hwy'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'

const IS_DEV = process.env.NODE_ENV === 'development'

const app = new Hono()

hwyInit({
  app,
  importMetaUrl: import.meta.url,
  serveStatic,
})

app.use('*', logger())
app.get('*', secureHeaders())

app.all('*', async (c, next) => {
  if (IS_DEV) await new Promise((r) => setTimeout(r, 150)) // simulate latency in dev

  return await renderRoot(c, next, async ({ activePathData }) => {
    return (
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />

          <HeadElements
            c={c}
            activePathData={activePathData}
            defaults={[
              { title: 'hwy-tutorial' },
              {
                tag: 'meta',
                props: {
                  name: 'description',
                  content: 'Take the Hwy!',
                },
              },
              {
                tag: 'meta',
                props: {
                  name: 'htmx-config',
                  content: JSON.stringify({
                    selfRequestsOnly: true,
                    refreshOnHistoryMiss: true,
                  }),
                },
              },
            ]}
          />

          <CssImports />
          <ClientEntryScript />

          {hwyDev?.DevLiveRefreshScript()}
        </head>

        <body
          {...getDefaultBodyProps({ nProgress: true })}
        >
          <nav>
            <a href="/">
              <h1>Hwy</h1>
            </a>

            <ul>
              <li>
                <a href="/about">About</a>
              </li>
              <li>
                <a href="/login">Login</a>
              </li>
            </ul>
          </nav>

          <main>
            {await rootOutlet({
              activePathData,
              c,
              fallbackErrorBoundary: () => {
                return <div>Something went wrong.</div>
              },
            })}
          </main>
        </body>
      </html>
    )
  })
})

app.notFound((c) => c.text('404 Not Found', 404))


app.onError((error, c) => {
  console.error(error)
  return c.text('500 Internal Server Error', 500)
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(
    `\nListening on http://${IS_DEV ? 'localhost' : info.address}:${PORT}\n`
  )
})
