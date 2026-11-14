// DREAMR — kis JSON Schema-ellenőrző a katalógushoz (külső csomag nélkül).
// A schemas/product.schema.json által használt szabályokat ismeri: type, enum, const, required, properties,
// additionalProperties, items, minItems, pattern, minimum, $ref (#/$defs/…), if/then, anyOf.
export function validate(schema, data) {
  const errors = [];
  const resolve = ref => ref.replace(/^#\//, '').split('/').reduce((o, k) => o[k], schema);
  const typeOf = v => v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v;
  const typeOk = (t, v) => { const a = typeOf(v); return t === a || (t === 'number' && a === 'integer'); };
  function check(s, v, path) {
    if (s === true || s === undefined) return true;
    if (s.$ref) return check(resolve(s.$ref), v, path);
    let ok = true; const fail = msg => { errors.push(`${path || '/'}: ${msg}`); ok = false; };
    if (s.type) { const ts = [].concat(s.type); if (!ts.some(t => typeOk(t, v))) { fail(`típus ${typeOf(v)}, elvárt ${ts.join('|')}`); return false; } }
    if ('const' in s && v !== s.const) fail(`értéke ${JSON.stringify(v)}, elvárt ${JSON.stringify(s.const)}`);
    if (s.enum && !s.enum.includes(v)) fail(`értéke ${JSON.stringify(v)}, megengedett: ${s.enum.join(', ')}`);
    if (s.pattern && typeof v === 'string' && !new RegExp(s.pattern).test(v)) fail(`nem illeszkedik: ${s.pattern} (${v})`);
    if (s.minimum != null && typeof v === 'number' && v < s.minimum) fail(`kisebb, mint ${s.minimum}`);
    if (s.anyOf && !s.anyOf.some(x => { const before = errors.length; const r = check(x, v, path); errors.length = before; return r; })) fail('egyik lehetőségnek sem felel meg');
    if (typeOf(v) === 'object') {
      (s.required || []).forEach(k => { if (!(k in v)) fail(`hiányzó kötelező mező: ${k}`); });
      for (const [k, val] of Object.entries(v)) {
        if (s.properties && k in s.properties) { if (!check(s.properties[k], val, `${path}/${k}`)) ok = false; }
        else if (s.additionalProperties === false) fail(`nem várt mező: ${k}`);
        else if (s.additionalProperties && typeof s.additionalProperties === 'object') { if (!check(s.additionalProperties, val, `${path}/${k}`)) ok = false; }
      }
      if (s.if) { const before = errors.length; const cond = check(s.if, v, path); errors.length = before; if (cond && s.then && !check(s.then, v, path)) ok = false; }
    }
    if (typeOf(v) === 'array') {
      if (s.minItems != null && v.length < s.minItems) fail(`legalább ${s.minItems} elem kell`);
      if (s.items) v.forEach((x, i) => { if (!check(s.items, x, `${path}/${i}`)) ok = false; });
    }
    return ok;
  }
  check(schema, data, '');
  return errors;
}
