/* Logo de Wizor con el rótulo de la herramienta al lado.

   Se sirve desde /public como una imagen común, sin next/image: importarlo
   como módulo obliga a Next a procesarlo con `sharp` al compilar, y si sharp
   no está para la plataforma el build falla. El portero deja pasar esta ruta
   (ver middleware.js) para que el logo se vea en la propia pantalla de acceso.

   Es blanco sobre transparente: solo sirve sobre los fondos oscuros de la
   marca. No usarlo en la hoja impresa (fondo claro). */

export const LOGO = '/logo-wizor.png';

export default function Marca({ rotulo }) {
  return (
    <div className="brand">
      {/* 840×278: el alto lo fija el CSS y el ancho sale de la proporción. */}
      <img src={LOGO} alt="Wizor" width={840} height={278} className="brand-logo" />
      {rotulo && <span>{rotulo}</span>}
    </div>
  );
}
