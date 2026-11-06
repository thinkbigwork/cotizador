import { currentUser } from '../../../lib/auth.js';
import * as repo from '../../../lib/pricebook/repo.js';
import { describeChange } from '../../../lib/pricebook/diff.js';
import { abrirBorrador, publicar, descartar } from './actions.js';

export const dynamic = 'force-dynamic';

const fecha = (d) => (d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const ETIQUETA = { price: 'precio', structure: 'estructura', text: 'texto' };

export default async function CatalogoPage() {
  let user;
  try {
    user = await currentUser();
  } catch (error) {
    return (
      <main className="admin">
        <h1>Back office</h1>
        <div className="panel warn"><p style={{ margin: 0 }}>{error.message}</p></div>
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
      {user.devSession && (
        <div className="devwarn">
          Sesión de desarrollo · falta conectar el proveedor de identidad antes de publicar esto
        </div>
      )}

      <header className="topbar">
        <div className="brand">Wizor <span>Back office</span></div>
        <div className="who">{user.name} · {user.email} · {user.role}</div>
      </header>

      <main className="admin">
        <h1>Catálogo de precios</h1>
        <p className="lede">
          Un catálogo publicado no se edita nunca. Para cambiar un precio se abre un borrador,
          se revisan las diferencias y se publica una versión nueva. Los contratos ya firmados
          siguen leyéndose con la versión que tenían el día de la firma.
        </p>

        <section className="panel accent">
          <h2>Vigente</h2>
          {publicado ? (
            <div className="rowline">
              <div>
                <strong>Versión {publicado.version}</strong>{' '}
                <span className="pill pub">publicado</span>
                <div className="muted">Desde el {fecha(publicado.published_at)}</div>
              </div>
              <div className="muted">
                {publicado.model.products.length} productos · {publicado.model.hardware.length} equipos
              </div>
            </div>
          ) : <p className="muted" style={{ margin: 0 }}>Todavía no hay ningún catálogo publicado.</p>}
        </section>

        {!borrador ? (
          <section className="panel">
            <h2>Cambiar precios</h2>
            <p className="muted" style={{ margin: 0 }}>
              Se abre un borrador copiando el catálogo vigente. Podés guardarlo a medio hacer
              y seguir después; nadie ve los cambios hasta que lo publiques.
            </p>
            <form action={abrirBorrador} className="actions">
              <button className="btn primary" type="submit">Abrir borrador</button>
            </form>
          </section>
        ) : (
          <section className="panel">
            <h2>
              Borrador abierto · versión {borrador.version} <span className="pill draft">borrador</span>
            </h2>
            {borrador.note && <p className="muted">{borrador.note}</p>}

            {preview && preview.diff && (
              <>
                <div className="counts">
                  <span className="count">{preview.diff.counts.total} cambios</span>
                  {preview.diff.counts.price > 0 && (
                    <span className="count price">{preview.diff.counts.price} tocan precios</span>
                  )}
                </div>

                {preview.diff.identical ? (
                  <p className="muted">El borrador es idéntico al catálogo vigente.</p>
                ) : (
                  <ul className="changes">
                    {preview.diff.changes.map((c) => (
                      <li key={c.path}>
                        <span className={`tagi ${c.impact}`}>{ETIQUETA[c.impact]}</span>
                        <code>{describeChange(c)}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {preview && !preview.ready && (
              <div className="err">
                No se puede publicar todavía:
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
                  Publicar versión {borrador.version}
                </button>
              </form>
              <form action={descartar}>
                <button className="btn danger" type="submit">Descartar borrador</button>
              </form>
            </div>
          </section>
        )}

        <section className="panel">
          <h2>Historial</h2>
          {versiones.map((v) => (
            <div className="rowline" key={v.id}>
              <div>
                <strong>v{v.version}</strong>{' '}
                <span className={`pill ${v.status === 'published' ? 'pub' : v.status === 'draft' ? 'draft' : 'arch'}`}>
                  {v.status === 'published' ? 'publicado' : v.status === 'draft' ? 'borrador' : 'archivado'}
                </span>
                {v.note && <div className="muted">{v.note}</div>}
              </div>
              <div className="muted">
                {v.published_at ? `Publicado ${fecha(v.published_at)}` : `Creado ${fecha(v.created_at)}`}
                {v.published_by_email ? ` · ${v.published_by_email}` : ''}
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
