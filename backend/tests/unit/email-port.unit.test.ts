import { InMemoryEmailAdapter, __setEmailAdapterForTests, getEmailAdapter } from '../../src/auth/email.port';

describe('email.port', () => {
  afterEach(() => {
    __setEmailAdapterForTests(null);
  });

  it('the in-memory test adapter captures sent messages without delivering anywhere', async () => {
    const adapter = new InMemoryEmailAdapter();
    __setEmailAdapterForTests(adapter);

    await getEmailAdapter().send({ to: 'user@example.com', subject: 'Test', text: 'Hello' });

    expect(adapter.sent).toHaveLength(1);
    expect(adapter.sent[0]).toEqual({ to: 'user@example.com', subject: 'Test', text: 'Hello' });
  });

  it('clear() empties the captured message list', async () => {
    const adapter = new InMemoryEmailAdapter();
    __setEmailAdapterForTests(adapter);

    await getEmailAdapter().send({ to: 'a@example.com', subject: 'x', text: 'y' });
    adapter.clear();

    expect(adapter.sent).toHaveLength(0);
  });

  it('defaults to a non-production (dev) adapter when NODE_ENV is not production', async () => {
    // NODE_ENV=test in this suite (see backend/.env.test) — getEmailAdapter()
    // must never select the production-only adapter here.
    const adapter = getEmailAdapter();
    await expect(adapter.send({ to: 'a@example.com', subject: 'x', text: 'y' })).resolves.toBeUndefined();
  });
});
