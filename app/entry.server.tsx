// import type { AppLoadContext, EntryContext } from '@remix-run/cloudflare';
// import { RemixServer } from '@remix-run/react';
// import { isbot } from 'isbot';
// import { renderToReadableStream } from 'react-dom/server';
// import { renderHeadToString } from 'remix-island';
// import { Head } from './root';
// import { themeStore } from '~/lib/stores/theme';
// import { initializeModelList } from '~/utils/constants';

// export default async function handleRequest(
//   request: Request,
//   responseStatusCode: number,
//   responseHeaders: Headers,
//   remixContext: EntryContext,
//   _loadContext: AppLoadContext,
// ) {
//   await initializeModelList();

//   const readable = await renderToReadableStream(<RemixServer context={remixContext} url={request.url} />, {
//     signal: request.signal,
//     onError(error: unknown) {
//       console.error(error);
//       responseStatusCode = 500;
//     },
//   });

//   const body = new ReadableStream({
//     start(controller) {
//       const head = renderHeadToString({ request, remixContext, Head });

//       controller.enqueue(
//         new Uint8Array(
//           new TextEncoder().encode(
//             `<!DOCTYPE html><html lang="en" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">`,
//           ),
//         ),
//       );

//       const reader = readable.getReader();

//       function read() {
//         reader
//           .read()
//           .then(({ done, value }) => {
//             if (done) {
//               controller.enqueue(new Uint8Array(new TextEncoder().encode(`</div></body></html>`)));
//               controller.close();

//               return;
//             }

//             controller.enqueue(value);
//             read();
//           })
//           .catch((error) => {
//             controller.error(error);
//             readable.cancel();
//           });
//       }
//       read();
//     },

//     cancel() {
//       readable.cancel();
//     },
//   });

//   if (isbot(request.headers.get('user-agent') || '')) {
//     await readable.allReady;
//   }

//   responseHeaders.set('Content-Type', 'text/html');

//   responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
//   responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

//   return new Response(body, {
//     headers: responseHeaders,
//     status: responseStatusCode,
//   });
// }

import type { AppLoadContext, EntryContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToString } from 'react-dom/server'; // Use renderToString for better compatibility
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
import { themeStore } from '~/lib/stores/theme';
import { initializeModelList } from '~/utils/constants';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  await initializeModelList();

  // Generate the HTML string using renderToString (non-streaming version)
  const htmlString = renderToString(<RemixServer context={remixContext} url={request.url} />);

  // Use ReadableStream to send the response body
  const body = new ReadableStream({
    start(controller) {
      const head = renderHeadToString({ request, remixContext, Head });

      // Enqueue the head and initial HTML markup
      controller.enqueue(
        new Uint8Array(
          new TextEncoder().encode(
            `<!DOCTYPE html><html lang="en" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">${htmlString}</div></body></html>`,
          ),
        ),
      );
      controller.close();
    },
  });

  // Set headers for the response
  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

  // Return the response with the generated body and headers
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
