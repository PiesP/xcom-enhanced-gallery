// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { LanguageStrings } from '@shared/constants/i18n/language-types';

/**
 * Spanish language strings for the application
 */
export const es: LanguageStrings = {
  tb: {
    prev: 'Anterior',
    next: 'Siguiente',
    dl: 'Descargar',
    dlAllCt: 'Descargar los {count} archivos como ZIP',
    setOpen: 'Abrir configuración',
    cls: 'Cerrar',
    twTxt: 'Ver tweet',
    twPanel: 'Panel de texto del tweet',
    twUrl: 'Ver tweet original',
    fitOri: 'Original',
    fitW: 'Ajustar ancho',
    fitH: 'Ajustar alto',
    fitC: 'Ajustar ventana',
    galleryToolbar: 'Barra de herramientas de la galería',
    progress: 'Progreso',
    settingsPanel: 'Panel de configuración',
  },
  st: {
    th: 'Tema',
    lang: 'Idioma',
    thAuto: 'Automático',
    thLt: 'Claro',
    thDk: 'Oscuro',
    langAuto: 'Automático',
    langKo: 'Coreano',
    langEn: 'Inglés',
    langJa: 'Japonés',
    langZhCn: 'Chino simplificado',
    langEs: 'Español',
    langAr: 'Árabe',
  },
  msg: {
    err: {
      t: 'Ocurrió un error',
      b: 'Ocurrió un error inesperado: {error}',
      loadMedia: {
        title: 'Error al cargar contenido multimedia',
        body: 'No se encontraron imágenes ni videos.',
      },
      generic: 'Ocurrió un error',
      loadGallery: 'Error al cargar la galería',
      settingsUnavailable: {
        title: 'Configuración no disponible',
        body: 'Se usarán valores predeterminados hasta que se cargue la configuración.',
      },
      retry: 'Reintentar',
      noMoreRetries: 'No hay más reintentos',
      reset: 'Restablecer',
    },
    kb: {
      t: 'Atajos de teclado',
      prev: 'ArrowLeft: Medio anterior',
      next: 'ArrowRight: Medio siguiente',
      cls: 'Escape: Cerrar galería',
      toggle: '?: Mostrar esta ayuda',
    },
    dl: {
      one: {
        err: {
          t: 'Descarga fallida',
          b: 'No se pudo descargar el archivo: {error}',
        },
      },
      allFail: {
        t: 'Descarga fallida',
        b: 'No se pudo descargar ningún elemento.',
      },
      part: {
        t: 'Fallo parcial',
        b: 'No se pudieron descargar {count} elementos.',
      },
      noMedia: 'Ningún elemento multimedia seleccionado. Reabra la galería e intente de nuevo.',
      zipFail: 'Error al guardar el archivo ZIP',
    },
    gal: {
      emptyT: 'Sin medios disponibles',
      emptyD: 'No hay imágenes ni videos para mostrar.',
      itemLbl: 'Medio {index}: {filename}',
      loadFail: 'Error al cargar {type}',
      imageGallery: 'Galería de imágenes',
      loading: 'Cargando',
      videoCount: 'Video {index} de {total}',
      imageCount: 'Imagen {index} de {total}: {alt}',
      hashtagLabel: 'Hashtag {value}',
    },
  },
};
