export function clientFail(res, payload = {}) {
  return res.status(200).json({ ok: false, ...payload });
}
