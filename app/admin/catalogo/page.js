import { currentUser } from '../../../lib/auth.js';
import Marca from '../../Marca.jsx';
import SelectorIdioma from '../../SelectorIdioma.jsx';
import * as repo from '../../../lib/pricebook/repo.js';
import { describeChange } from '../../../lib/pricebook/diff.js';
import { idiomaActual, LOCALE } from '../../../lib/idioma.js';
import { abrirBorrador, publicar, descartar } from './actions.js';
import { TEXTOS_ADMIN } from './textos.js';

export const dynamic = 'force-dynamic';

const llenar = (plantilla, valores) => plantilla.replace(/\{(\w+)\}/g, (_, k) => valores[k] ?? '');

export default async function CatalogoPage({ searchParams }) {
  const params = await searchParams;
  const lang = await idiomaActual();
  const T = TEXTOS_ADMIN[lang];
  const fecha = (d) => (d
    ? new Date(d).toLocaleString(LOCALE[lang], { dateStyle: 'medium', timeStyle: 'short' })
    : '—');
  const selector = <SelectorIdioma lang={lang} ruta="/admin/catalogo" params={params} />;

  let user;
  try {
    user = await currentUser();
  } catch (error) {
    return (
      <main className="admin">
        <h1>{T.backoffice}</h1>
        {selector}
        <div className="panel warn">
          <p style={{ margin: 0 }}>{T.sinSesion}</p>
          {/* El detalle técnico viene de lib/auth.js, en español: dice qué
              variable falta, y eso lo lee quien despliega. */}
          <p className="muted small" style={{ margin: '8px 0 0' }}>{error.message}</p>
        </div>
      </main>
    );
  }

  const [publicado, borrador, versiones] = await Promise.all([
    repo.getPublished(), repo.getDraft(), repo.listVersions(),
  ]);

  let preview = null;
  if (borrador) {
    try { preview = await repo.previewPublish(); } catch { preview = null; }
  }

  return (
    <>
      {user.devSession && <div className="devwarn">{T.devSession}</div>}

      <header className="topbar">
        <Marca rotulo={T.backoffice} />
        {selector}
        <div className="who">{user.name} · {user.email} · {user.role}</div>
      </header>

      <main className="admin">
        <h1>{T.h1}</h1>
        <p className="lede">{T.lede}</p>

        <section className="panel accent">
          <h2>{T.vigente}</h2>
          {publicado ? (
            <div className="rowline">
              <div>
                <strong>{llenar(T.version, { v: publicado.version })}</strong>{' '}
                <span className="pill pub">{T.estado.published}</span>
                <div className="muted">{llenar(T.desde, { f: fecha(publicado.published_at) })}</div>
              </div>
              <div className="muted">
                {llenar(T.resumen, { p: publicado.model.products.length, h: publicado.model.hardware.length })}
              </div>
            </div>
          ) : <p className="muted" style={{ margin: 0 }}>{T.sinPublicado}</p>}
        </section>

        {!borrador ? (
          <section className="panel">
            <h2>{T.cambiar}</h2>
            <p className="muted" style={{ margin: 0 }}>{T.cambiarTexto}</p>
            <form action={abrirBorrador} className="actions">
              <button className="btn primary" type="submit">{T.abrir}</button>
            </form>
          </section>
        ) : (
          <section className="panel">
            <h2>
              {llenar(T.borradorAbierto, { v: borrador.version })}{' '}
              <span className="pill draft">{T.estado.draft}</span>
            </h2>
            {borrador.note && <p className="muted">{borrador.note}</p>}

            {preview && preview.diff && (
              <>
                <div className="counts">
                  <span className="count">{llenar(T.cambios, { n: preview.diff.counts.total })}</span>
                  {preview.diff.counts.price > 0 && (
                    <span className="count price">{llenar(T.tocanPrecios, { n: preview.diff.counts.price })}</span>
                  )}
                </div>

                {preview.diff.identical ? (
                  <p className="muted">{T.identico}</p>
                ) : (
                  <ul className="changes">
                    {preview.diff.changes.map((c) => (
                      <li key={c.path}>
                        <span className={`tagi ${c.impact}`}>{T.impacto[c.impact]}</span>
                        <code>{describeChange(c)}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {preview && !preview.ready && (
              <div className="err">
                {T.noPublicable}
                <ul>
                  {[...preview.errors, ...preview.missing].map((e, i) => (
                    <li key={i}>{e.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="actions">
              <form action={publicar}>
                <input type="hidden" name="diffCount" value={preview?.diff?.counts.total ?? 0} />
                <button
                  className="btn primary"
                  type="submit"
                  disabled={!preview?.ready || preview?.diff?.identical}
                >
                  {llenar(T.publicar, { v: borrador.version })}
                </button>
              </form>
              <form action={descartar}>
                <button className="btn danger" type="submit">{T.descartar}</button>
              </form>
            </div>
          </section>
        )}

        <section className="panel">
          <h2>{T.historial}</h2>
          {versiones.map((v) => (
            <div className="rowline" key={v.id}>
              <div>
                <strong>v{v.version}</strong>{' '}
                <span className={`pill ${v.status === 'published' ? 'pub' : v.status === 'draft' ? 'draft' : 'arch'}`}>
                  {T.estado[v.status] ?? T.estado.archived}
                </span>
                {v.note && <div className="muted">{v.note}</div>}
              </div>
              <div className="muted">
                {v.published_at
                  ? llenar(T.publicadoEl, { f: fecha(v.published_at) })
                  : llenar(T.creadoEl, { f: fecha(v.created_at) })}
                {v.published_by_email ? ` · ${v.published_by_email}` : ''}
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
