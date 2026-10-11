export default async function teardown() {
  const it = globalThis.__LIFEOS_IT__;
  if (!it) return;
  await it.shim.close();
  it.pgInst.stop();
}
