// Escenas de fondo: una por nivel, en ciclo. Cada una es un SVG de 160x90 anclado abajo.
(function () {
  const palm = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 Q3 -14 0 -26" stroke="#7a4b24" stroke-width="2.6" fill="none"/><g fill="#2f9e4f"><path d="M0 -26 Q-12 -33 -19 -21 Q-8 -28 0 -26Z"/><path d="M0 -26 Q12 -33 19 -21 Q8 -28 0 -26Z"/><path d="M0 -26 Q-6 -39 -15 -38 Q-4 -34 0 -26Z"/><path d="M0 -26 Q6 -39 15 -38 Q4 -34 0 -26Z"/><path d="M0 -26 Q-2 -40 0 -43 Q4 -35 0 -26Z"/></g></g>`;
  const pine = (x, y, s = 1, c = '#1f5a3d') => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-1" y="-4" width="2" height="5" fill="#5b3a1e"/><path d="M0 -26 L-8 -4 L8 -4Z" fill="${c}"/><path d="M0 -32 L-6 -14 L6 -14Z" fill="${c}"/></g>`;
  const bush = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  const cloud = (x, y, s, cls = 'drift') => `<g class="${cls}" style="animation-delay:${-x}s"><g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".92"><ellipse cx="0" cy="0" rx="12" ry="4"/><ellipse cx="-6" cy="-3" rx="7" ry="4"/><ellipse cx="5" cy="-4" rx="8" ry="5"/></g></g>`;

  window.SCENES = [
    { // 1 · Copán
      name: 'Ruinas de Copán',
      sky: 'linear-gradient(#4aa8f0, #bfe6ff 70%, #e8f6ff)',
      svg: `<circle cx="132" cy="18" r="9" fill="#ffe27a"/>${cloud(30, 16, 1)}${cloud(90, 26, .8)}
        <path d="M0 62 Q20 44 45 58 T95 52 T160 60 V90H0Z" fill="#3f8f5f"/>
        <path d="M0 70 Q30 56 60 68 T125 64 T160 70 V90H0Z" fill="#2f7a4a"/>
        <g fill="#cdbd8f"><rect x="46" y="62" width="68" height="8"/><rect x="53" y="55" width="54" height="7" fill="#c2b182"/><rect x="60" y="48" width="40" height="7"/><rect x="67" y="41" width="26" height="7" fill="#c2b182"/><rect x="73" y="33" width="14" height="8" fill="#b4a273"/></g>
        <path d="M76 70 H84 L82 41 H78Z" fill="#a89763"/><rect x="75" y="35" width="10" height="2" fill="#8d7c4d"/>
        <rect x="18" y="52" width="7" height="22" rx="1" fill="#8f8a6c"/><rect x="19.5" y="55" width="4" height="4" fill="#6d6850"/>
        ${bush(8, 72, 9, '#1f6b3a')}${bush(140, 72, 10, '#1f6b3a')}${bush(152, 74, 8, '#2f8a4a')}
        <rect y="78" width="160" height="12" fill="#3a9a4a"/>` },
    { // 2 · Caribe
      name: 'Playa del Caribe',
      sky: 'linear-gradient(#32a6e6, #b8e8ff 65%, #e9f9ff)',
      svg: `<circle cx="26" cy="18" r="10" fill="#fff3a6"/>${cloud(70, 14, 1)}${cloud(125, 24, .9)}
        <rect y="50" width="160" height="40" fill="#13b2c8"/><rect y="50" width="160" height="14" fill="#35cde0" opacity=".7"/>
        <g stroke="#fff" stroke-width=".8" fill="none" opacity=".8"><path d="M10 58 q5 -2 10 0 t10 0"/><path d="M70 62 q5 -2 10 0 t10 0"/><path d="M118 56 q5 -2 10 0 t10 0"/><path d="M40 70 q5 -2 10 0 t10 0"/></g>
        <path d="M95 50 L110 50 L102 36Z" fill="#fff"/><path d="M104 50 L118 50 L104 38Z" fill="#ffd05a"/><path d="M92 51 H122 L118 55 H96Z" fill="#8a5a2b"/>
        <path d="M0 84 Q40 70 90 78 T160 74 V90H0Z" fill="#f6dfa4"/>
        ${palm(14, 82, 1.1)}${palm(34, 84, .8)}${palm(142, 82, 1.2)}` },
    { // 3 · Bosque nuboso
      name: 'Bosque nuboso de Celaque',
      sky: 'linear-gradient(#7fa9c9, #cfe0ea 70%, #eef4f6)',
      svg: `<path d="M0 60 L25 28 L48 52 L78 20 L108 50 L134 30 L160 56 V90H0Z" fill="#6f8fa3"/>
        <path d="M0 72 L30 46 L58 66 L92 40 L126 64 L160 48 V90H0Z" fill="#4f7a6a"/>
        <ellipse cx="40" cy="58" rx="40" ry="6" fill="#fff" opacity=".55"/><ellipse cx="120" cy="52" rx="38" ry="5" fill="#fff" opacity=".5"/>
        ${pine(12, 82, 1.3)}${pine(28, 84, 1)}${pine(50, 82, 1.2, '#2a6b48')}${pine(110, 83, 1.1, '#2a6b48')}${pine(130, 82, 1.4)}${pine(148, 84, 1.1)}
        <ellipse cx="80" cy="76" rx="60" ry="5" fill="#fff" opacity=".45"/>
        <rect y="82" width="160" height="8" fill="#2d6b45"/>` },
    { // 4 · Pico Bonito
      name: 'Parque Pico Bonito',
      sky: 'linear-gradient(#9ad7ee, #d8f2d0)',
      svg: `<path d="M0 40 L35 14 L70 34 L105 8 L160 38 V90H0Z" fill="#2c7a4b"/>
        <path d="M70 18 H88 L92 66 H66Z" fill="#fff" opacity=".9"/><path d="M72 20 H78 L77 66 H70Z" fill="#bfe9ff" opacity=".8"/>
        <path d="M0 56 Q40 40 66 56 V90H0Z" fill="#1d6638"/><path d="M160 54 Q120 38 92 56 V90H160Z" fill="#1d6638"/>
        <ellipse cx="79" cy="70" rx="30" ry="7" fill="#58cbdc"/><ellipse cx="79" cy="68" rx="14" ry="3" fill="#fff" opacity=".7"/>
        ${bush(10, 62, 12, '#14502c')}${bush(150, 60, 12, '#14502c')}${bush(30, 74, 10, '#1b6b3a')}${bush(132, 74, 10, '#1b6b3a')}${bush(48, 84, 12, '#14502c')}${bush(112, 84, 12, '#14502c')}
        <rect y="82" width="160" height="8" fill="#14502c"/>` },
    { // 5 · Tegucigalpa
      name: 'Atardecer en Tegucigalpa',
      sky: 'linear-gradient(#6a4c93, #ff8a5c 55%, #ffd58a)',
      svg: `<circle cx="80" cy="56" r="14" fill="#ffe08a"/>
        <path d="M0 58 Q30 40 60 56 T120 50 T160 58 V90H0Z" fill="#6a3f5f"/>
        <path d="M0 72 Q40 54 80 68 T160 64 V90H0Z" fill="#4e2f4b"/>
        <g fill="#f2c14e"><rect x="6" y="62" width="6" height="5"/><rect x="18" y="58" width="6" height="5" fill="#e07a5f"/><rect x="130" y="58" width="7" height="5" fill="#e07a5f"/><rect x="146" y="62" width="6" height="5"/><rect x="34" y="66" width="6" height="5" fill="#81b29a"/></g>
        <g fill="#f4ead2"><rect x="62" y="48" width="36" height="24"/><rect x="62" y="36" width="9" height="14"/><rect x="89" y="36" width="9" height="14"/><path d="M62 36 L66.5 29 L71 36Z M89 36 L93.5 29 L98 36Z" fill="#b5523b"/><path d="M70 48 Q80 38 90 48Z" fill="#e6d7b3"/><rect x="77" y="58" width="6" height="14" fill="#6b4a3a"/></g>
        <rect y="78" width="160" height="12" fill="#3b2540"/>` },
    { // 6 · Lago de Yojoa
      name: 'Lago de Yojoa',
      sky: 'linear-gradient(#ffc8a0, #a6d7f3 70%)',
      svg: `<circle cx="110" cy="40" r="11" fill="#fff0b0"/>
        <path d="M0 52 L22 34 L48 48 L80 28 L112 46 L140 32 L160 48 V90H0Z" fill="#46796a"/>
        <rect y="50" width="160" height="40" fill="#5aa6cc"/><g fill="#fff" opacity=".35"><rect x="96" y="52" width="30" height="2"/><rect x="100" y="57" width="22" height="2"/><rect x="104" y="62" width="14" height="2"/></g>
        <path d="M0 50 L22 34 L48 48 L80 28 L112 46 L140 32 L160 48 V50Z" fill="#46796a"/>
        <g stroke="#2d3a4a" stroke-width=".9" fill="none"><path d="M30 20 q3 -3 6 0 q3 -3 6 0"/><path d="M60 14 q3 -3 6 0 q3 -3 6 0"/></g>
        <path d="M0 80 Q40 68 90 76 T160 72 V90H0Z" fill="#3b8a52"/>
        ${palm(18, 84, 1)}${pine(140, 84, 1.3, '#2a6b48')}${pine(152, 85, 1, '#2a6b48')}` },
  ];
})();
