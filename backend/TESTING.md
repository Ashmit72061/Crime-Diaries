API testing with Jest + Supertest

Quickstart

1. Install dev dependencies from the `backend` folder:

```bash
cd backend
npm install
```

2. Run the API tests (uses `PHAROS_TEST=true` to keep background services disabled):

```bash
npm run test:api
```

What the tests do

- Imports the Express `app` exported from `src/app.js` and runs requests in-process via `supertest`.
- Covers a health endpoint and confirms unknown routes return 404 JSON.

How to extend

- Add more tests under `backend/tests/` using Jest and `supertest`.
- To test authenticated endpoints, create fixtures or mock the auth middleware by setting `process.env.PHAROS_TEST` and stubbing modules before importing `app`.
