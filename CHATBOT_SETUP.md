# Deploy the real AI chatbot (Cloudflare Workers)

The live GitHub Pages frontend is in `index.html`. The secure backend is in `worker/worker.js`.

## 1. Create the backend
1. Sign in at https://dash.cloudflare.com/ and open **Workers & Pages**.
2. Create a Worker (name suggestion: `yu-profile-chat`). Select a simple Hello World Worker.
3. Open **Edit code**, replace the existing Worker code with the exact contents of `worker/worker.js`, then **Deploy**.
4. Under Worker **Settings → Variables and Secrets**, add a **Secret** called `OPENAI_API_KEY` with your OpenAI API key created at https://platform.openai.com/api-keys. Do **not** share that key in chat or commit it to GitHub.
5. Note the Worker URL shown by Cloudflare, for example `https://yu-profile-chat.<your-subdomain>.workers.dev`.

## 2. Point the website to the backend
In the GitHub repository's `index.html`, find:
`const AI_ENDPOINT = '';`
Replace it with the full Worker URL (quoted), then commit. GitHub Pages will redeploy the page.

## 3. Test
Open https://yuyuyufufuffu.github.io/yuyuyufufuffu/ and ask "What exams does Yu teach?"
If configured, it should generate a response from the OpenAI model.

## Security and cost considerations
- Keep `OPENAI_API_KEY` in Cloudflare Secrets only. Never paste it into the public frontend.
- OpenAI API usage is billed separately from ChatGPT subscription.
- This is a **publicly accessible chatbot endpoint**, not private access control. Browser Origin checks are not sufficient protection against non-browser clients or automated abuse.
- **Before promoting publicly**, add server-side rate limiting / bot protection (for example Cloudflare rate limiting and Turnstile server-side verification) and spending alerts/limits at your API provider.
- Don't enter private student records. Profile knowledge is limited to publicly shared professional information.
- If you move the website domain, update `ALLOWED_ORIGIN` in the Worker.

## About the AI
The assistant uses OpenAI Responses API and a tightly scoped system prompt. It does not claim to be Yu and does not invent qualifications. You can expand the public profile facts in `SYSTEM`.
